'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from "lucide-react";
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async () => {
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Firebase Auth is not initialized.",
        });
        return;
    }

    // Replace dummy credentials with Firebase Auth
    // The previous dummy credentials were: staffId === '23di21' && password === '12345'
    // For now, let's use a test email and password. In a real scenario, you'd have a way to create admin users.
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/admin/dashboard');
    } catch (error: any) {
        let description = "An unknown error occurred.";
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                description = "Invalid email or password.";
                break;
            case 'auth/invalid-email':
                description = "Please enter a valid email address.";
                break;
            default:
                description = "Login failed. Please try again.";
                break;
        }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description,
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
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              placeholder="Enter your email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

    