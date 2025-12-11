'use client';

import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your library's settings and preferences.
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Library Policy</CardTitle>
                <CardDescription>Define the rules for borrowing and returning books.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label htmlFor="loan-period">Standard Loan Period</Label>
                        <p className="text-sm text-muted-foreground">The default number of days a member can borrow a book.</p>
                    </div>
                    <Input id="loan-period" type="number" defaultValue="14" className="w-24" />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-4">
                     <div className="space-y-1">
                        <Label htmlFor="fine-rate">Overdue Fine Rate</Label>
                        <p className="text-sm text-muted-foreground">The fine amount charged per day for an overdue book.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input id="fine-rate" type="number" step="0.1" defaultValue="0.50" className="w-24" />
                    </div>
                </div>
                 <Separator />
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Allow Renewals</Label>
                        <p className="text-sm text-muted-foreground">Let members extend their loan period for books.</p>
                    </div>
                    <Switch defaultChecked />
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button>Save Policy</Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide application settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Theme</Label>
                        <p className="text-sm text-muted-foreground">Choose the appearance of the application.</p>
                    </div>
                    <Select defaultValue="light">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light Mode</SelectItem>
                            <SelectItem value="dark">Dark Mode</SelectItem>
                            <SelectItem value="system">System Default</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Separator />
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <Label>Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable or disable email notifications for members.</p>
                    </div>
                    <Switch />
                </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
                <Button>Save Settings</Button>
            </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
