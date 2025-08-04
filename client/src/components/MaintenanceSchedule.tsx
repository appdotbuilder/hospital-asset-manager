
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { MaintenanceSchedule, Asset, User, CreateMaintenanceScheduleInput, MaintenanceStatus } from '../../../server/src/schema';

interface MaintenanceScheduleProps {
  assets: Asset[];
  currentUser: User;
  isLoading: boolean;
}

export function MaintenanceSchedule({ assets, currentUser, isLoading }: MaintenanceScheduleProps) {
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const [formData, setFormData] = useState<CreateMaintenanceScheduleInput>({
    asset_id: 0,
    scheduled_date: new Date(),
    maintenance_type: '',
    notes: null
  });

  const loadMaintenanceSchedules = useCallback(async () => {
    setIsLoadingSchedules(true);
    try {
      const schedules = await trpc.getMaintenanceSchedules.query();
      setMaintenanceSchedules(schedules);
    } catch (error) {
      console.error('Failed to load maintenance schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    loadMaintenanceSchedules();
  }, [loadMaintenanceSchedules]);

  const filteredSchedules = maintenanceSchedules.filter((schedule: MaintenanceSchedule) => {
    return filter === 'all' || schedule.status === filter;
  });

  const resetForm = () => {
    setFormData({
      asset_id: 0,
      scheduled_date: new Date(),
      maintenance_type: '',
      notes: null
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newSchedule = await trpc.createMaintenanceSchedule.mutate(formData);
      setMaintenanceSchedules([...maintenanceSchedules, newSchedule]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create maintenance schedule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find((a: Asset) => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  const isOverdue = (scheduledDate: Date, status: MaintenanceStatus) => {
    return status === 'scheduled' && new Date() > scheduledDate;
  };

  const canCreateSchedule = currentUser.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>📅</span>
              <span>Maintenance Schedule</span>
            </CardTitle>
            <CardDescription>
              {currentUser.role === 'admin' 
                ? 'Schedule and track maintenance for all assets'
                : 'View maintenance schedules for your department'
              }
            </CardDescription>
          </div>
          {canCreateSchedule && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  📅 Schedule Maintenance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Maintenance</DialogTitle>
                  <DialogDescription>
                    Schedule maintenance for an asset
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="asset">Asset</Label>
                      <Select
                        value={formData.asset_id.toString()}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreateMaintenanceScheduleInput) => ({ ...prev, asset_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map((asset: Asset) => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name} - {asset.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_date">Scheduled Date</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={formData.scheduled_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMaintenanceScheduleInput) => ({ ...prev, scheduled_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_type">Maintenance Type</Label>
                      <Input
                        id="maintenance_type"
                        value={formData.maintenance_type}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateMaintenanceScheduleInput) => ({ ...prev, maintenance_type: e.target.value }))
                        }
                        placeholder="e.g., Routine Inspection, Calibration"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateMaintenanceScheduleInput) => ({ ...prev, notes: e.target.value || null }))
                        }
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Scheduling...' : 'Schedule Maintenance'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading || isLoadingSchedules ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading maintenance schedules...</div>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-lg">No maintenance schedules found</div>
            <p className="text-sm">
              {maintenanceSchedules.length === 0 
                ? 'No maintenance has been scheduled yet.'
                : 'Try adjusting your filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Maintenance Type</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule: MaintenanceSchedule) => (
                  <TableRow 
                    key={schedule.id}
                    className={isOverdue(schedule.scheduled_date, schedule.status) ? 'bg-red-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {getAssetName(schedule.asset_id)}
                    </TableCell>
                    <TableCell>{schedule.maintenance_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{schedule.scheduled_date.toLocaleDateString()}</span>
                        {isOverdue(schedule.scheduled_date, schedule.status) && (
                          <Badge variant="destructive" className="text-xs">⚠️ Overdue</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.completed_date ? schedule.completed_date.toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {schedule.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
