
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type DeleteUserInput } from '../handlers/delete_user';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should delete an existing user', async () => {
        // Create a test user first
        const testUser = await db.insert(usersTable)
            .values({
                username: 'testuser',
                email: 'test@example.com',
                role: 'regular',
                department: 'IT'
            })
            .returning()
            .execute();

        const userId = testUser[0].id;
        const input: DeleteUserInput = { id: userId };

        // Delete the user
        const result = await deleteUser(input);

        // Verify deletion was successful
        expect(result.success).toBe(true);

        // Verify user no longer exists in database
        const deletedUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .execute();

        expect(deletedUser).toHaveLength(0);
    });

    it('should return false when user does not exist', async () => {
        const input: DeleteUserInput = { id: 99999 };

        const result = await deleteUser(input);

        expect(result.success).toBe(false);
    });

    it('should not affect other users when deleting one user', async () => {
        // Create two test users
        const users = await db.insert(usersTable)
            .values([
                {
                    username: 'user1',
                    email: 'user1@example.com',
                    role: 'regular',
                    department: 'IT'
                },
                {
                    username: 'user2',
                    email: 'user2@example.com',
                    role: 'admin',
                    department: 'HR'
                }
            ])
            .returning()
            .execute();

        const user1Id = users[0].id;
        const user2Id = users[1].id;

        // Delete first user
        const input: DeleteUserInput = { id: user1Id };
        const result = await deleteUser(input);

        expect(result.success).toBe(true);

        // Verify first user is deleted
        const deletedUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, user1Id))
            .execute();

        expect(deletedUser).toHaveLength(0);

        // Verify second user still exists
        const remainingUser = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, user2Id))
            .execute();

        expect(remainingUser).toHaveLength(1);
        expect(remainingUser[0].username).toBe('user2');
        expect(remainingUser[0].email).toBe('user2@example.com');
    });
});
