'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = () => {
    if (staffId === '23di21' && password === '12345') {
      router.push('/admin/dashboard');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid Staff ID or Password.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <UserCircle2 className="h-20 w-20 text-muted-foreground" />
          <CardTitle className="mt-4 text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-id">Staff ID</Label>
            <Input 
              id="staff-id" 
              placeholder="Enter your staff ID" 
              required 
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Enter your password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>Log In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
