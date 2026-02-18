'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  contactNumber: z.string().optional(),
  siteLocation: z.string().optional(),
  profilePicture: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, site, updateUser } = useUser();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      contactNumber: '',
      siteLocation: '',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber || '123-456-7890',
        siteLocation: user.siteLocation || (site ? `${site} Location, 123 Project Avenue` : 'Head Office, 456 Corporate Blvd'),
      });
      setPreviewImage(user.profilePicture || null);
    }
  }, [user, site, form]);

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        form.setValue('profilePicture', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: ProfileFormValues) {
    if (!user) return;
    
    const updatedUser = {
        ...user,
        name: values.name,
        contactNumber: values.contactNumber,
        siteLocation: values.siteLocation,
        profilePicture: previewImage || user.profilePicture,
    };
    
    updateUser(updatedUser);

    toast({
      title: 'Profile Updated!',
      description: 'Your profile information has been successfully saved.',
    });
  }
  
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Update Profile</CardTitle>
          <CardDescription>
            Manage your personal and site-specific information here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                      <AvatarImage src={previewImage || undefined} />
                      <AvatarFallback className="text-3xl">
                          {user ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                  </Avatar>
                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>Update Profile Picture</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Button asChild variant="outline" className="w-full">
                                <label htmlFor="picture-upload" className="cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                </label>
                            </Button>
                            <Input 
                                id="picture-upload"
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handlePictureChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                />
                </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} readOnly disabled/>
                    </FormControl>
                     <FormDescription>Email cannot be changed.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siteLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Location / Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Construction Ave, City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
