
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { maintenanceSchedulesTable, usersTable, assetsTable } from '../db/schema';
import { type CreateMaintenanceScheduleInput } from '../schema';
import { createMaintenanceSchedule } from '../handlers/create_maintenance_schedule';
import { eq } from 'drizzle-orm';

describe('createMaintenanceSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        department: 'IT'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestAsset = async () => {
    const user = await createTestUser();
    const result = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        type: 'medical_equipment',
        department: 'Healthcare',
        location: 'Room 101',
        serial_number: 'TEST123',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: user.id
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a maintenance schedule', async () => {
    const asset = await createTestAsset();
    const scheduledDate = new Date('2024-06-01');
    
    const testInput: CreateMaintenanceScheduleInput = {
      asset_id: asset.id,
      scheduled_date: scheduledDate,
      maintenance_type: 'Preventive Maintenance',
      notes: 'Regular maintenance check'
    };

    const result = await createMaintenanceSchedule(testInput);

    // Basic field validation
    expect(result.asset_id).toEqual(asset.id);
    expect(result.scheduled_date).toEqual(scheduledDate);
    expect(result.maintenance_type).toEqual('Preventive Maintenance');
    expect(result.notes).toEqual('Regular maintenance check');
    expect(result.status).toEqual('scheduled');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_date).toBeNull();
  });

  it('should save maintenance schedule to database', async () => {
    const asset = await createTestAsset();
    const scheduledDate = new Date('2024-06-01');
    
    const testInput: CreateMaintenanceScheduleInput = {
      asset_id: asset.id,
      scheduled_date: scheduledDate,
      maintenance_type: 'Emergency Repair',
      notes: null
    };

    const result = await createMaintenanceSchedule(testInput);

    // Query using proper drizzle syntax
    const schedules = await db.select()
      .from(maintenanceSchedulesTable)
      .where(eq(maintenanceSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].asset_id).toEqual(asset.id);
    expect(schedules[0].scheduled_date).toEqual(scheduledDate);
    expect(schedules[0].maintenance_type).toEqual('Emergency Repair');
    expect(schedules[0].notes).toBeNull();
    expect(schedules[0].status).toEqual('scheduled');
    expect(schedules[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent asset', async () => {
    const testInput: CreateMaintenanceScheduleInput = {
      asset_id: 99999, // Non-existent asset
      scheduled_date: new Date('2024-06-01'),
      maintenance_type: 'Preventive Maintenance',
      notes: 'Test notes'
    };

    await expect(createMaintenanceSchedule(testInput))
      .rejects.toThrow(/Asset with id 99999 not found/i);
  });

  it('should handle maintenance schedule with null notes', async () => {
    const asset = await createTestAsset();
    
    const testInput: CreateMaintenanceScheduleInput = {
      asset_id: asset.id,
      scheduled_date: new Date('2024-07-15'),
      maintenance_type: 'Calibration',
      notes: null
    };

    const result = await createMaintenanceSchedule(testInput);

    expect(result.notes).toBeNull();
    expect(result.maintenance_type).toEqual('Calibration');
    expect(result.status).toEqual('scheduled');
  });
});
