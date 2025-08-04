
import { db } from '../db';
import { maintenanceSchedulesTable, assetsTable } from '../db/schema';
import { type CreateMaintenanceScheduleInput, type MaintenanceSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createMaintenanceSchedule = async (input: CreateMaintenanceScheduleInput): Promise<MaintenanceSchedule> => {
  try {
    // Verify that the referenced asset exists
    const existingAsset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.asset_id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Asset with id ${input.asset_id} not found`);
    }

    // Insert maintenance schedule record
    const result = await db.insert(maintenanceSchedulesTable)
      .values({
        asset_id: input.asset_id,
        scheduled_date: input.scheduled_date,
        maintenance_type: input.maintenance_type,
        notes: input.notes,
        status: 'scheduled' // Default status as defined in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Maintenance schedule creation failed:', error);
    throw error;
  }
};
