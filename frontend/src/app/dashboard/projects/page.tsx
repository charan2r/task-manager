/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";

type ProjectStatus = "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdById: number;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  _count?: {
    members: number;
    tasks: number;
  };
};

type ProjectsResponse = {
  success: boolean;
  count: number;
  projects: Project[];
};

type ProjectResponse = {
  success: boolean;
  message: string;
  project: Project;
};

const initialForm = {
  name: "",
  description: "",
  status: "ACTIVE" as ProjectStatus,
  startDate: "",
  endDate: "",
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function toApiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function ProjectsPage() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreateProject =
    user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const loadProjects = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<ProjectsResponse>("/projects", token);
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("create") === "1") {
      setIsCreateOpen(true);
      window.history.replaceState(null, "", "/dashboard/projects");
    }
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest<ProjectResponse>("/projects", token, {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          startDate: toApiDate(formData.startDate),
          endDate: toApiDate(formData.endDate),
        }),
      });

      setProjects((currentProjects) => [data.project, ...currentProjects]);
      setFormData(initialForm);
      setIsCreateOpen(false);
      setSuccess("Project created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(projectId: number) {
    if (!token) return;

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    setDeletingProjectId(projectId);
    setError("");

    try {
      await apiRequest(`/projects/${projectId}`, token, {
        method: "DELETE",
      });
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingProjectId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            {user.role === "TEAM_MEMBER"
              ? "Your assigned projects"
              : user.role === "PROJECT_MANAGER"
                ? "Projects managed by you"
                : "All projects"}
          </p>
        </div>
        {canCreateProject && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
            No projects found.
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canEdit={
                user.role === "ADMIN" ||
                (user.role === "PROJECT_MANAGER" &&
                  project.createdById === user.id)
              }
              isDeleting={deletingProjectId === project.id}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Create Project
                </h2>
                <p className="text-sm text-gray-500">
                  Set up a new project for your team.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close create project form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Project Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={100}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project description"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      status: event.target.value as ProjectStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="mb-1 block text-sm font-medium text-gray-900"
                  >
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="mb-1 block text-sm font-medium text-gray-900"
                  >
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  canEdit,
  isDeleting,
  onDelete,
}: {
  project: Project;
  canEdit: boolean;
  isDeleting: boolean;
  onDelete: (projectId: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/dashboard/projects/${project.id}`} className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {project.description || "No description"}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="text-sm text-gray-600">
              Manager: {project.createdBy?.name ?? "Unknown"}
            </span>
            <span className="text-sm text-gray-600">
              {project._count?.members ?? 0} members
            </span>
            <span className="text-sm text-gray-600">
              {project._count?.tasks ?? 0} tasks
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                statusColors[project.status]
              }`}
            >
              {statusLabels[project.status]}
            </span>
          </div>
        </Link>
        {canEdit && (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Edit project"
            >
              <Edit2 className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(project.id)}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete project"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
