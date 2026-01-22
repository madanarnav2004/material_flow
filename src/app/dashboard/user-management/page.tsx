'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Users, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const newUserSchema = z.object({
  siteName: z.string().min(1, 'Site name is required.'),
  siteInchargeName: z.string().min(1, 'Site Incharge name is required.'),
  loginName: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.string().min(1, 'Role is required.'),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

type Login = {
    id: string;
    email: string;
    site: string;
    role: string;
    status: 'Active' | 'Closed';
};

const initialLogins: Login[] = [
  { id: '1', email: 'manager@northsite.com', site: 'North Site', role: 'site-manager', status: 'Active' },
  { id: '2', email: 'manager@southsite.com', site: 'South Site', role: 'site-manager', status: 'Active' },
  { id: '3', email: 'l.gomez@materialflow.com', site: 'MAPI Godown', role: 'godown-manager', status: 'Active' },
  { id: '4', email: 's.khan@materialflow.com', site: 'Global', role: 'purchase-department', status: 'Active' },
  { id: '5', email: 'manager@oldsite.com', site: 'Old Site', role: 'site-manager', status: 'Closed' },
];

const roleDisplayNames: { [key: string]: string } = {
  'site-manager': 'Site Manager',
  'godown-manager': 'Godown Manager',
  'coordinator': 'Coordinator',
  'purchase-department': 'Purchase Department',
  'director': 'Director',
};


export default function UserManagementPage() {
  const { toast } = useToast();
  const { role: currentUserRole } = useUser();
  const [logins, setLogins] = React.useState<Login[]>(initialLogins);

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      siteName: '',
      siteInchargeName: '',
      loginName: '',
      password: '',
      role: '',
    },
  });

  function onSubmit(values: NewUserFormValues) {
    const newLogin: Login = {
      id: (logins.length + 1).toString(),
      email: values.loginName,
      site: values.siteName,
      role: values.role,
      status: 'Active',
    };

    setLogins(prev => [newLogin, ...prev]);

    toast({
      title: 'New Login Created!',
      description: `A new login for ${values.loginName} has been created for ${values.siteInchargeName}.`,
    });
    form.reset();
  }

  const handleToggleLoginStatus = (loginId: string) => {
    const loginToUpdate = logins.find(l => l.id === loginId);
    if (!loginToUpdate) return;
    
    const newStatus = loginToUpdate.status === 'Active' ? 'Closed' : 'Active';

    setLogins(currentLogins =>
      currentLogins.map(login => {
        if (login.id === loginId) {
          return { ...login, status: newStatus };
        }
        return login;
      })
    );
    
    toast({
      title: `Login ${newStatus}`,
      description: `Login for ${loginToUpdate.email} has been ${newStatus.toLowerCase()}.`,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <UserPlus /> User & Site Management
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Site Login</CardTitle>
          <CardDescription>
            Add a new site and create the initial login credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Site Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central Site" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteInchargeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Incharge Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role for the new user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="site-manager">Site Manager</SelectItem>
                          <SelectItem value="godown-manager">Godown Manager</SelectItem>
                          <SelectItem value="coordinator">Coordinator</SelectItem>
                          <SelectItem value="purchase-department">Purchase Department</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loginName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login Name (Email)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="manager@newsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Creating...' : 'Create Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users /> Manage Site Logins
          </CardTitle>
          <CardDescription>
            Activate or close logins for different sites. Closed logins cannot be used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {currentUserRole === 'director' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {logins.map((login) => (
                <TableRow key={login.id}>
                  <TableCell>{login.site}</TableCell>
                  <TableCell>{login.email}</TableCell>
                  <TableCell>{roleDisplayNames[login.role] || login.role}</TableCell>
                  <TableCell>
                    <Badge variant={login.status === 'Active' ? 'default' : 'destructive'} className={cn(login.status === 'Active' && 'bg-green-600')}>
                      {login.status}
                    </Badge>
                  </TableCell>
                  {currentUserRole === 'director' && (
                    <TableCell className="text-right">
                      {login.status === 'Active' ? (
                        <Button variant="destructive" size="sm" onClick={() => handleToggleLoginStatus(login.id)}>
                          <PowerOff className="mr-2 h-4 w-4" />
                          Close Login
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleToggleLoginStatus(login.id)}>
                          <Power className="mr-2 h-4 w-4" />
                          Re-open Login
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
