"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  FolderOpen,
  Layers,
  History,
  Building2,
  PlusCircle,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  role: string;
  userName: string;
  organizationName?: string;
}

export function AppSidebar({ role, userName, organizationName }: AppSidebarProps) {
  const pathname = usePathname();

  // Define navigation items based on user role
  const getNavItems = () => {
    switch (role) {
      case "0": // Super Admin
        return [
          {
            title: "Super Admin",
            href: "/super-admin",
            icon: LayoutDashboard,
          },
          {
            title: "Questions",
            href: "/questions",
            icon: HelpCircle,
          },
          {
            title: "Create Org",
            href: "/organizations/create",
            icon: PlusCircle,
          },
        ];
      case "1": // Admin
        return [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Questions",
            href: "/questions",
            icon: HelpCircle,
          },
          {
            title: "Topics",
            href: "/topics",
            icon: FolderOpen,
          },
          {
            title: "Test Series",
            href: "/test-series",
            icon: Layers,
          },
          {
            title: "Settings",
            href: "/settings",
            icon: Settings,
          },
        ];
      case "2": // Teacher
        return [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Questions",
            href: "/questions",
            icon: HelpCircle,
          },
          {
            title: "Topics",
            href: "/topics",
            icon: FolderOpen,
          },
          {
            title: "Test Series",
            href: "/test-series",
            icon: Layers,
          },
        ];
      case "3": // Student
        return [
          {
            title: "Available Tests",
            href: "/student/tests",
            icon: GraduationCap,
          },
          {
            title: "Attempt History",
            href: "/student/history",
            icon: History,
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const roleName =
    role === "0"
      ? "Super Admin"
      : role === "1"
        ? "Admin"
        : role === "2"
          ? "Teacher"
          : role === "3"
            ? "Student"
            : "User";

  const brandName = role === "0" ? "Super Admin" : organizationName || userName || "QMaster";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between p-0 px-4 group-data-[collapsible=icon]:justify-center border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold group-data-[collapsible=icon]:mx-auto">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-base shadow-md transition-transform hover:scale-105 shrink-0 select-none">
            Q
          </div>
          <div className="flex flex-col justify-center min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold leading-none truncate">QMaster </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarMenu className="px-2 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Exact match for dashboard/super-admin, prefix match for others to keep highlight active on sub-pages
            const isActive =
              item.href === "/dashboard" || item.href === "/super-admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive}
                  tooltip={item.title}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200"
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary font-bold" : "text-muted-foreground group-hover/menu-button:text-foreground"}`} />
                  <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">
                    {item.title}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>


    </Sidebar>
  );
}
