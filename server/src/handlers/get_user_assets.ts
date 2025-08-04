
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type GetUserAssetsInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserAssets(input: GetUserAssetsInput): Promise<Asset[]> {
  try {
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.assigned_user_id, input.user_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get user assets failed:', error);
    throw error;
  }
}
