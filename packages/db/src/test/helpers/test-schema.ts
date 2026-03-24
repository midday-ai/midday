export * from "../../schema";

// Override usersInAuth to prevent drizzle-kit from creating the "auth.users"
// table, which has a "users_pkey" constraint that collides with the "users"
// table's auto-generated primary key constraint of the same name.
export const usersInAuth = undefined as any;
export const usersInAuthRelations = undefined as any;
