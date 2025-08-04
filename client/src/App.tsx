
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { AssetManagement } from '@/components/AssetManagement';
import { UserManagement } from '@/components/UserManagement';
import { RepairRequests } from '@/components/RepairRequests';
import { MaintenanceSchedule } from '@/components/MaintenanceSchedule';
import { Reports } from '@/components/Reports';
import { UserLogin } from '@/components/UserLogin';
import type { User, Asset, RepairRequest } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      if (currentUser.role === 'admin') {
        // Admin can see all data
        const [allAssets, allUsers, allRepairRequests] = await Promise.all([
          trpc.getAllAssets.query(),
          trpc.getUsers.query(),
          trpc.getAllRepairRequests.query()
        ]);
        setAssets(allAssets);
        setUsers(allUsers);
        setRepairRequests(allRepairRequests);
      } else {
        // Regular users see only their department's assets and their repair requests
        const [userAssets, userRepairRequests] = await Promise.all([
          trpc.getAssetsByDepartment.query({ department: currentUser.department }),
          trpc.getRepairRequestsByUser.query({ user_id: currentUser.id })
        ]);
        setAssets(userAssets);
        setRepairRequests(userRepairRequests);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    setCurrentUser(null);
    setAssets([]);
    setUsers([]);
    setRepairRequests([]);
  };

  if (!currentUser) {
    return <UserLogin onLogin={setCurrentUser} />;
  }

  const dashboardStats = {
    totalAssets: assets.length,
    activeAssets: assets.filter((asset: Asset) => asset.status === 'active').length,
    damagedAssets: assets.filter((asset: Asset) => asset.status === 'damaged').length,
    pendingRequests: repairRequests.filter((request: RepairRequest) => request.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                🏥
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hospital Asset Management</h1>
                <p className="text-sm text-gray-600">Comprehensive healthcare equipment tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={currentUser.role === 'admin' ? 'default' : 'secondary'}>
                {currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}
              </Badge>
              <div className="text-right">
                <p className="font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-sm text-gray-600">{currentUser.department}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">Logout</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout from the system?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.totalAssets}</div>
              <p className="text-blue-100 text-sm">All tracked equipment</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.activeAssets}</div>
              <p className="text-green-100 text-sm">Currently operational</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Damaged Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.damagedAssets}</div>
              <p className="text-red-100 text-sm">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboardStats.pendingRequests}</div>
              <p className="text-orange-100 text-sm">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="assets" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              🏥 Assets
            </TabsTrigger>
            <TabsTrigger value="repair-requests" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              🔧 Repair Requests
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              📅 Maintenance
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <>
                <TabsTrigger value="users" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  👥 Users
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  📊 Reports
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="assets">
            <AssetManagement
              assets={assets}
              setAssets={setAssets}
              currentUser={currentUser}
              isLoading={isLoading}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="repair-requests">
            <RepairRequests
              repairRequests={repairRequests}
              setRepairRequests={setRepairRequests}
              assets={assets}
              currentUser={currentUser}
              isLoading={isLoading}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="maintenance">
            <MaintenanceSchedule
              assets={assets}
              currentUser={currentUser}
              isLoading={isLoading}
            />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <>
              <TabsContent value="users">
                <UserManagement
                  users={users}
                  setUsers={setUsers}
                  currentUser={currentUser}
                  isLoading={isLoading}
                  onRefresh={loadData}
                />
              </TabsContent>

              <TabsContent value="reports">
                <Reports
                  assets={assets}
                  repairRequests={repairRequests}
                  users={users}
                  isLoading={isLoading}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
