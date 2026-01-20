"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Lock, Mail, User, UserCog, UserSquare, Warehouse, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const router = useRouter();
  const [selection, setSelection] = useState("director/Global");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const [role, site] = selection.split('/');
      localStorage.setItem("userRole", role);
      localStorage.setItem("userSite", site);
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
                <Label htmlFor="role">Login As</Label>
                <Select onValueChange={setSelection} defaultValue={selection}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select your login" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="director/Global">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Director
                      </div>
                    </SelectItem>
                    <SelectItem value="site-manager/North Site">
                      <div className="flex items-center gap-2">
                        <UserSquare className="h-4 w-4" /> North Site
                      </div>
                    </SelectItem>
                    <SelectItem value="site-manager/South Site">
                      <div className="flex items-center gap-2">
                        <UserSquare className="h-4 w-4" /> South Site
                      </div>
                    </SelectItem>
                    <SelectItem value="site-manager/East Site">
                      <div className="flex items-center gap-2">
                        <UserSquare className="h-4 w-4" /> East Site
                      </div>
                    </SelectItem>
                    <SelectItem value="site-manager/West Site">
                      <div className="flex items-center gap-2">
                        <UserSquare className="h-4 w-4" /> West Site
                      </div>
                    </SelectItem>
                    <SelectItem value="coordinator/Global">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" /> Coordinator
                      </div>
                    </SelectItem>
                    <SelectItem value="store-manager/MAPI Store">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" /> MAPI Store
                      </div>
                    </SelectItem>
                    <SelectItem value="purchase-department/Global">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" /> Purchase Department
                      </div>
                    </SelectItem>
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
