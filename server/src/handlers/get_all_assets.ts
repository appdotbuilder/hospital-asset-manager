
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type Asset } from '../schema';

export const getAllAssets = async (): Promise<Asset[]> => {
  try {
    const results = await db.select()
      .from(assetsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch all assets:', error);
    throw error;
  }
};
