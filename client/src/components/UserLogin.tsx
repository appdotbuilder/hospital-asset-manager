
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import type { User } from '../../../server/src/schema';

interface UserLoginProps {
  onLogin: (user: User) => void;
}

export function UserLogin({ onLogin }: UserLoginProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple login implementation for demonstration purposes
  // In a production application, this would authenticate against a proper auth system
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simple role-based user creation for demo
      if (username.toLowerCase() === 'admin') {
        const adminUser: User = {
          id: 1,
          username: 'admin',
          email: 'admin@hospital.com',
          role: 'admin',
          department: 'Administration',
          created_at: new Date()
        };
        onLogin(adminUser);
      } else if (username.toLowerCase().startsWith('user')) {
        const regularUser: User = {
          id: 2,
          username: username,
          email: `${username}@hospital.com`,
          role: 'regular',
          department: 'Cardiology', // Demo department
          created_at: new Date()
        };
        onLogin(regularUser);
      } else {
        setError('Invalid username. Use "admin" for admin access or "user..." for regular user access.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-blue-600 text-white p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center text-2xl">
            🏥
          </div>
          <CardTitle className="text-2xl">Hospital Asset Management</CardTitle>
          <CardDescription>
            Sign in to access the asset management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-sm text-gray-600 space-y-2 mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Demo Credentials:</p>
              <p>• Admin: <code className="bg-white px-1 rounded">admin</code></p>
              <p>• Regular User: <code className="bg-white px-1 rounded">user[anything]</code></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
