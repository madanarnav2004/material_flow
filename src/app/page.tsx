"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Lock, Mail, User, UserCog, UserSquare, Warehouse, ShoppingCart, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";

const ROLES = [
  { value: 'director', label: 'Director', icon: User, site: 'Global', role: 'director' },
  { value: 'coordinator', label: 'Coordinator', icon: UserCog, site: 'Global', role: 'coordinator' },
  { value: 'purchase-department', label: 'Purchase Department', icon: ShoppingCart, site: 'Global', role: 'purchase-department' },
  { value: 'godown-manager', label: 'Godown Manager', icon: Building, site: 'MAPI Godown', role: 'godown-manager' },
  { value: 'site-manager-north', label: 'Site Manager (North)', icon: UserSquare, site: 'North Site', role: 'site-manager' },
  { value: 'site-manager-south', label: 'Site Manager (South)', icon: UserSquare, site: 'South Site', role: 'site-manager' },
  { value: 'site-manager-east', label: 'Site Manager (East)', icon: UserSquare, site: 'East Site', role: 'site-manager' },
  { value: 'site-manager-west', label: 'Site Manager (West)', icon: UserSquare, site: 'West Site', role: 'site-manager' },
  { value: 'tender-department', label: 'Tender Department', icon: Layers, site: 'Global', role: 'tender-department' },
];


export default function LoginPage() {
  const router = useRouter();
  const [selectedRoleValue, setSelectedRoleValue] = useState("director");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedRole = ROLES.find(r => r.value === selectedRoleValue);
    if (!selectedRole) return;

    if (typeof window !== "undefined") {
      // Store a unique key for the user instead of just the role
      localStorage.setItem("userKey", selectedRole.value);
      localStorage.setItem("lastLogin", new Date().toISOString());
    }
    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Warehouse className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">MaterialFlow</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="user@example.com" required className="pl-10" defaultValue="user@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" required className="pl-10" defaultValue="password" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={setSelectedRoleValue} value={selectedRoleValue}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      return (
                        <SelectItem key={r.value} value={r.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {r.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full text-lg">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
