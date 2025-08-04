
import { db } from '../db';
import { 
  assetsTable, 
  maintenanceSchedulesTable, 
  repairRequestsTable 
} from '../db/schema';
import { count, eq, and, lte, sql } from 'drizzle-orm';

export interface AssetReport {
  total_assets: number;
  assets_by_status: Record<string, number>;
  assets_by_department: Record<string, number>;
  assets_by_type: Record<string, number>;
  maintenance_due: number;
  repair_requests_pending: number;
}

export const getAssetReports = async (): Promise<AssetReport> => {
  try {
    // Get total assets count
    const totalAssetsResult = await db.select({ count: count() })
      .from(assetsTable)
      .execute();
    const total_assets = totalAssetsResult[0].count;

    // Get assets by status
    const statusResults = await db.select({
      status: assetsTable.status,
      count: count()
    })
      .from(assetsTable)
      .groupBy(assetsTable.status)
      .execute();

    const assets_by_status: Record<string, number> = {};
    statusResults.forEach(result => {
      assets_by_status[result.status] = result.count;
    });

    // Get assets by department
    const departmentResults = await db.select({
      department: assetsTable.department,
      count: count()
    })
      .from(assetsTable)
      .groupBy(assetsTable.department)
      .execute();

    const assets_by_department: Record<string, number> = {};
    departmentResults.forEach(result => {
      assets_by_department[result.department] = result.count;
    });

    // Get assets by type
    const typeResults = await db.select({
      type: assetsTable.type,
      count: count()
    })
      .from(assetsTable)
      .groupBy(assetsTable.type)
      .execute();

    const assets_by_type: Record<string, number> = {};
    typeResults.forEach(result => {
      assets_by_type[result.type] = result.count;
    });

    // Get maintenance due count (scheduled maintenance with past due date)
    const today = new Date();
    const maintenanceDueResult = await db.select({ count: count() })
      .from(maintenanceSchedulesTable)
      .where(
        and(
          eq(maintenanceSchedulesTable.status, 'scheduled'),
          lte(maintenanceSchedulesTable.scheduled_date, today)
        )
      )
      .execute();
    const maintenance_due = maintenanceDueResult[0].count;

    // Get pending repair requests count
    const pendingRepairsResult = await db.select({ count: count() })
      .from(repairRequestsTable)
      .where(eq(repairRequestsTable.status, 'pending'))
      .execute();
    const repair_requests_pending = pendingRepairsResult[0].count;

    return {
      total_assets,
      assets_by_status,
      assets_by_department,
      assets_by_type,
      maintenance_due,
      repair_requests_pending
    };
  } catch (error) {
    console.error('Asset reports generation failed:', error);
    throw error;
  }
};
