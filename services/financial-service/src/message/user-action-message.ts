import { z } from 'zod';

// Define the enum for action types
export enum UserActionType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    READ = 'read',
    LOGIN = 'login',
    LOGOUT = 'logout',
}

export const UserActionMessageBodySchema = z.object({
    actionType: z.nativeEnum(UserActionType),
    userId: z.string(),
    timestamp: z.number(),
    workspaceId: z.string(),
    
    payload: z.record(z.unknown()),

    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    status: z.enum(['success', 'failure', 'pending']),
    errorMessage: z.string().optional(),

    clientVersion: z.string().optional(),
    serverVersion: z.string().optional(),

    environment: z.enum(['production', 'staging', 'development']),
    source: z.enum(['web', 'mobile', 'api']),

    actionReason: z.string().optional(),

    sessionId: z.string().optional(),
    correlationId: z.string().optional(),

    auditLogContext: z.object({
        location: z.string(),
        userAgent: z.string(),
        ipAddress: z.string(),
        referer: z.string().optional(),
    }),
});

export type UserActionMessageBody = z.infer<typeof UserActionMessageBodySchema>;