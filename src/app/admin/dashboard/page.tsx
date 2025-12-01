
import { Header } from '@/components/layout/Header';

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Welcome, Admin!</p>
        </div>
      </main>
    </div>
  );
}
