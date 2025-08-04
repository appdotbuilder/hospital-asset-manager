
import { db } from '../db';
import { assetsTable, usersTable } from '../db/schema';
import { type CreateAssetInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export const createAsset = async (input: CreateAssetInput): Promise<Asset> => {
  try {
    // Verify assigned user exists if provided
    if (input.assigned_user_id) {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.assigned_user_id))
        .execute();
      
      if (user.length === 0) {
        throw new Error(`User with id ${input.assigned_user_id} does not exist`);
      }
    }

    // Insert asset record
    const result = await db.insert(assetsTable)
      .values({
        name: input.name,
        type: input.type,
        department: input.department,
        location: input.location,
        serial_number: input.serial_number,
        purchase_date: input.purchase_date,
        status: input.status,
        assigned_user_id: input.assigned_user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Asset creation failed:', error);
    throw error;
  }
};
