'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');


  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    };

    // This is for the Google Sign-in redirect flow
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const user = result.user;
          // Check if the signed-in user is the designated admin
          if (user.email === '23di21@psgpolytech.ac.in') {
            toast({
              title: "Login Successful",
              description: "Redirecting to the admin dashboard...",
            });
            router.push('/admin/dashboard');
          } else {
            // If not the admin, sign them out and show an error
            signOut(auth);
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You are not authorized to access this admin panel.",
            });
          }
        }
        setIsLoading(false); // Stop loading once redirect is processed or if there's no result
      })
      .catch((error) => {
        console.error("Google Sign-In Redirect Error: ", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
        });
        setIsLoading(false);
        setGoogleLoading(false);
      });
  }, [auth, router, toast]);

  const handlePasswordLogin = () => {
    // Dummy authentication as per documentation
    if (staffId === '23di21' && password === '12345') {
        toast({
            title: "Login Successful",
            description: "Redirecting to the admin dashboard...",
        });
        // We'll manually set a session flag for non-firebase auth for dashboard guard
        // This is a temporary solution for the dummy login
        sessionStorage.setItem('dummy_admin', 'true');
        router.push('/admin/dashboard');
    } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Incorrect Staff ID or Password.",
        });
    }
  };


  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase is not configured. Please check your setup.",
        });
        return;
    }
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };
  
  if (isLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="items-center text-center">
                    <UserCircle2 className="h-20 w-20 text-muted-foreground animate-pulse" />
                    <CardTitle className="mt-4 text-2xl">Verifying...</CardTitle>
                    <CardDescription>Please wait while we check your credentials.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <UserCircle2 className="h-20 w-20 text-muted-foreground" />
          <CardTitle className="mt-4 text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="staff-id">Staff ID</Label>
                    <Input 
                        id="staff-id" 
                        placeholder="e.g. 23di21" 
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
                        placeholder="*****" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
             <Button className="w-full" onClick={handlePasswordLogin}>
                Login
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
