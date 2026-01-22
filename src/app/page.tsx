"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building, Lock, Mail, User, UserCog, UserSquare, Warehouse, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = [
  { value: 'director', label: 'Director', icon: User },
  { value: 'site-manager', label: 'Site Manager', icon: UserSquare },
  { value: 'coordinator', label: 'Coordinator', icon: UserCog },
  { value: 'godown-manager', label: 'Godown Manager', icon: Building },
  { value: 'purchase-department', label: 'Purchase Department', icon: ShoppingCart },
];

const ALL_SITES = ["North Site", "South Site", "East Site", "West Site"];

const SITE_OPTIONS: Record<string, string[]> = {
  director: ["Global", ...ALL_SITES],
  'site-manager': ALL_SITES,
  coordinator: ["Global", ...ALL_SITES],
  'godown-manager': ["MAPI Godown"],
  'purchase-department': ["Global", ...ALL_SITES],
};


export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("director");
  const [site, setSite] = useState("Global");

  useEffect(() => {
    // When role changes, update site to a valid default for that role
    const availableSites = SITE_OPTIONS[role] || [];
    if (!availableSites.includes(site)) {
        setSite(availableSites[0]);
    }
  }, [role, site]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", role);
      localStorage.setItem("userSite", site);
      localStorage.setItem("lastLogin", new Date().toISOString());
    }
    router.push("/dashboard");
  };
  
  const availableSitesForRole = SITE_OPTIONS[role] || [];

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={setRole} value={role}>
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
                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Select onValueChange={setSite} value={site} disabled={availableSitesForRole.length <= 1}>
                    <SelectTrigger id="site" className="w-full">
                      <SelectValue placeholder="Select your site" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSitesForRole.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
