'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Trash, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const newUserSchema = z.object({
  siteName: z.string().min(1, 'Site name is required.'),
  siteInchargeName: z.string().min(1, 'Site Incharge name is required.'),
  loginName: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.string().min(1, 'Role is required.'),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

const mockUserActivity = [
  { id: '1', email: 'manager@northsite.com', loginTime: '2024-07-29 09:05 AM', logoutTime: '2024-07-29 05:15 PM', totalHours: '8h 10m' },
  { id: '2', email: 'manager@southsite.com', loginTime: '2024-07-29 08:55 AM', logoutTime: '2024-07-29 06:00 PM', totalHours: '9h 5m' },
  { id: '3', email: 'l.gomez@materialflow.com', loginTime: '2024-07-29 09:30 AM', logoutTime: '2024-07-29 05:30 PM', totalHours: '8h 0m' },
  { id: '4', email: 's.khan@materialflow.com', loginTime: '2024-07-29 09:00 AM', logoutTime: 'Not logged out', totalHours: '-' },
];


export default function UserManagementPage() {
  const { toast } = useToast();
  const { role: currentUserRole } = useUser();
  const [userActivity, setUserActivity] = React.useState(mockUserActivity);

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
    console.log('Creating new user with values:', values);
    toast({
      title: 'New Login Created!',
      description: `A new login for ${values.loginName} has been created for ${values.siteInchargeName}.`,
    });
    form.reset();
  }

  const handleDeleteUser = (userId: string) => {
    setUserActivity(currentActivity => currentActivity.filter(user => user.id !== userId));
    toast({
        title: 'User Deleted',
        description: 'The user login has been removed.',
        variant: 'destructive',
    });
  }

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
            <Users /> User Activity
          </CardTitle>
          <CardDescription>
            Overview of user login times and activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Email</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Logout Time</TableHead>
                <TableHead>Total Hours</TableHead>
                {currentUserRole === 'director' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userActivity.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.loginTime}</TableCell>
                  <TableCell>{user.logoutTime}</TableCell>
                  <TableCell>{user.totalHours}</TableCell>
                  {currentUserRole === 'director' && (
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
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
