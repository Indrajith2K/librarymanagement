
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <Link href="/" className="mb-8 text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Home
        </Link>
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="items-center text-center">
          <UserCircle2 className="h-20 w-20 text-muted-foreground" />
          <CardTitle className="mt-4 text-2xl">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-id">Staff ID</Label>
            <Input id="staff-id" placeholder="Enter your staff ID" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Log In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
