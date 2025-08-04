
import { db } from '../db';
import { repairRequestsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetRepairRequestsByUserInput, type RepairRequest } from '../schema';

export const getRepairRequestsByUser = async (input: GetRepairRequestsByUserInput): Promise<RepairRequest[]> => {
  try {
    const results = await db.select()
      .from(repairRequestsTable)
      .where(eq(repairRequestsTable.requested_by_user_id, input.user_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get repair requests by user:', error);
    throw error;
  }
};
