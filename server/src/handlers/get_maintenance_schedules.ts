
import { db } from '../db';
import { maintenanceSchedulesTable } from '../db/schema';
import { type MaintenanceSchedule } from '../schema';

export const getMaintenanceSchedules = async (): Promise<MaintenanceSchedule[]> => {
  try {
    const results = await db.select()
      .from(maintenanceSchedulesTable)
      .execute();

    return results.map(schedule => ({
      ...schedule,
      // All date fields are already Date objects from timestamp columns
      scheduled_date: schedule.scheduled_date,
      completed_date: schedule.completed_date,
      created_at: schedule.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch maintenance schedules:', error);
    throw error;
  }
};
