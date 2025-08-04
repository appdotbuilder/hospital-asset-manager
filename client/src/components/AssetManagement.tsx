
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Asset, User, CreateAssetInput, UpdateAssetInput, AssetType, AssetStatus } from '../../../server/src/schema';

interface AssetManagementProps {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  currentUser: User;
  isLoading: boolean;
  onRefresh: () => void;
}

export function AssetManagement({ assets, setAssets, currentUser, isLoading, onRefresh }: AssetManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateAssetInput>({
    name: '',
    type: 'medical_equipment',
    department: currentUser.department,
    location: '',
    serial_number: '',
    purchase_date: new Date(),
    status: 'active',
    assigned_user_id: null
  });

  const assetTypes: AssetType[] = ['medical_equipment', 'furniture', 'it_device', 'vehicle'];
  const assetStatuses: AssetStatus[] = ['active', 'damaged', 'under_repair', 'inactive'];

  const filteredAssets = assets.filter((asset: Asset) => {
    const matchesFilter = filter === 'all' || asset.status === filter;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'medical_equipment',
      department: currentUser.department,
      location: '',
      serial_number: '',
      purchase_date: new Date(),
      status: 'active',
      assigned_user_id: null
    });
    setEditingAsset(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newAsset = await trpc.createAsset.mutate(formData);
      setAssets([...assets, newAsset]);
      setIsCreateDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to create asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    setIsSubmitting(true);
    try {
      const updateData: UpdateAssetInput = {
        id: editingAsset.id,
        ...formData
      };
      const updatedAsset = await trpc.updateAsset.mutate(updateData);
      setAssets(assets.map((asset: Asset) => asset.id === editingAsset.id ? updatedAsset : asset));
      setEditingAsset(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error('Failed to update asset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (assetId: number) => {
    try {
      await trpc.deleteAsset.mutate({ id: assetId });
      setAssets(assets.filter((asset: Asset) => asset.id !== assetId));
      onRefresh();
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const openEditDialog = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      department: asset.department,
      location: asset.location,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      status: asset.status,
      assigned_user_id: asset.assigned_user_id
    });
  };

  const getStatusBadge = (status: AssetStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      damaged: 'bg-red-100 text-red-800',
      under_repair: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getTypeIcon = (type: AssetType) => {
    const icons = {
      medical_equipment: '🏥',
      furniture: '🪑',
      it_device: '💻',
      vehicle: '🚗'
    };
    return icons[type];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>🏥</span>
              <span>Asset Management</span>
            </CardTitle>
            <CardDescription>
              {currentUser.role === 'admin' 
                ? 'Manage all hospital assets across departments'
                : `Manage assets in ${currentUser.department} department`
              }
            </CardDescription>
          </div>
          {currentUser.role === 'admin' && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  ➕ Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>
                    Create a new asset record in the system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Asset Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Enter asset name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Asset Type</Label>
                      <Select
                        value={formData.type || 'medical_equipment'}
                        onValueChange={(value: AssetType) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assetTypes.map((type: AssetType) => (
                            <SelectItem key={type} value={type}>
                              {getTypeIcon(type)} {type.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, department: e.target.value }))
                        }
                        placeholder="Enter department"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, location: e.target.value }))
                        }
                        placeholder="Enter location"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={formData.serial_number}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, serial_number: e.target.value }))
                        }
                        placeholder="Enter serial number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">Purchase Date</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateAssetInput) => ({ ...prev, purchase_date: new Date(e.target.value) }))
                        }
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
                      {isSubmitting ? 'Creating...' : 'Create Asset'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="🔍 Search assets..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="under_repair">Under Repair</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-lg">Loading assets...</div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-lg">No assets found</div>
            <p className="text-sm">
              {assets.length === 0 
                ? 'No assets have been added yet.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  {currentUser.role === 'admin' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset: Asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{getTypeIcon(asset.type)}</span>
                        <span>{asset.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell><code className="bg-gray-100 px-1 rounded">{asset.serial_number}</code></TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>{asset.purchase_date.toLocaleDateString()}</TableCell>
                    {currentUser.role === 'admin' && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={editingAsset?.id === asset.id} onOpenChange={(open: boolean) => {
                            if (!open) {
                              setEditingAsset(null);
                              resetForm();
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(asset)}
                              >
                                ✏️
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Asset</DialogTitle>
                                <DialogDescription>
                                  Update asset information
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUpdate}>
                                <div className="grid gap-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-name">Asset Name</Label>
                                    <Input
                                      id="edit-name"
                                      value={formData.name}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData((prev: CreateAssetInput) => ({ ...prev, name: e.target.value }))
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select
                                      value={formData.status || 'active'}
                                      onValueChange={(value: AssetStatus) =>
                                        setFormData((prev: CreateAssetInput) => ({ ...prev, status: value }))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {assetStatuses.map((status: AssetStatus) => (
                                          <SelectItem key={status} value={status}>
                                            {status.replace('_', ' ')}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-location">Location</Label>
                                    <Input
                                      id="edit-location"
                                      value={formData.location}
                                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData((prev: CreateAssetInput) => ({ ...prev, location: e.target.value }))
                                      }
                                      required
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => {
                                    setEditingAsset(null);
                                    resetForm();
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">🗑️</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(asset.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
