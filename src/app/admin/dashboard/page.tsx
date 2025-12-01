
import { AdminHeader } from '@/components/layout/AdminHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Users } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AdminHeader />
      <main className="flex flex-1 flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-6xl">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-lg text-muted-foreground mt-2">Welcome, Admin!</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Total Books Available
                        </CardTitle>
                        <Book className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,250</div>
                        <p className="text-xs text-muted-foreground">
                        Ready for checkout
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        Books with Students
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">342</div>
                        <p className="text-xs text-muted-foreground">
                        Currently checked out
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
