import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <Toaster position="top-right" richColors closeButton />
            {isAuthenticated ? (
              <SidebarProvider>
                <AppSidebar role={role ?? ""} userName={userName ?? "User"} organizationName={organizationName} />
                <div data-app-shell="content" className="flex flex-col flex-1 h-screen overflow-y-auto overflow-x-hidden">
                  <header data-app-shell="header" className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur flex h-16 shrink-0 items-center justify-between gap-2 px-6">
                    <div className="flex items-center gap-2 justify-center">
                      <SidebarTrigger />
                      <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
                        {headerName} -<span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider hidden sm:inline-block   ml-1">{role === "1" ? "Admin" : role === "2" ? "Teacher" : "Student"}</span>
                      </span>

                    </div>
                    <div className="flex items-center gap-4">
                      <ModeToggle />
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity outline-none bg-transparent border-0 p-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground font-semibold shadow-xs shrink-0">
                            {userName ? userName.charAt(0).toUpperCase() : "U"}
                          </div>
                          {/* <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block shrink-0" /> */}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          side="bottom"
                          align="end"
                          className="w-56 p-1 bg-popover text-popover-foreground rounded-lg border border-border shadow-md"
                        >
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            My Account
                          </div>
                          <div className="px-2 py-1.5 border-b border-border mb-1">
                            <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {role === "0"
                                ? "Super Admin"
                                : role === "1"
                                  ? "Admin"
                                  : role === "2"
                                    ? "Teacher"
                                    : role === "3"
                                      ? "Student"
                                      : "User"}
                            </p>
                          </div>
                          <form action="/api/auth/logout" method="post" className="w-full">
                            <button
                              type="submit"
                              className="w-full cursor-pointer flex items-center gap-2 px-1.5 py-1 text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 rounded-md bg-transparent border-0 text-left outline-none"
                            >
                              <LogOut className="h-4 w-4 shrink-0" />
                              <span>Log out</span>
                            </button>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </header>
                  <main data-app-shell="main" className="flex-1 p-6">
                    {children}
                  </main>
                  <footer data-app-shell="footer" className="bg-background/95 sticky bottom-0 z-40 border-t backdrop-blur flex h-10 px-6 items-center justify-between shrink-0">
                    <p className="text-muted-foreground text-xs">
                      @QMaster - The Smart Assessment Platform
                    </p>
                    {/* <p className="text-muted-foreground text-xs">
                      &copy; {new Date().getFullYear()}
                    </p> */}
                  </footer>
                </div>
              </SidebarProvider>
            ) : (
              <div className="flex-1 min-h-screen flex flex-col">
                <main className="flex-1">
                  {children}
                </main>
              </div>
            )}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
