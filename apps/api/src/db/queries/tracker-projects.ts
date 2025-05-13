import type { Database } from "@api/db";
import {
  customers,
  tags,
  teams,
  trackerProjectTags,
  trackerProjects,
} from "@api/db/schema";
import { buildSearchQuery } from "@api/utils/search";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";

export type GetTrackerProjectsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  filter?: {
    q?: string | null;
    start?: string | null;
    end?: string | null;
    status?: "in_progress" | "completed" | null;
    customers?: string[] | null;
    tags?: string[] | null;
  };
  sort?: string[] | null;
};

type AssignedUser = {
  user_id: string;
  full_name: string;
  avatar_url: string;
};

export async function getTrackerProjects(
  db: Database,
  params: GetTrackerProjectsParams,
) {
  const { teamId, filter, sort, cursor, pageSize = 25 } = params;
  const {
    q,
    status,
    start,
    end,
    customers: customerIds,
    tags: tagIds,
  } = filter || {};

  try {
    const whereConditions: SQL[] = [eq(trackerProjects.teamId, teamId)];

    // Apply status filter
    if (status) {
      whereConditions.push(eq(trackerProjects.status, status));
    }

    // Apply date range filter
    if (start && end) {
      whereConditions.push(gte(trackerProjects.createdAt, start));
      whereConditions.push(lte(trackerProjects.createdAt, end));
    }

    // Apply customer filter
    if (customerIds && customerIds.length > 0) {
      whereConditions.push(inArray(trackerProjects.customerId, customerIds));
    }

    // Apply tag filter
    if (tagIds && tagIds.length > 0) {
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${trackerProjectTags}
          WHERE ${trackerProjectTags.trackerProjectId} = ${trackerProjects.id}
          AND ${trackerProjectTags.tagId} IN (${sql.join(tagIds, sql`, `)})
        )`,
      );
    }

    // Apply search query filter
    if (q) {
      const query = buildSearchQuery(q);
      whereConditions.push(
        sql`to_tsquery('english', ${query}) @@ ${trackerProjects.fts}`,
      );
    }

    // Start building the query
    const query = db
      .select({
        id: trackerProjects.id,
        name: trackerProjects.name,
        description: trackerProjects.description,
        status: trackerProjects.status,
        customerId: trackerProjects.customerId,
        estimate: trackerProjects.estimate,
        currency: trackerProjects.currency,
        teamId: trackerProjects.teamId,
        createdAt: trackerProjects.createdAt,
        totalDuration: sql<number>`total_duration(${trackerProjects})`.as(
          "total_duration",
        ),
        totalAmount:
          sql<number>`get_project_total_amount(${trackerProjects})`.as(
            "total_amount",
          ),
        customer: {
          id: customers.id,
          name: customers.name,
          website: customers.website,
        },
        team: {
          name: teams.name,
        },
      })
      .from(trackerProjects)
      .leftJoin(customers, eq(trackerProjects.customerId, customers.id))
      .leftJoin(teams, eq(trackerProjects.teamId, teams.id))
      .where(and(...whereConditions));

    // Apply sorting
    if (sort && sort.length === 2) {
      const [column, direction] = sort;
      const isAscending = direction === "asc";

      if (column === "time") {
        // Sort by total_duration
        isAscending
          ? query.orderBy(asc(sql`total_duration`))
          : query.orderBy(desc(sql`total_duration`));
      } else if (column === "amount") {
        // Sort by total_amount
        isAscending
          ? query.orderBy(asc(sql`total_amount`))
          : query.orderBy(desc(sql`total_amount`));
      } else if (column === "assigned") {
        // Sort by assigned users count using a direct count query
        const assignedUsersCountSQL = sql<number>`(
          SELECT COUNT(DISTINCT te.assigned_id)
          FROM public.tracker_entries te
          WHERE te.project_id = ${trackerProjects.id}
        )`;
        isAscending
          ? query.orderBy(asc(assignedUsersCountSQL))
          : query.orderBy(desc(assignedUsersCountSQL));
      } else if (column === "customer") {
        isAscending
          ? query.orderBy(asc(customers.name))
          : query.orderBy(desc(customers.name));
      } else if (column === "tags") {
        // Sort by tag count
        const tagCountSQL = sql<number>`(
        SELECT COUNT(*)
        FROM tracker_project_tags
        WHERE tracker_project_id = ${trackerProjects.id}
      )`;
        isAscending
          ? query.orderBy(asc(tagCountSQL))
          : query.orderBy(desc(tagCountSQL));
      } else if (column === "created_at") {
        isAscending
          ? query.orderBy(asc(trackerProjects.createdAt))
          : query.orderBy(desc(trackerProjects.createdAt));
      } else if (column === "name") {
        isAscending
          ? query.orderBy(asc(trackerProjects.name))
          : query.orderBy(desc(trackerProjects.name));
      }
    } else {
      // Default sort by created_at descending
      query.orderBy(desc(trackerProjects.createdAt));
    }

    // Apply pagination
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    query.limit(pageSize).offset(offset);

    // Execute query to get projects
    const projectsData = await query;

    // Get tags for each project
    const projectIds = projectsData.map((project) => project.id);

    const projectTags =
      projectIds.length > 0
        ? await db
            .select({
              projectId: trackerProjectTags.trackerProjectId,
              tagId: trackerProjectTags.tagId,
              tagName: tags.name,
            })
            .from(trackerProjectTags)
            .leftJoin(tags, eq(trackerProjectTags.tagId, tags.id))
            .where(inArray(trackerProjectTags.trackerProjectId, projectIds))
        : [];

    // Get assigned users for each project using PostgreSQL function
    const assignedUsers: {
      project_id: string;
      users: AssignedUser[];
    }[] =
      projectIds.length > 0
        ? await db.execute(
            sql`SELECT id as project_id, get_assigned_users_for_project(tracker_projects) as users
              FROM tracker_projects
              WHERE id IN (${sql.join(projectIds, sql`, `)})`,
          )
        : [];

    // Combine the data
    const data = projectsData.map((project) => {
      const projectTagsList = projectTags
        .filter((pt) => pt.projectId === project.id)
        .map((pt) => ({
          id: pt.tagId,
          tag: { id: pt.tagId, name: pt.tagName },
        }));

      const projectUsersList =
        assignedUsers.find((pu) => pu.project_id === project.id)?.users || [];

      return {
        ...project,
        tags: projectTagsList,
        users: projectUsersList?.map((user) => ({
          id: user.user_id,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        })),
      };
    });

    // Calculate next cursor
    const nextCursor =
      data.length === pageSize ? (offset + pageSize).toString() : undefined;

    return {
      meta: {
        cursor: nextCursor,
        hasPreviousPage: offset > 0,
        hasNextPage: data.length === pageSize,
      },
      data,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
