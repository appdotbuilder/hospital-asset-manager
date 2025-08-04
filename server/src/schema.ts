
import { z } from 'zod';

// Enums
export const userRoleEnum = z.enum(['admin', 'regular']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const assetTypeEnum = z.enum(['medical_equipment', 'furniture', 'it_device', 'vehicle']);
export type AssetType = z.infer<typeof assetTypeEnum>;

export const assetStatusEnum = z.enum(['active', 'damaged', 'under_repair', 'inactive']);
export type AssetStatus = z.infer<typeof assetStatusEnum>;

export const repairRequestStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'rejected']);
export type RepairRequestStatus = z.infer<typeof repairRequestStatusEnum>;

export const maintenanceStatusEnum = z.enum(['scheduled', 'completed', 'overdue']);
export type MaintenanceStatus = z.infer<typeof maintenanceStatusEnum>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  role: userRoleEnum,
  department: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: userRoleEnum,
  department: z.string().min(1)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
  department: z.string().min(1).optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Asset schemas
export const assetSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: assetTypeEnum,
  department: z.string(),
  location: z.string(),
  serial_number: z.string(),
  purchase_date: z.coerce.date(),
  status: assetStatusEnum,
  assigned_user_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Asset = z.infer<typeof assetSchema>;

export const createAssetInputSchema = z.object({
  name: z.string().min(1),
  type: assetTypeEnum,
  department: z.string().min(1),
  location: z.string().min(1),
  serial_number: z.string().min(1),
  purchase_date: z.coerce.date(),
  status: assetStatusEnum,
  assigned_user_id: z.number().nullable()
});

export type CreateAssetInput = z.infer<typeof createAssetInputSchema>;

export const updateAssetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  type: assetTypeEnum.optional(),
  department: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  serial_number: z.string().min(1).optional(),
  purchase_date: z.coerce.date().optional(),
  status: assetStatusEnum.optional(),
  assigned_user_id: z.number().nullable().optional()
});

export type UpdateAssetInput = z.infer<typeof updateAssetInputSchema>;

// Maintenance schedule schemas
export const maintenanceScheduleSchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  scheduled_date: z.coerce.date(),
  maintenance_type: z.string(),
  status: maintenanceStatusEnum,
  notes: z.string().nullable(),
  completed_date: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceSchedule = z.infer<typeof maintenanceScheduleSchema>;

export const createMaintenanceScheduleInputSchema = z.object({
  asset_id: z.number(),
  scheduled_date: z.coerce.date(),
  maintenance_type: z.string().min(1),
  notes: z.string().nullable()
});

export type CreateMaintenanceScheduleInput = z.infer<typeof createMaintenanceScheduleInputSchema>;

// Repair history schemas
export const repairHistorySchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  repair_date: z.coerce.date(),
  description: z.string(),
  cost: z.number(),
  technician: z.string(),
  created_at: z.coerce.date()
});

export type RepairHistory = z.infer<typeof repairHistorySchema>;

export const createRepairHistoryInputSchema = z.object({
  asset_id: z.number(),
  repair_date: z.coerce.date(),
  description: z.string().min(1),
  cost: z.number().nonnegative(),
  technician: z.string().min(1)
});

export type CreateRepairHistoryInput = z.infer<typeof createRepairHistoryInputSchema>;

// Repair request schemas
export const repairRequestSchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  requested_by_user_id: z.number(),
  description: z.string(),
  priority: z.string(),
  status: repairRequestStatusEnum,
  requested_date: z.coerce.date(),
  completed_date: z.coerce.date().nullable(),
  admin_notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type RepairRequest = z.infer<typeof repairRequestSchema>;

export const createRepairRequestInputSchema = z.object({
  asset_id: z.number(),
  requested_by_user_id: z.number(),
  description: z.string().min(1),
  priority: z.string().min(1)
});

export type CreateRepairRequestInput = z.infer<typeof createRepairRequestInputSchema>;

export const updateRepairRequestInputSchema = z.object({
  id: z.number(),
  status: repairRequestStatusEnum.optional(),
  completed_date: z.coerce.date().nullable().optional(),
  admin_notes: z.string().nullable().optional()
});

export type UpdateRepairRequestInput = z.infer<typeof updateRepairRequestInputSchema>;

// Query input schemas
export const getUserAssetsInputSchema = z.object({
  user_id: z.number()
});

export type GetUserAssetsInput = z.infer<typeof getUserAssetsInputSchema>;

export const getAssetsByDepartmentInputSchema = z.object({
  department: z.string()
});

export type GetAssetsByDepartmentInput = z.infer<typeof getAssetsByDepartmentInputSchema>;

export const getRepairRequestsByUserInputSchema = z.object({
  user_id: z.number()
});

export type GetRepairRequestsByUserInput = z.infer<typeof getRepairRequestsByUserInputSchema>;
