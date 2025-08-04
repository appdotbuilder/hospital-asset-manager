
import { db } from '../db';
import { repairRequestsTable } from '../db/schema';
import { type UpdateRepairRequestInput, type RepairRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRepairRequest = async (input: UpdateRepairRequestInput): Promise<RepairRequest> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.completed_date !== undefined) {
      updateData.completed_date = input.completed_date;
    }
    
    if (input.admin_notes !== undefined) {
      updateData.admin_notes = input.admin_notes;
    }

    // Update the repair request
    const result = await db.update(repairRequestsTable)
      .set(updateData)
      .where(eq(repairRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Repair request with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Repair request update failed:', error);
    throw error;
  }
};
