
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createAssetInputSchema,
  updateAssetInputSchema,
  getUserAssetsInputSchema,
  getAssetsByDepartmentInputSchema,
  createRepairRequestInputSchema,
  updateRepairRequestInputSchema,
  getRepairRequestsByUserInputSchema,
  createMaintenanceScheduleInputSchema,
  createRepairHistoryInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { deleteUser, type DeleteUserInput } from './handlers/delete_user';
import { getUsers } from './handlers/get_users';
import { createAsset } from './handlers/create_asset';
import { updateAsset } from './handlers/update_asset';
import { deleteAsset, type DeleteAssetInput } from './handlers/delete_asset';
import { getAllAssets } from './handlers/get_all_assets';
import { getUserAssets } from './handlers/get_user_assets';
import { getAssetsByDepartment } from './handlers/get_assets_by_department';
import { createRepairRequest } from './handlers/create_repair_request';
import { updateRepairRequest } from './handlers/update_repair_request';
import { getRepairRequestsByUser } from './handlers/get_repair_requests_by_user';
import { getAllRepairRequests } from './handlers/get_all_repair_requests';
import { createMaintenanceSchedule } from './handlers/create_maintenance_schedule';
import { getMaintenanceSchedules } from './handlers/get_maintenance_schedules';
import { createRepairHistory } from './handlers/create_repair_history';
import { getRepairHistoryByAsset, type GetRepairHistoryByAssetInput } from './handlers/get_repair_history_by_asset';
import { getAssetReports } from './handlers/get_asset_reports';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management endpoints (Admin only)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input as DeleteUserInput)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Asset management endpoints
  createAsset: publicProcedure
    .input(createAssetInputSchema)
    .mutation(({ input }) => createAsset(input)),
  
  updateAsset: publicProcedure
    .input(updateAssetInputSchema)
    .mutation(({ input }) => updateAsset(input)),
  
  deleteAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAsset(input as DeleteAssetInput)),
  
  getAllAssets: publicProcedure
    .query(() => getAllAssets()),
  
  getUserAssets: publicProcedure
    .input(getUserAssetsInputSchema)
    .query(({ input }) => getUserAssets(input)),
  
  getAssetsByDepartment: publicProcedure
    .input(getAssetsByDepartmentInputSchema)
    .query(({ input }) => getAssetsByDepartment(input)),

  // Repair request endpoints
  createRepairRequest: publicProcedure
    .input(createRepairRequestInputSchema)
    .mutation(({ input }) => createRepairRequest(input)),
  
  updateRepairRequest: publicProcedure
    .input(updateRepairRequestInputSchema)
    .mutation(({ input }) => updateRepairRequest(input)),
  
  getRepairRequestsByUser: publicProcedure
    .input(getRepairRequestsByUserInputSchema)
    .query(({ input }) => getRepairRequestsByUser(input)),
  
  getAllRepairRequests: publicProcedure
    .query(() => getAllRepairRequests()),

  // Maintenance endpoints
  createMaintenanceSchedule: publicProcedure
    .input(createMaintenanceScheduleInputSchema)
    .mutation(({ input }) => createMaintenanceSchedule(input)),
  
  getMaintenanceSchedules: publicProcedure
    .query(() => getMaintenanceSchedules()),

  // Repair history endpoints
  createRepairHistory: publicProcedure
    .input(createRepairHistoryInputSchema)
    .mutation(({ input }) => createRepairHistory(input)),
  
  getRepairHistoryByAsset: publicProcedure
    .input(z.object({ asset_id: z.number() }))
    .query(({ input }) => getRepairHistoryByAsset(input as GetRepairHistoryByAssetInput)),

  // Reports endpoint (Admin only)
  getAssetReports: publicProcedure
    .query(() => getAssetReports()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
