
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  assetsTable, 
  maintenanceSchedulesTable, 
  repairRequestsTable 
} from '../db/schema';
import { getAssetReports } from '../handlers/get_asset_reports';

describe('getAssetReports', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty report when no data exists', async () => {
    const result = await getAssetReports();

    expect(result.total_assets).toEqual(0);
    expect(result.assets_by_status).toEqual({});
    expect(result.assets_by_department).toEqual({});
    expect(result.assets_by_type).toEqual({});
    expect(result.maintenance_due).toEqual(0);
    expect(result.repair_requests_pending).toEqual(0);
  });

  it('should generate comprehensive asset reports', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'Engineering'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test assets with various statuses, departments, and types
    const assetsResult = await db.insert(assetsTable)
      .values([
        {
          name: 'Medical Device 1',
          type: 'medical_equipment',
          department: 'Healthcare',
          location: 'Room 101',
          serial_number: 'MD001',
          purchase_date: new Date('2023-01-01'),
          status: 'active',
          assigned_user_id: userId
        },
        {
          name: 'Office Chair',
          type: 'furniture',
          department: 'HR',
          location: 'Office 201',
          serial_number: 'FC001',
          purchase_date: new Date('2023-02-01'),
          status: 'damaged',
          assigned_user_id: null
        },
        {
          name: 'Laptop',
          type: 'it_device',
          department: 'Engineering',
          location: 'Desk 301',
          serial_number: 'LT001',
          purchase_date: new Date('2023-03-01'),
          status: 'active',
          assigned_user_id: userId
        },
        {
          name: 'Medical Device 2',
          type: 'medical_equipment',
          department: 'Healthcare',
          location: 'Room 102',
          serial_number: 'MD002',
          purchase_date: new Date('2023-04-01'),
          status: 'under_repair',
          assigned_user_id: null
        }
      ])
      .returning()
      .execute();

    // Create overdue maintenance schedule
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(maintenanceSchedulesTable)
      .values({
        asset_id: assetsResult[0].id,
        scheduled_date: yesterday,
        maintenance_type: 'routine_check',
        status: 'scheduled',
        notes: 'Regular maintenance'
      })
      .execute();

    // Create pending repair request
    await db.insert(repairRequestsTable)
      .values({
        asset_id: assetsResult[1].id,
        requested_by_user_id: userId,
        description: 'Chair is broken',
        priority: 'high',
        status: 'pending'
      })
      .execute();

    const result = await getAssetReports();

    // Verify total assets
    expect(result.total_assets).toEqual(4);

    // Verify assets by status
    expect(result.assets_by_status).toEqual({
      'active': 2,
      'damaged': 1,
      'under_repair': 1
    });

    // Verify assets by department
    expect(result.assets_by_department).toEqual({
      'Healthcare': 2,
      'HR': 1,
      'Engineering': 1
    });

    // Verify assets by type
    expect(result.assets_by_type).toEqual({
      'medical_equipment': 2,
      'furniture': 1,
      'it_device': 1
    });

    // Verify maintenance due count
    expect(result.maintenance_due).toEqual(1);

    // Verify pending repair requests count
    expect(result.repair_requests_pending).toEqual(1);
  });

  it('should handle multiple maintenance schedules and repair requests', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        department: 'IT'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test assets
    const assetsResult = await db.insert(assetsTable)
      .values([
        {
          name: 'Vehicle 1',
          type: 'vehicle',
          department: 'Transport',
          location: 'Garage A',
          serial_number: 'VH001',
          purchase_date: new Date('2023-01-01'),
          status: 'active',
          assigned_user_id: userId
        },
        {
          name: 'Vehicle 2',
          type: 'vehicle',
          department: 'Transport',
          location: 'Garage B',
          serial_number: 'VH002',
          purchase_date: new Date('2023-02-01'),
          status: 'inactive',
          assigned_user_id: null
        }
      ])
      .returning()
      .execute();

    // Create multiple overdue maintenance schedules
    const pastDate1 = new Date();
    pastDate1.setDate(pastDate1.getDate() - 2);
    const pastDate2 = new Date();
    pastDate2.setDate(pastDate2.getDate() - 5);

    await db.insert(maintenanceSchedulesTable)
      .values([
        {
          asset_id: assetsResult[0].id,
          scheduled_date: pastDate1,
          maintenance_type: 'oil_change',
          status: 'scheduled',
          notes: 'Monthly oil change'
        },
        {
          asset_id: assetsResult[1].id,
          scheduled_date: pastDate2,
          maintenance_type: 'inspection',
          status: 'scheduled',
          notes: 'Annual inspection'
        }
      ])
      .execute();

    // Create multiple pending repair requests
    await db.insert(repairRequestsTable)
      .values([
        {
          asset_id: assetsResult[0].id,
          requested_by_user_id: userId,
          description: 'Engine noise',
          priority: 'medium',
          status: 'pending'
        },
        {
          asset_id: assetsResult[1].id,
          requested_by_user_id: userId,
          description: 'Brake issues',
          priority: 'high',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getAssetReports();

    expect(result.total_assets).toEqual(2);
    expect(result.maintenance_due).toEqual(2);
    expect(result.repair_requests_pending).toEqual(2);
    expect(result.assets_by_type['vehicle']).toEqual(2);
    expect(result.assets_by_department['Transport']).toEqual(2);
  });

  it('should not count completed maintenance or non-pending repair requests', async () => {
    // Create test user and asset
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'Operations'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Equipment',
        type: 'medical_equipment',
        department: 'Lab',
        location: 'Lab 1',
        serial_number: 'TE001',
        purchase_date: new Date('2023-01-01'),
        status: 'active',
        assigned_user_id: userId
      })
      .returning()
      .execute();
    const assetId = assetResult[0].id;

    // Create completed maintenance (should not be counted)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await db.insert(maintenanceSchedulesTable)
      .values({
        asset_id: assetId,
        scheduled_date: pastDate,
        maintenance_type: 'calibration',
        status: 'completed',
        notes: 'Equipment calibrated'
      })
      .execute();

    // Create completed repair request (should not be counted)
    await db.insert(repairRequestsTable)
      .values({
        asset_id: assetId,
        requested_by_user_id: userId,
        description: 'Fixed issue',
        priority: 'low',
        status: 'completed'
      })
      .execute();

    const result = await getAssetReports();

    expect(result.total_assets).toEqual(1);
    expect(result.maintenance_due).toEqual(0); // Completed maintenance not counted
    expect(result.repair_requests_pending).toEqual(0); // Completed request not counted
  });
});
