import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-[400px] shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="rounded-full bg-accent p-6">
              <User className="h-24 w-24 text-accent-foreground" />
            </div>
            <p className="mt-6 text-center text-xl font-semibold text-foreground">
              Scan your ID card
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
