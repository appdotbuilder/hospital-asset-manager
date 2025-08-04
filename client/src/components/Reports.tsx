
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Asset, RepairRequest, User } from '../../../server/src/schema';

interface ReportsProps {
  assets: Asset[];
  repairRequests: RepairRequest[];
  users: User[];
  isLoading: boolean;
}

interface AssetReport {
  totalAssets: number;
  assetsByType: Record<string, number>;
  assetsByStatus: Record<string, number>;
  assetsByDepartment: Record<string, number>;
}

export function Reports({ assets, repairRequests, users, isLoading }: ReportsProps) {
  const [assetReports, setAssetReports] = useState<AssetReport | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const loadAssetReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      // Load reports from API
      await trpc.getAssetReports.query();
      
      // Generate reports from current data
      const assetsByType = assets.reduce((acc: Record<string, number>, asset: Asset) => {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        return acc;
      }, {});

      const assetsByStatus = assets.reduce((acc: Record<string, number>, asset: Asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1;
        return acc;
      }, {});

      const assetsByDepartment = assets.reduce((acc: Record<string, number>, asset: Asset) => {
        acc[asset.department] = (acc[asset.department] || 0) + 1;
        return acc;
      }, {});

      setAssetReports({
        totalAssets: assets.length,
        assetsByType,
        assetsByStatus,
        assetsByDepartment
      });
    } catch (error) {
      console.error('Failed to load asset reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  }, [assets]);

  useEffect(() => {
    loadAssetReports();
  }, [loadAssetReports]);

  const repairRequestStats = {
    total: repairRequests.length,
    pending: repairRequests.filter((r: RepairRequest) => r.status === 'pending').length,
    in_progress: repairRequests.filter((r: RepairRequest) => r.status === 'in_progress').length,
    completed: repairRequests.filter((r: RepairRequest) => r.status === 'completed').length,
    rejected: repairRequests.filter((r: RepairRequest) => r.status === 'rejected').length
  };

  const userStats = {
    total: users.length,
    admins: users.filter((u: User) => u.role === 'admin').length,
    regular: users.filter((u: User) => u.role === 'regular').length
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      medical_equipment: '🏥',
      furniture: '🪑',
      it_device: '💻',
      vehicle: '🚗'
    };
    return icons[type as keyof typeof icons] || '📦';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600',
      damaged: 'text-red-600',
      under_repair: 'text-yellow-600',
      inactive: 'text-gray-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  if (isLoading || isLoadingReports) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>System Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-lg">Loading reports...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>System Reports</span>
          </CardTitle>
          <CardDescription>
            Comprehensive overview of hospital assets and operations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Asset Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assetReports?.totalAssets || 0}</div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Active:</span>
                <span>{assetReports?.assetsByStatus?.active || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Damaged:</span>
                <span>{assetReports?.assetsByStatus?.damaged || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Repair Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{repairRequestStats.total}</div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Pending:</span>
                <span>{repairRequestStats.pending}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed:</span>
                <span>{repairRequestStats.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userStats.total}</div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Admins:</span>
                <span>{userStats.admins}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Regular:</span>
                <span>{userStats.regular}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Type</CardTitle>
            <CardDescription>Distribution of assets across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(assetReports?.assetsByType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(type)}</span>
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Progress 
                      value={(count / (assetReports?.totalAssets || 1)) * 100} 
                      className="w-20" 
                    />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Status</CardTitle>
            <CardDescription>Current operational status of all assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(assetReports?.assetsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`capitalize ${getStatusColor(status)}`}>
                    {status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-3">
                    <Progress 
                      value={(count / (assetReports?.totalAssets || 1)) * 100} 
                      className="w-20" 
                    />
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assets by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Assets by Department</CardTitle>
            <CardDescription>Asset distribution across hospital departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Asset Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(assetReports?.assetsByDepartment || {}).map(([department, count]) => (
                    <TableRow key={department}>
                      <TableCell className="font-medium">{department}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        {((count / (assetReports?.totalAssets || 1)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Repair Request Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Request Summary</CardTitle>
            <CardDescription>Status breakdown of all repair requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-yellow-600">Pending</span>
                <Badge className="bg-yellow-100 text-yellow-800">{repairRequestStats.pending}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">In Progress</span>
                <Badge className="bg-blue-100 text-blue-800">{repairRequestStats.in_progress}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">Completed</span>
                <Badge className="bg-green-100 text-green-800">{repairRequestStats.completed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">Rejected</span>
                <Badge className="bg-red-100 text-red-800">{repairRequestStats.rejected}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
