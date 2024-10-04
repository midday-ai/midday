import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserAccountDatabaseClient } from "../../../src/pkg/database/user-account-client";
import { DatabaseError } from "../../../src/pkg/errors";

describe("UserAccountDatabaseClient", () => {
  let db: D1Database;
  let client: UserAccountDatabaseClient;

  beforeEach(async () => {
    db = env.DATABASE;
    client = await UserAccountDatabaseClient.getInstance(db);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Email Validation", () => {
    it("should validate correct email", () => {
      const email = "test@example.com";
      expect(() => (client as any).validateEmail(email)).not.toThrow();
    });

    it("should throw error for invalid email", () => {
      const invalidEmail = "invalid-email";
      expect(() => (client as any).validateEmail(invalidEmail)).toThrow(
        DatabaseError,
      );
    });
  });

  describe("Username Validation", () => {
    it("should validate correct username", () => {
      const username = "validuser";
      expect(() => (client as any).validateUsername(username)).not.toThrow();
    });

    it("should throw error for empty username", () => {
      const emptyUsername = "";
      expect(() => (client as any).validateUsername(emptyUsername)).toThrow(
        DatabaseError,
      );
    });
  });

  describe("Supabase Auth0 User ID Validation", () => {
    it("should validate correct Supabase Auth0 User ID", () => {
      const id = "1234567890";
      expect(() =>
        (client as any).validateSupabaseAuth0UserId(id),
      ).not.toThrow();
    });

    it("should throw error for empty Supabase Auth0 User ID", () => {
      const emptyId = "";
      expect(() =>
        (client as any).validateSupabaseAuth0UserId(emptyId),
      ).toThrow(DatabaseError);
    });
  });

  describe("Error Handling", () => {
    it("should throw DatabaseError for invalid email", async () => {
      await expect(
        client.createUserAccount({
          email: "invalid-email",
          username: "testuser",
          supabaseAuth0UserId: "1234567890",
        }),
      ).rejects.toThrow(DatabaseError);
    });

    it("should throw DatabaseError for empty username", async () => {
      await expect(
        client.createUserAccount({
          email: "test@example.com",
          username: "",
          supabaseAuth0UserId: "1234567890",
        }),
      ).rejects.toThrow(DatabaseError);
    });

    it("should throw DatabaseError for empty Supabase Auth0 User ID", async () => {
      await expect(
        client.createUserAccount({
          email: "test@example.com",
          username: "testuser",
          supabaseAuth0UserId: "",
        }),
      ).rejects.toThrow(DatabaseError);
    });
  });
});

//   describe('User Account Operations', () => {
//     const testUser = {
//       email: 'test@example.com',
//       username: 'testuser',
//       supabaseAuth0UserId: '1234567890',
//     };

//     it('should create a user account', async () => {
//       const userAccount = await client.createUserAccount(testUser);
//       expect(userAccount).toBeDefined();
//       expect(userAccount.email).toBe(testUser.email);
//       expect(userAccount.username).toBe(testUser.username);
//     });

//     it('should check if user account exists', async () => {
//       await client.createUserAccount(testUser);
//       const exists = await client.checkUserAccountExists(testUser.email, testUser.username);
//       expect(exists).toBe(true);
//     });

//     it('should throw error when creating duplicate user account', async () => {
//       await client.createUserAccount(testUser);
//       await expect(client.createUserAccount(testUser)).rejects.toThrow(DatabaseError);
//     });

//     it('should get user account by Auth0 User ID', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const fetchedUser = await client.getUserAccountByAuthUserId({ supabaseAuth0UserId: testUser.supabaseAuth0UserId });
//       expect(fetchedUser).toEqual(createdUser);
//     });

//     it('should get user account by email', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const fetchedUser = await client.getUserAccountByAuthUserId({ email: testUser.email });
//       expect(fetchedUser).toEqual(createdUser);
//     });

//     it('should get user account by username', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const fetchedUser = await client.getUserAccountByAuthUserId({ username: testUser.username });
//       expect(fetchedUser).toEqual(createdUser);
//     });

//     it('should return null for non-existent user', async () => {
//       const fetchedUser = await client.getUserAccountByAuthUserId({ email: 'nonexistent@example.com' });
//       expect(fetchedUser).toBeNull();
//     });

//     it('should update user account', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const updatedUser = await client.updateUserAccount(createdUser.id, { firstname: 'John', lastname: 'Doe' });
//       expect(updatedUser.firstname).toBe('John');
//       expect(updatedUser.lastname).toBe('Doe');
//     });

//     it('should soft delete user account', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const deleted = await client.softDeleteUserAccount({ id: createdUser.id });
//       expect(deleted).toBe(true);
//       const fetchedUser = await client.getUserAccountById(createdUser.id);
//       expect(fetchedUser?.isActive).toBe(false);
//     });

//     it('should hard delete user account', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const deleted = await client.hardDeleteUserAccount({ id: createdUser.id });
//       expect(deleted).toBe(true);
//       const fetchedUser = await client.getUserAccountById(createdUser.id);
//       expect(fetchedUser).toBeNull();
//     });

//     it('should verify user email', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const verifiedUser = await client.verifyUserEmail(createdUser.id);
//       expect(verifiedUser.isEmailVerified).toBe(true);
//       expect(verifiedUser.verifiedAt).toBeDefined();
//     });

//     it('should search user accounts', async () => {
//       await client.createUserAccount(testUser);
//       const searchResults = await client.searchUserAccounts(testUser.email);
//       expect(searchResults.length).toBeGreaterThan(0);
//       expect(searchResults[0].email).toBe(testUser.email);
//     });

//     it('should get recently created accounts', async () => {
//       await client.createUserAccount(testUser);
//       const recentAccounts = await client.getRecentlyCreatedAccounts(1);
//       expect(recentAccounts.length).toBe(1);
//       expect(recentAccounts[0].email).toBe(testUser.email);
//     });

//     it('should update profile image', async () => {
//       const createdUser = await client.createUserAccount(testUser);
//       const updatedUser = await client.updateProfileImage(createdUser.id, 'https://example.com/image.jpg');
//       expect(updatedUser.profileImageUrl).toBe('https://example.com/image.jpg');
//     });
//   });

//   describe('Error Handling', () => {
//     it('should throw DatabaseError for invalid email', async () => {
//       await expect(client.createUserAccount({
//         email: 'invalid-email',
//         username: 'testuser',
//         supabaseAuth0UserId: '1234567890',
//       })).rejects.toThrow(DatabaseError);
//     });

//     it('should throw DatabaseError for empty username', async () => {
//       await expect(client.createUserAccount({
//         email: 'test@example.com',
//         username: '',
//         supabaseAuth0UserId: '1234567890',
//       })).rejects.toThrow(DatabaseError);
//     });

//     it('should throw DatabaseError for empty Supabase Auth0 User ID', async () => {
//       await expect(client.createUserAccount({
//         email: 'test@example.com',
//         username: 'testuser',
//         supabaseAuth0UserId: '',
//       })).rejects.toThrow(DatabaseError);
//     });

//     it('should throw DatabaseError when updating non-existent user', async () => {
//       await expect(client.updateUserAccount(9999, { firstname: 'John' })).rejects.toThrow(DatabaseError);
//     });

//     it('should throw DatabaseError when deleting non-existent user', async () => {
//       await expect(client.hardDeleteUserAccount({ id: 9999 })).toBe(false);
//     });
//   });
// });
