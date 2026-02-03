import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, Upload, Users, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Student {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Redirect non-admins
  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Student[];
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; displayName?: string }) => {
      const response = await supabase.functions.invoke('create-user', {
        body: userData,
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setUsername('');
      setPassword('');
      setDisplayName('');
      toast({
        title: 'Success',
        description: 'Student account created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (users: Array<{ username: string; password: string; displayName?: string }>) => {
      const response = await supabase.functions.invoke('bulk-create-users', {
        body: { users },
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast({
        title: 'Import Complete',
        description: `Successfully created ${data.created} accounts. ${data.failed} failed.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import users',
        variant: 'destructive',
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Username and password are required',
        variant: 'destructive',
      });
      return;
    }
    createUserMutation.mutate({ username, password, displayName });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Skip header row if present
      const startIndex = lines[0]?.toLowerCase().includes('username') ? 1 : 0;
      
      const users = lines.slice(startIndex).map((line) => {
        const [username, password, displayName] = line.split(',').map((s) => s.trim());
        return { username, password: password || username, displayName };
      }).filter((u) => u.username);

      if (users.length === 0) {
        toast({
          title: 'Error',
          description: 'No valid users found in file',
          variant: 'destructive',
        });
        return;
      }

      bulkImportMutation.mutate(users);
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage student accounts</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Student Account
              </CardTitle>
              <CardDescription>
                Add a new student to the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-username">Username</Label>
                  <Input
                    id="create-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g., 20891A1202"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-display">Display Name (Optional)</Label>
                  <Input
                    id="create-display"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bulk Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Import
              </CardTitle>
              <CardDescription>
                Import multiple students from a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Upload CSV File</p>
                <p className="text-xs text-muted-foreground">
                  Format: username, password, display_name
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Select File'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : students.length === 0 ? (
              <p className="text-center text-muted-foreground">No students registered yet</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {student.display_name || student.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{student.username}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
