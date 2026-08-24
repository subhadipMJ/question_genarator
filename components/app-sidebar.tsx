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
  PlusCircle,
  User,
  GraduationCap,
  Settings,
  Mail,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import logo from "../public/logos/safalya-logo-new-2.png";
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
          {
            title: "Send Email",
            href: "/super-admin/send-mail",
            icon: Mail,
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
            title: "Users",
            href: "/users",
            icon: User,
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


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between p-0 px-4 group-data-[collapsible=icon]:justify-center border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold group-data-[collapsible=icon]:mx-auto">
         {logo && <img src={logo.src} alt="Logo" className="h-full" />}
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200"
                >
                  <Icon className={`!h-5 !w-5 shrink-0 ${isActive ? "text-primary font-bold" : "text-muted-foreground group-hover/menu-button:text-foreground"}`} />
                  <span className={`font-medium group-data-[collapsible=icon]:hidden truncate ${isActive ? "text-primary font-bold" : "text-muted-foreground group-hover/menu-button:text-foreground"} text-base`}>
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
