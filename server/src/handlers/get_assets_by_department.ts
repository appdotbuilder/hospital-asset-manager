
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetAssetsByDepartmentInput, type Asset } from '../schema';

export const getAssetsByDepartment = async (input: GetAssetsByDepartmentInput): Promise<Asset[]> => {
  try {
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.department, input.department))
      .execute();

    return results;
  } catch (error) {
    console.error('Get assets by department failed:', error);
    throw error;
  }
};
