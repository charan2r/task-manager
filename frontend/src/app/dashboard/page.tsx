"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  CheckSquare,
  FolderOpen,
  FolderPlus,
  PlusSquare,
  Users,
} from "lucide-react";

const dashboardByRole = {
  ADMIN: {
    title: "Admin Dashboard",
    subtitle: "Manage users, projects, and tasks across the workspace.",
    actions: [
      { title: "Manage Users", href: "/dashboard/users", icon: Users },
      { title: "View Projects", href: "/dashboard/projects", icon: FolderOpen },
      { title: "View Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      {
        title: "Create New Project",
        href: "/dashboard/projects/new",
        icon: FolderPlus,
      },
    ],
  },
  PROJECT_MANAGER: {
    title: "Project Manager Dashboard",
    subtitle:
      "Create projects, manage your project work, and coordinate tasks.",
    actions: [
      { title: "Create Project", href: "/dashboard/projects/new", icon: FolderPlus },
      { title: "View My Projects", href: "/dashboard/projects", icon: FolderOpen },
      { title: "Create Task", href: "/dashboard/tasks", icon: PlusSquare },
    ],
  },
  TEAM_MEMBER: {
    title: "Team Member Dashboard",
    subtitle: "Track your assigned projects and update your task progress.",
    actions: [
      { title: "View My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
      { title: "View My Projects", href: "/dashboard/projects", icon: FolderOpen },
    ],
  },
};

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const dashboard = dashboardByRole[user.role];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dashboard.title}</h1>
        <p className="text-gray-600 mt-2">{dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboard.actions.map((action) => (
          <ActionCard
            key={action.href}
            title={action.title}
            href={action.href}
            icon={action.icon}
          />
        ))}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-500 text-sm mt-2">Click to continue</p>
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
    </Link>
  );
}
