
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, assetsTable, repairRequestsTable } from '../db/schema';
import { type UpdateRepairRequestInput } from '../schema';
import { updateRepairRequest } from '../handlers/update_repair_request';
import { eq } from 'drizzle-orm';

describe('updateRepairRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update repair request status', async () => {
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

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        type: 'it_device',
        department: 'IT',
        location: 'Office A',
        serial_number: 'TEST123',
        purchase_date: new Date(),
        status: 'active',
        assigned_user_id: null
      })
      .returning()
      .execute();

    // Create repair request
    const repairRequestResult = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetResult[0].id,
        requested_by_user_id: userResult[0].id,
        description: 'Test repair request',
        priority: 'high',
        status: 'pending'
      })
      .returning()
      .execute();

    const updateInput: UpdateRepairRequestInput = {
      id: repairRequestResult[0].id,
      status: 'in_progress',
      admin_notes: 'Started working on this issue'
    };

    const result = await updateRepairRequest(updateInput);

    expect(result.id).toEqual(repairRequestResult[0].id);
    expect(result.status).toEqual('in_progress');
    expect(result.admin_notes).toEqual('Started working on this issue');
    expect(result.asset_id).toEqual(assetResult[0].id);
    expect(result.requested_by_user_id).toEqual(userResult[0].id);
    expect(result.description).toEqual('Test repair request');
    expect(result.priority).toEqual('high');
  });

  it('should update completed_date when status is completed', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        department: 'IT'
      })
      .returning()
      .execute();

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        type: 'it_device',
        department: 'IT',
        location: 'Office A',
        serial_number: 'TEST123',
        purchase_date: new Date(),
        status: 'under_repair',
        assigned_user_id: null
      })
      .returning()
      .execute();

    // Create repair request
    const repairRequestResult = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetResult[0].id,
        requested_by_user_id: userResult[0].id,
        description: 'Test repair request',
        priority: 'medium',
        status: 'in_progress'
      })
      .returning()
      .execute();

    const completedDate = new Date();
    const updateInput: UpdateRepairRequestInput = {
      id: repairRequestResult[0].id,
      status: 'completed',
      completed_date: completedDate,
      admin_notes: 'Repair completed successfully'
    };

    const result = await updateRepairRequest(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.completed_date).toBeInstanceOf(Date);
    expect(result.completed_date?.getTime()).toEqual(completedDate.getTime());
    expect(result.admin_notes).toEqual('Repair completed successfully');
  });

  it('should save changes to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        role: 'regular',
        department: 'Maintenance'
      })
      .returning()
      .execute();

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Equipment',
        type: 'medical_equipment',
        department: 'Maintenance',
        location: 'Ward B',
        serial_number: 'MED456',
        purchase_date: new Date(),
        status: 'damaged',
        assigned_user_id: null
      })
      .returning()
      .execute();

    // Create repair request
    const repairRequestResult = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetResult[0].id,
        requested_by_user_id: userResult[0].id,
        description: 'Equipment not working properly',
        priority: 'low',
        status: 'pending'
      })
      .returning()
      .execute();

    const updateInput: UpdateRepairRequestInput = {
      id: repairRequestResult[0].id,
      status: 'rejected',
      admin_notes: 'Not covered under warranty'
    };

    await updateRepairRequest(updateInput);

    // Verify changes were saved to database
    const updatedRequest = await db.select()
      .from(repairRequestsTable)
      .where(eq(repairRequestsTable.id, repairRequestResult[0].id))
      .execute();

    expect(updatedRequest).toHaveLength(1);
    expect(updatedRequest[0].status).toEqual('rejected');
    expect(updatedRequest[0].admin_notes).toEqual('Not covered under warranty');
    expect(updatedRequest[0].completed_date).toBeNull();
  });

  it('should throw error when repair request not found', async () => {
    const updateInput: UpdateRepairRequestInput = {
      id: 99999,
      status: 'completed'
    };

    await expect(updateRepairRequest(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only provided fields', async () => {
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

    // Create prerequisite asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        type: 'it_device',
        department: 'IT',
        location: 'Office A',
        serial_number: 'TEST789',
        purchase_date: new Date(),
        status: 'active',
        assigned_user_id: null
      })
      .returning()
      .execute();

    // Create repair request with existing admin notes
    const repairRequestResult = await db.insert(repairRequestsTable)
      .values({
        asset_id: assetResult[0].id,
        requested_by_user_id: userResult[0].id,
        description: 'Test repair request',
        priority: 'high',
        status: 'pending',
        admin_notes: 'Initial notes'
      })
      .returning()
      .execute();

    // Update only status, leaving admin_notes unchanged
    const updateInput: UpdateRepairRequestInput = {
      id: repairRequestResult[0].id,
      status: 'in_progress'
    };

    const result = await updateRepairRequest(updateInput);

    expect(result.status).toEqual('in_progress');
    expect(result.admin_notes).toEqual('Initial notes'); // Should remain unchanged
    expect(result.completed_date).toBeNull(); // Should remain unchanged
  });
});
