
import { db } from '../db';
import { repairRequestsTable, assetsTable, usersTable } from '../db/schema';
import { type CreateRepairRequestInput, type RepairRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const createRepairRequest = async (input: CreateRepairRequestInput): Promise<RepairRequest> => {
  try {
    // Validate that the asset exists
    const asset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.asset_id))
      .execute();

    if (asset.length === 0) {
      throw new Error(`Asset with id ${input.asset_id} not found`);
    }

    // Validate that the requesting user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.requested_by_user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.requested_by_user_id} not found`);
    }

    // Create the repair request
    const result = await db.insert(repairRequestsTable)
      .values({
        asset_id: input.asset_id,
        requested_by_user_id: input.requested_by_user_id,
        description: input.description,
        priority: input.priority,
        status: 'pending', // Default status
        requested_date: new Date(),
        completed_date: null,
        admin_notes: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Repair request creation failed:', error);
    throw error;
  }
};
