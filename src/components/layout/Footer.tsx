import { Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 border-t border-border/50 bg-background">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} React Starter. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                    <Link href="#" aria-label="Twitter">
                        <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                    <Link href="#" aria-label="GitHub">
                        <Github className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                    <Link href="#" aria-label="LinkedIn">
                        <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
