
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { RepairRequest, Asset, User, CreateRepairRequestInput, UpdateRepairRequestInput, RepairRequestStatus } from '../../../server/src/schema';

interface RepairRequestsProps {
  repairRequests: RepairRequest[];
  setRepairRequests: (requests: RepairRequest[]) => void;
  assets: Asset[];
  currentUser: User;
  isLoading: boolean;
  onRefresh: () => void;
}

export function RepairRequests({ repairRequests, setRepairRequests, assets, currentUser, isLoading, onRefresh }: RepairRequestsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RepairRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const [formData, setFormData] = useState<CreateRepairRequestInput>({
    asset_id: 0,
    requested_by_user_id: currentUser.id,
    description: '',
    priority: 'medium'
  });

  const [adminFormData, setAdminFormData] = useState({
    status: 'pending' as RepairRequestStatus,
    admin_notes: ''
  });

  const filteredRequests = repairRequests.filter((request: RepairRequest) => {
    return filter === 'all' || request.status === filter;
  });

  const resetForm = () => {
    setFormData({
      asset_id: 0,
      requested_by_user_id: currentUser.id,
      description: '',
      priority: 'medium'
    });
    setAdminFormData({
      status: 'pending',
      admin_notes: ''
    });
    setEditingRequest(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRequest = await trpc.createRepairRequest.mutate(formData);
      setRepairRequests([...repairRequests, newRequest]);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create repair request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateRepairRequestInput = {
        id: editingRequest.id,
        status: adminFormData.status,
        admin_notes: adminFormData.admin_notes || null,
        completed_date: adminFormData.status === 'completed' ? new Date() : null
      };
      const updatedRequest = await trpc.updateRepairRequest.mutate(updateData);
      setRepairRequests(repairRequests.map((request: RepairRequest) => 
        request.id === editingRequest.id ? updatedRequest : request
      ));
      setEditingRequest(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update repair request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (request: RepairRequest) => {
    setEditingRequest(request);
    setAdminFormData({
      status: request.status,
      admin_notes: request.admin_notes || ''
    });
  };

  const getStatusBadge = (status: RepairRequestStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
      urgent: 'bg-red-600 text-white'
    };
    return <Badge className={colors[priority as keyof typeof colors] || colors.medium}>{priority}</Badge>;
  };

  const getAssetName = (assetId: number) => {
    const asset = assets.find((a: Asset) => a.id === assetId);
    return asset ? asset.name : `Asset #${assetId}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>🔧</span>
              <span>Repair Requests</span>
            </CardTitle>
            <CardDescription>
              {currentUser.role === 'admin' 
                ? 'Manage all repair requests across the hospital'
                : 'Submit and track your repair requests'
              }
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                🛠️ Request Repair
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Repair Request</DialogTitle>
                <DialogDescription>
                  Request repair for an asset
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <Select
                      value={formData.asset_id > 0 ? formData.asset_id.toString() : ''}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateRepairRequestInput) => ({ ...prev, asset_id: parseInt(value) }))
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateRepairRequestInput) => ({ ...prev, priority: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateRepairRequestInput) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe the issue..."
                      required
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
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading repair requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔧</div>
            <div className="text-lg">No repair requests found</div>
            <p className="text-sm">
              {repairRequests.length === 0 
                ? 'No repair requests have been submitted yet.'
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
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Completed Date</TableHead>
                  {currentUser.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request: RepairRequest) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {getAssetName(request.asset_id)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.description}
                    </TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{request.requested_date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {request.completed_date ? request.completed_date.toLocaleDateString() : '-'}
                    </TableCell>
                    {currentUser.role === 'admin' && (
                      <TableCell>
                        <Dialog open={editingRequest?.id === request.id} onOpenChange={(open: boolean) => {
                          if (!open) {
                            setEditingRequest(null);
                            resetForm();
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(request)}
                            >
                              ✏️ Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Update Repair Request</DialogTitle>
                              <DialogDescription>
                                Update the status and add admin notes
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdate}>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label>Original Request</Label>
                                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                                    {request.description}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="status">Status</Label>
                                  <Select
                                    value={adminFormData.status}
                                    onValueChange={(value: RepairRequestStatus) =>
                                      setAdminFormData((prev) => ({ ...prev, status: value }))
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="admin_notes">Admin Notes</Label>
                                  <Textarea
                                    id="admin_notes"
                                    value={adminFormData.admin_notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                      setAdminFormData((prev) => ({ ...prev, admin_notes: e.target.value }))
                                    }
                                    placeholder="Add notes about the repair..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => {
                                  setEditingRequest(null);
                                  resetForm();
                                }}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting ? 'Updating...' : 'Update Request'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
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
