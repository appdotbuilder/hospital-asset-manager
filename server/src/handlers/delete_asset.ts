
import { z } from 'zod';
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteAssetInputSchema = z.object({
  id: z.number()
});

export type DeleteAssetInput = z.infer<typeof deleteAssetInputSchema>;

export const deleteAsset = async (input: DeleteAssetInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(assetsTable)
      .where(eq(assetsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Asset deletion failed:', error);
    throw error;
  }
};
