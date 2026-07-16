import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
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
  title: "Question Generator",
  description: "Create and manage questions",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has("access_token");
  const role = cookieStore.get("user_role")?.value;
  const organizationName = cookieStore.get("organization_name")?.value;
  const headerName = role === "0" ? "Super Admin" : organizationName || "Organization";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {isAuthenticated && (
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 py-3">
              <Link href="/dashboard" className="min-w-0">
                <span className="block truncate text-lg font-bold text-gray-950 dark:text-white">
                  {headerName}
                </span>
                {role !== "0" && (
                  <span className="block text-xs font-medium uppercase tracking-wider text-gray-500">
                    {role === "1" ? "Admin" : role === "2" ? "Teacher" : "Question Generator"}
                  </span>
                )}
              </Link>

              <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-3">
                <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800">
                  Dashboard
                </Link>
                <Link href="/questions" className="rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:hover:bg-gray-800">
                  Questions
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                    Log out
                  </button>
                </form>
              </nav>
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
