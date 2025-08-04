
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable } from '../db/schema';
import { type GetAssetsByDepartmentInput } from '../schema';
import { getAssetsByDepartment } from '../handlers/get_assets_by_department';

describe('getAssetsByDepartment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return assets for the specified department', async () => {
    // Create test user
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

    // Create test assets in different departments
    await db.insert(assetsTable)
      .values([
        {
          name: 'IT Laptop',
          type: 'it_device',
          department: 'IT',
          location: 'Office A',
          serial_number: 'IT001',
          purchase_date: new Date('2023-01-01'),
          status: 'active',
          assigned_user_id: userId
        },
        {
          name: 'IT Printer',
          type: 'it_device',
          department: 'IT',
          location: 'Office B',
          serial_number: 'IT002',
          purchase_date: new Date('2023-02-01'),
          status: 'active',
          assigned_user_id: null
        },
        {
          name: 'HR Desk',
          type: 'furniture',
          department: 'HR',
          location: 'HR Floor',
          serial_number: 'HR001',
          purchase_date: new Date('2023-01-15'),
          status: 'active',
          assigned_user_id: null
        }
      ])
      .execute();

    const input: GetAssetsByDepartmentInput = {
      department: 'IT'
    };

    const result = await getAssetsByDepartment(input);

    expect(result).toHaveLength(2);
    result.forEach(asset => {
      expect(asset.department).toEqual('IT');
      expect(asset.id).toBeDefined();
      expect(asset.created_at).toBeInstanceOf(Date);
      expect(asset.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no assets exist for department', async () => {
    const input: GetAssetsByDepartmentInput = {
      department: 'Finance'
    };

    const result = await getAssetsByDepartment(input);

    expect(result).toHaveLength(0);
  });

  it('should return all assets for department regardless of status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'Medical'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create assets with different statuses in same department
    await db.insert(assetsTable)
      .values([
        {
          name: 'Active Equipment',
          type: 'medical_equipment',
          department: 'Medical',
          location: 'Room 101',
          serial_number: 'MED001',
          purchase_date: new Date('2023-01-01'),
          status: 'active',
          assigned_user_id: userId
        },
        {
          name: 'Damaged Equipment',
          type: 'medical_equipment',
          department: 'Medical',
          location: 'Room 102',
          serial_number: 'MED002',
          purchase_date: new Date('2023-02-01'),
          status: 'damaged',
          assigned_user_id: null
        },
        {
          name: 'Under Repair Equipment',
          type: 'medical_equipment',
          department: 'Medical',
          location: 'Repair Shop',
          serial_number: 'MED003',
          purchase_date: new Date('2023-03-01'),
          status: 'under_repair',
          assigned_user_id: null
        }
      ])
      .execute();

    const input: GetAssetsByDepartmentInput = {
      department: 'Medical'
    };

    const result = await getAssetsByDepartment(input);

    expect(result).toHaveLength(3);
    
    const statuses = result.map(asset => asset.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('damaged');
    expect(statuses).toContain('under_repair');
  });
});
