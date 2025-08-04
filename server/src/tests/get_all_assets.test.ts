
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable } from '../db/schema';
import { getAllAssets } from '../handlers/get_all_assets';

describe('getAllAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assets exist', async () => {
    const result = await getAllAssets();
    expect(result).toEqual([]);
  });

  it('should return all assets', async () => {
    // Create a user first for foreign key reference
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'testuser1',
          email: 'test1@example.com',
          role: 'regular',
          department: 'IT'
        },
        {
          username: 'testuser2',
          email: 'test2@example.com',
          role: 'admin',
          department: 'Medical'
        }
      ])
      .returning()
      .execute();

    // Create test assets
    const testAssets = [
      {
        name: 'Test Laptop',
        type: 'it_device' as const,
        department: 'IT',
        location: 'Office A',
        serial_number: 'LAPTOP001',
        purchase_date: new Date('2023-01-01'),
        status: 'active' as const,
        assigned_user_id: users[0].id
      },
      {
        name: 'MRI Machine',
        type: 'medical_equipment' as const,
        department: 'Medical',
        location: 'Room 101',
        serial_number: 'MRI001',
        purchase_date: new Date('2022-06-15'),
        status: 'damaged' as const,
        assigned_user_id: null
      },
      {
        name: 'Office Chair',
        type: 'furniture' as const,
        department: 'HR',
        location: 'Floor 2',
        serial_number: 'CHAIR001',
        purchase_date: new Date('2023-03-10'),
        status: 'under_repair' as const,
        assigned_user_id: users[1].id
      }
    ];

    await db.insert(assetsTable)
      .values(testAssets)
      .execute();

    const result = await getAllAssets();

    expect(result).toHaveLength(3);

    // Verify first asset
    const laptop = result.find(asset => asset.name === 'Test Laptop');
    expect(laptop).toBeDefined();
    expect(laptop!.type).toEqual('it_device');
    expect(laptop!.department).toEqual('IT');
    expect(laptop!.location).toEqual('Office A');
    expect(laptop!.serial_number).toEqual('LAPTOP001');
    expect(laptop!.status).toEqual('active');
    expect(laptop!.assigned_user_id).toEqual(users[0].id);
    expect(laptop!.purchase_date).toBeInstanceOf(Date);
    expect(laptop!.created_at).toBeInstanceOf(Date);
    expect(laptop!.updated_at).toBeInstanceOf(Date);

    // Verify second asset
    const mri = result.find(asset => asset.name === 'MRI Machine');
    expect(mri).toBeDefined();
    expect(mri!.type).toEqual('medical_equipment');
    expect(mri!.status).toEqual('damaged');
    expect(mri!.assigned_user_id).toBeNull();

    // Verify third asset
    const chair = result.find(asset => asset.name === 'Office Chair');
    expect(chair).toBeDefined();
    expect(chair!.type).toEqual('furniture');
    expect(chair!.status).toEqual('under_repair');
    expect(chair!.assigned_user_id).toEqual(users[1].id);
  });

  it('should return assets with different statuses', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'IT'
      })
      .returning()
      .execute();

    // Create assets with all possible statuses
    const testAssets = [
      {
        name: 'Active Asset',
        type: 'it_device' as const,
        department: 'IT',
        location: 'Office',
        serial_number: 'ACTIVE001',
        purchase_date: new Date('2023-01-01'),
        status: 'active' as const,
        assigned_user_id: user[0].id
      },
      {
        name: 'Damaged Asset',
        type: 'medical_equipment' as const,
        department: 'Medical',
        location: 'Room 1',
        serial_number: 'DAMAGED001',
        purchase_date: new Date('2023-01-01'),
        status: 'damaged' as const,
        assigned_user_id: null
      },
      {
        name: 'Under Repair Asset',
        type: 'furniture' as const,
        department: 'HR',
        location: 'Office',
        serial_number: 'REPAIR001',
        purchase_date: new Date('2023-01-01'),
        status: 'under_repair' as const,
        assigned_user_id: null
      },
      {
        name: 'Inactive Asset',
        type: 'vehicle' as const,
        department: 'Transport',
        location: 'Garage',
        serial_number: 'INACTIVE001',
        purchase_date: new Date('2023-01-01'),
        status: 'inactive' as const,
        assigned_user_id: null
      }
    ];

    await db.insert(assetsTable)
      .values(testAssets)
      .execute();

    const result = await getAllAssets();

    expect(result).toHaveLength(4);

    const statuses = result.map(asset => asset.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('damaged');
    expect(statuses).toContain('under_repair');
    expect(statuses).toContain('inactive');
  });
});
