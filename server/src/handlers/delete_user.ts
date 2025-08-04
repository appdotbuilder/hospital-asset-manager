
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteUserInputSchema = z.object({
    id: z.number()
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<{ success: boolean }> {
    try {
        // Delete the user by ID
        const result = await db.delete(usersTable)
            .where(eq(usersTable.id, input.id))
            .returning()
            .execute();

        // Return success if a user was deleted
        return { success: result.length > 0 };
    } catch (error) {
        console.error('User deletion failed:', error);
        throw error;
    }
}
