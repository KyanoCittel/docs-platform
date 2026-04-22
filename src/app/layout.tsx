import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/SignOutButton';
import { ToastProvider } from '@/components/Toast';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Documentatie',
  description: 'Intern documentatieplatform',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="nl" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <ToastProvider>
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold">Documentatie</Link>
            <Link href="/" className="text-gray-600 hover:text-black">Alle docs</Link>
            {user && <Link href="/admin" className="text-gray-600 hover:text-black">Admin</Link>}
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-gray-500">{user.email}</span>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/login" className="text-gray-600 hover:text-black">Login</Link>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
