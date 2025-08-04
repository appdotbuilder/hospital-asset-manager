
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable, maintenanceSchedulesTable } from '../db/schema';
import { getMaintenanceSchedules } from '../handlers/get_maintenance_schedules';

describe('getMaintenanceSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no maintenance schedules exist', async () => {
    const result = await getMaintenanceSchedules();
    expect(result).toEqual([]);
  });

  it('should return all maintenance schedules', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'IT'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Equipment',
        type: 'it_device',
        department: 'IT',
        location: 'Office A',
        serial_number: 'TEST001',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: userId
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Create test maintenance schedules
    const scheduledDate1 = new Date('2024-01-15');
    const scheduledDate2 = new Date('2024-02-15');
    const completedDate = new Date('2024-01-10');

    await db.insert(maintenanceSchedulesTable)
      .values([
        {
          asset_id: assetId,
          scheduled_date: scheduledDate1,
          maintenance_type: 'Routine Inspection',
          status: 'scheduled',
          notes: 'Regular check-up'
        },
        {
          asset_id: assetId,
          scheduled_date: scheduledDate2,
          maintenance_type: 'Deep Cleaning',
          status: 'completed',
          notes: null,
          completed_date: completedDate
        }
      ])
      .execute();

    const result = await getMaintenanceSchedules();

    expect(result).toHaveLength(2);

    // Verify first schedule
    const schedule1 = result.find(s => s.maintenance_type === 'Routine Inspection');
    expect(schedule1).toBeDefined();
    expect(schedule1!.asset_id).toEqual(assetId);
    expect(schedule1!.scheduled_date).toEqual(scheduledDate1);
    expect(schedule1!.status).toEqual('scheduled');
    expect(schedule1!.notes).toEqual('Regular check-up');
    expect(schedule1!.completed_date).toBeNull();
    expect(schedule1!.created_at).toBeInstanceOf(Date);

    // Verify second schedule
    const schedule2 = result.find(s => s.maintenance_type === 'Deep Cleaning');
    expect(schedule2).toBeDefined();
    expect(schedule2!.asset_id).toEqual(assetId);
    expect(schedule2!.scheduled_date).toEqual(scheduledDate2);
    expect(schedule2!.status).toEqual('completed');
    expect(schedule2!.notes).toBeNull();
    expect(schedule2!.completed_date).toEqual(completedDate);
    expect(schedule2!.created_at).toBeInstanceOf(Date);
  });

  it('should return schedules with different statuses', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        department: 'Maintenance'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Medical Device',
        type: 'medical_equipment',
        department: 'Healthcare',
        location: 'Room 101',
        serial_number: 'MED001',
        purchase_date: new Date('2022-05-01'),
        status: 'active',
        assigned_user_id: userId
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Create schedules with different statuses
    await db.insert(maintenanceSchedulesTable)
      .values([
        {
          asset_id: assetId,
          scheduled_date: new Date('2024-03-01'),
          maintenance_type: 'Scheduled Maintenance',
          status: 'scheduled',
          notes: 'Upcoming maintenance'
        },
        {
          asset_id: assetId,
          scheduled_date: new Date('2024-01-01'),
          maintenance_type: 'Overdue Maintenance',
          status: 'overdue',
          notes: 'Past due date'
        },
        {
          asset_id: assetId,
          scheduled_date: new Date('2023-12-01'),
          maintenance_type: 'Completed Maintenance',
          status: 'completed',
          notes: 'Successfully completed',
          completed_date: new Date('2023-12-02')
        }
      ])
      .execute();

    const result = await getMaintenanceSchedules();

    expect(result).toHaveLength(3);

    const statuses = result.map(s => s.status);
    expect(statuses).toContain('scheduled');
    expect(statuses).toContain('overdue');
    expect(statuses).toContain('completed');

    // Verify only completed schedule has completed_date
    const completedSchedule = result.find(s => s.status === 'completed');
    expect(completedSchedule!.completed_date).toBeInstanceOf(Date);

    const nonCompletedSchedules = result.filter(s => s.status !== 'completed');
    nonCompletedSchedules.forEach(schedule => {
      expect(schedule.completed_date).toBeNull();
    });
  });
});
