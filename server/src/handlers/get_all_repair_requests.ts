
import { db } from '../db';
import { repairRequestsTable } from '../db/schema';
import { type RepairRequest } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllRepairRequests = async (): Promise<RepairRequest[]> => {
  try {
    const results = await db.select()
      .from(repairRequestsTable)
      .orderBy(desc(repairRequestsTable.created_at))
      .execute();

    return results.map(request => ({
      ...request,
      // Convert Date objects to ensure proper type inference
      requested_date: request.requested_date,
      completed_date: request.completed_date,
      created_at: request.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch all repair requests:', error);
    throw error;
  }
};
