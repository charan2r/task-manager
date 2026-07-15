"use client";

import Link from "next/link";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { LayoutDashboard, Users, FolderOpen, CheckSquare } from "lucide-react";

const navigationByRole: Record<
  UserRole,
  { label: string; href: string; icon: React.ReactNode }[]
> = {
  ADMIN: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Users",
      href: "/dashboard/users",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Projects",
      href: "/dashboard/projects",
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="w-5 h-5" />,
    },
  ],
  PROJECT_MANAGER: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "My Projects",
      href: "/dashboard/projects",
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      label: "Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="w-5 h-5" />,
    },
  ],
  TEAM_MEMBER: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "My Projects",
      href: "/dashboard/projects",
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      label: "My Tasks",
      href: "/dashboard/tasks",
      icon: <CheckSquare className="w-5 h-5" />,
    },
  ],
};

export function Sidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const navigation = navigationByRole[user.role] || [];

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 min-h-screen">
      <div className="mb-8"></div>

      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
