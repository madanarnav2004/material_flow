'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const newUserSchema = z.object({
  siteName: z.string().min(1, 'Site name is required.'),
  loginName: z.string().email('Please enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: z.string().min(1, 'Role is required.'),
});

type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function UserManagementPage() {
  const { toast } = useToast();

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      siteName: '',
      loginName: '',
      password: '',
      role: '',
    },
  });

  function onSubmit(values: NewUserFormValues) {
    console.log('Creating new user with values:', values);
    // Here you would typically call an API to create the user
    // and add the new site manager role to the login page options.
    toast({
      title: 'New Login Created!',
      description: `A new login for ${values.loginName} at ${values.siteName} has been created.`,
    });
    form.reset();
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
            Add a new site and create the initial login credentials for the Site Manager.
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
    </div>
  );
}
