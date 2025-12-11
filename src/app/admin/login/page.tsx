'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    };

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
            // Redirect directly to the dashboard
            router.push('/admin/dashboard');
          } else {
            // If not the admin, sign them out and show an error
            signOut(auth);
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You are not authorized to access this admin panel.",
            });
            setIsLoading(false);
          }
        } else {
            // No redirect result, so just stop loading
            setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Google Sign-In Redirect Error: ", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message || "An unexpected error occurred during sign-in.",
        });
        setIsLoading(false);
      });
  }, [auth, router, toast]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Firebase is not configured. Please check your setup.",
        });
        return;
    }

    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };
  
  // While checking for redirect result, show a loading state
  if (isLoading) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <Card className="w-full max-w-sm shadow-lg">
                <CardHeader className="items-center text-center">
                    <UserCircle2 className="h-20 w-20 text-muted-foreground animate-pulse" />
                    <CardTitle className="mt-4 text-2xl">Verifying...</CardTitle>
                    <CardDescription>Please wait while we check your credentials.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center">
                        {/* You can add a spinner here if you like */}
                    </div>
                </CardContent>
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
          <CardDescription>Sign in to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form content removed */}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
