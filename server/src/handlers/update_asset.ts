
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type UpdateAssetInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAsset = async (input: UpdateAssetInput): Promise<Asset> => {
  try {
    // First check if asset exists
    const existingAsset = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.id))
      .execute();

    if (existingAsset.length === 0) {
      throw new Error(`Asset with id ${input.id} not found`);
    }

    // Update asset record with provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.department !== undefined) updateData.department = input.department;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.serial_number !== undefined) updateData.serial_number = input.serial_number;
    if (input.purchase_date !== undefined) updateData.purchase_date = input.purchase_date;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.assigned_user_id !== undefined) updateData.assigned_user_id = input.assigned_user_id;

    const result = await db.update(assetsTable)
      .set(updateData)
      .where(eq(assetsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Asset update failed:', error);
    throw error;
  }
};
