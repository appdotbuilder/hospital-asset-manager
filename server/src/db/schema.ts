
import { serial, text, pgTable, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'regular']);
export const assetTypeEnum = pgEnum('asset_type', ['medical_equipment', 'furniture', 'it_device', 'vehicle']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'damaged', 'under_repair', 'inactive']);
export const repairRequestStatusEnum = pgEnum('repair_request_status', ['pending', 'in_progress', 'completed', 'rejected']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['scheduled', 'completed', 'overdue']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  department: text('department').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Assets table
export const assetsTable = pgTable('assets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: assetTypeEnum('type').notNull(),
  department: text('department').notNull(),
  location: text('location').notNull(),
  serial_number: text('serial_number').notNull().unique(),
  purchase_date: timestamp('purchase_date').notNull(),
  status: assetStatusEnum('status').notNull(),
  assigned_user_id: integer('assigned_user_id').references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Maintenance schedules table
export const maintenanceSchedulesTable = pgTable('maintenance_schedules', {
  id: serial('id').primaryKey(),
  asset_id: integer('asset_id').references(() => assetsTable.id).notNull(),
  scheduled_date: timestamp('scheduled_date').notNull(),
  maintenance_type: text('maintenance_type').notNull(),
  status: maintenanceStatusEnum('status').notNull().default('scheduled'),
  notes: text('notes'),
  completed_date: timestamp('completed_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Repair history table
export const repairHistoryTable = pgTable('repair_history', {
  id: serial('id').primaryKey(),
  asset_id: integer('asset_id').references(() => assetsTable.id).notNull(),
  repair_date: timestamp('repair_date').notNull(),
  description: text('description').notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  technician: text('technician').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Repair requests table
export const repairRequestsTable = pgTable('repair_requests', {
  id: serial('id').primaryKey(),
  asset_id: integer('asset_id').references(() => assetsTable.id).notNull(),
  requested_by_user_id: integer('requested_by_user_id').references(() => usersTable.id).notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(),
  status: repairRequestStatusEnum('status').notNull().default('pending'),
  requested_date: timestamp('requested_date').defaultNow().notNull(),
  completed_date: timestamp('completed_date'),
  admin_notes: text('admin_notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  assignedAssets: many(assetsTable),
  repairRequests: many(repairRequestsTable),
}));

export const assetsRelations = relations(assetsTable, ({ one, many }) => ({
  assignedUser: one(usersTable, {
    fields: [assetsTable.assigned_user_id],
    references: [usersTable.id],
  }),
  maintenanceSchedules: many(maintenanceSchedulesTable),
  repairHistory: many(repairHistoryTable),
  repairRequests: many(repairRequestsTable),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedulesTable, ({ one }) => ({
  asset: one(assetsTable, {
    fields: [maintenanceSchedulesTable.asset_id],
    references: [assetsTable.id],
  }),
}));

export const repairHistoryRelations = relations(repairHistoryTable, ({ one }) => ({
  asset: one(assetsTable, {
    fields: [repairHistoryTable.asset_id],
    references: [assetsTable.id],
  }),
}));

export const repairRequestsRelations = relations(repairRequestsTable, ({ one }) => ({
  asset: one(assetsTable, {
    fields: [repairRequestsTable.asset_id],
    references: [assetsTable.id],
  }),
  requestedBy: one(usersTable, {
    fields: [repairRequestsTable.requested_by_user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Asset = typeof assetsTable.$inferSelect;
export type NewAsset = typeof assetsTable.$inferInsert;

export type MaintenanceSchedule = typeof maintenanceSchedulesTable.$inferSelect;
export type NewMaintenanceSchedule = typeof maintenanceSchedulesTable.$inferInsert;

export type RepairHistory = typeof repairHistoryTable.$inferSelect;
export type NewRepairHistory = typeof repairHistoryTable.$inferInsert;

export type RepairRequest = typeof repairRequestsTable.$inferSelect;
export type NewRepairRequest = typeof repairRequestsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  assets: assetsTable,
  maintenanceSchedules: maintenanceSchedulesTable,
  repairHistory: repairHistoryTable,
  repairRequests: repairRequestsTable,
};
