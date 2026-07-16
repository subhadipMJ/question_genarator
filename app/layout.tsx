import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "react-quill-new/dist/quill.snow.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QMaster",
  description: "The Smart Assessment Platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("access_token");
  const role = cookieStore.get("user_role")?.value;
  const userName = cookieStore.get("user_name")?.value;
  const organizationName = cookieStore.get("organization_name")?.value;
  const headerName = role === "0" ? "Super Admin" : organizationName || userName || "QMaster";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <Toaster position="top-right" richColors closeButton />
        {isAuthenticated && (
          <header className="bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 py-3">
              <Link href="/dashboard" className="min-w-0">
                <span className="block truncate text-lg font-bold">
                  {headerName}
                </span>
                {role !== "0" && (
                  <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider">
                    {role === "1" ? "Admin" : role === "2" ? "Teacher" : "QMaster"}
                  </span>
                )}
              </Link>

              <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
                <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>Dashboard</Button>
                {role !== "3" && <Button variant="ghost" nativeButton={false} render={<Link href="/questions" />}>Questions</Button>}
                {role !== "3" && <Button variant="ghost" nativeButton={false} render={<Link href="/topics" />}>Topics</Button>}
                {role !== "3" && <Button variant="ghost" nativeButton={false} render={<Link href="/test-series" />}>Test series</Button>}
                {role === "3" && <Button variant="ghost" nativeButton={false} render={<Link href="/student/tests" />}>Tests</Button>}
                {role === "3" && <Button variant="ghost" nativeButton={false} render={<Link href="/student/history" />}>History</Button>}
                <ModeToggle />
                <form action="/api/auth/logout" method="post">
                  <Button variant="outline" type="submit">Log out</Button>
                </form>
              </nav>
            </div>
          </header>
        )}
        <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-3">
          {children}
        </div>
        {/* //footer  */}

        <footer className="mt-1 h-5 px-2 sticky bottom-0">
          <p className="text-muted-foreground text-right text-sm">
            &copy; QMaster - The Smart Assessment Platform
          </p>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
