'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);

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

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email === '23di21@psgpolytech.ac.in') {
        // Temporarily display the UID for setup
        setUserUid(user.uid);
        toast({
          title: "Login Successful. UID captured.",
          description: "Please copy the UID displayed on the screen for the next step.",
        });
        // We won't redirect immediately, so you can copy the UID.
        // router.push('/admin/dashboard');
      } else {
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You are not authorized to access this admin panel.",
        });
      }
    } catch (error: any) {
      console.error("Google Sign-In Error: ", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred during sign-in.",
      });
    } finally {
        setIsLoading(false);
    }
  };

  const proceedToDashboard = () => {
    router.push('/admin/dashboard');
  }

  if (userUid) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle>Admin Setup: Step 2</CardTitle>
                    <CardDescription>
                        Copy your User ID (UID) below and add it to your Firestore database.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Your unique Firebase User ID is:
                    </p>
                    <div className="p-3 rounded-md bg-muted font-mono text-sm break-all">
                        {userUid}
                    </div>
                    <p className="text-sm text-muted-foreground pt-4">
                        Now, go to your Firebase project's Firestore Database, create a collection named <strong>adminUsers</strong>, and add a document with this UID as the Document ID. Inside that document, add a field named <strong>role</strong> with the value <strong>Super Admin</strong>.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={proceedToDashboard}>
                        I have saved my UID, proceed to Dashboard
                    </Button>
                </CardFooter>
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
