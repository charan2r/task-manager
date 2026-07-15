/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { apiRequest } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";

type ProjectStatus = "ACTIVE" | "INACTIVE" | "COMPLETED" | "CANCELLED";

type ProjectMember = {
  membershipId: number;
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  joinedAt?: string;
};

type AvailableMember = {
  id: number;
  name: string;
  email: string;
  role: "TEAM_MEMBER";
  isActive: boolean;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdById: number;
  createdBy: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
  members: {
    id: number;
    userId: number;
    joinedAt: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: UserRole;
      isActive: boolean;
    };
  }[];
  _count: {
    members: number;
    tasks: number;
  };
};

type ProjectResponse = {
  success: boolean;
  message?: string;
  project: Project;
};

type MemberResponse = {
  success: boolean;
  message?: string;
  member: ProjectMember;
};

type AvailableMembersResponse = {
  success: boolean;
  count: number;
  members: AvailableMember[];
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  INACTIVE: "bg-gray-100 text-gray-700",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-700",
};

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toApiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function ProjectDetailPage() {
  const { user, token } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [memberUserId, setMemberUserId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as ProjectStatus,
    startDate: "",
    endDate: "",
  });

  const loadProject = useCallback(async () => {
    if (!token || !projectId) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<ProjectResponse>(
        `/projects/${projectId}`,
        token,
      );
      setProject(data.project);
      setFormData({
        name: data.project.name,
        description: data.project.description ?? "",
        status: data.project.status,
        startDate: toDateInput(data.project.startDate),
        endDate: toDateInput(data.project.endDate),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const canManage =
    Boolean(project) &&
    (user?.role === "ADMIN" ||
      (user?.role === "PROJECT_MANAGER" && project?.createdById === user.id));

  const loadAvailableMembers = useCallback(async () => {
    if (!token || !projectId || !canManage) return;

    setIsLoadingMembers(true);

    try {
      const data = await apiRequest<AvailableMembersResponse>(
        `/projects/${projectId}/available-members`,
        token,
      );
      setAvailableMembers(data.members);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load available team members",
      );
    } finally {
      setIsLoadingMembers(false);
    }
  }, [canManage, projectId, token]);

  useEffect(() => {
    void loadAvailableMembers();
  }, [loadAvailableMembers]);

  if (!user) return null;

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !project) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest<ProjectResponse>(
        `/projects/${project.id}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            startDate: toApiDate(formData.startDate),
            endDate: toApiDate(formData.endDate),
          }),
        },
      );
      setProject(data.project);
      setIsEditOpen(false);
      setSuccess("Project updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !project) return;

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    setError("");

    try {
      await apiRequest(`/projects/${project.id}`, token, {
        method: "DELETE",
      });
      router.push("/dashboard/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  async function handleAddMember(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !project) return;

    setIsAddingMember(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest<MemberResponse>(
        `/projects/${project.id}/members`,
        token,
        {
          method: "POST",
          body: JSON.stringify({ userId: Number(memberUserId) }),
        },
      );

      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              members: [
                ...currentProject.members,
                {
                  id: data.member.membershipId,
                  userId: data.member.id,
                  joinedAt: data.member.joinedAt ?? new Date().toISOString(),
                  user: {
                    id: data.member.id,
                    name: data.member.name,
                    email: data.member.email,
                    role: data.member.role,
                    isActive: data.member.isActive,
                  },
                },
              ],
              _count: {
                ...currentProject._count,
                members: currentProject._count.members + 1,
              },
            }
          : currentProject,
      );
      setAvailableMembers((currentMembers) =>
        currentMembers.filter((member) => member.id !== data.member.id),
      );
      setMemberUserId("");
      setSuccess("Project member added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!token || !project) return;

    const removedMember = project.members.find(
      (member) => member.userId === userId,
    );

    setRemovingUserId(userId);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/projects/${project.id}/members/${userId}`, token, {
        method: "DELETE",
      });
      setProject((currentProject) =>
        currentProject
          ? {
              ...currentProject,
              members: currentProject.members.filter(
                (member) => member.userId !== userId,
              ),
              _count: {
                ...currentProject._count,
                members: Math.max(currentProject._count.members - 1, 0),
              },
            }
          : currentProject,
      );
      if (removedMember?.user.role === "TEAM_MEMBER") {
        const availableMember: AvailableMember = {
          id: removedMember.user.id,
          name: removedMember.user.name,
          email: removedMember.user.email,
          role: "TEAM_MEMBER",
          isActive: removedMember.user.isActive,
        };

        setAvailableMembers((currentMembers) =>
          [...currentMembers, availableMember].sort((first, second) =>
            first.name.localeCompare(second.name),
          ),
        );
      }
      setSuccess("Project member removed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingUserId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-sm text-gray-500">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-sm text-red-700">{error || "Project not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 text-sm mb-4"
          >
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">
            {project.description || "No description"}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Edit project"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard label="Project Manager" value={project.createdBy.name} />
        <InfoCard
          label="Status"
          value={
            statusOptions.find((status) => status.value === project.status)
              ?.label ?? project.status
          }
          badgeClassName={statusColors[project.status]}
        />
        <InfoCard
          label="Start Date"
          value={toDateInput(project.startDate) || "-"}
        />
        <InfoCard label="Tasks" value={String(project._count.tasks)} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members ({project._count.members})
          </h2>
          {canManage && (
            <form onSubmit={handleAddMember} className="flex gap-2">
              <select
                value={memberUserId}
                onChange={(event) => setMemberUserId(event.target.value)}
                required
                disabled={isLoadingMembers || availableMembers.length === 0}
                className="min-w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {isLoadingMembers
                    ? "Loading members..."
                    : availableMembers.length === 0
                      ? "No unassigned team members"
                      : "Select team member"}
                </option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={
                  isAddingMember ||
                  isLoadingMembers ||
                  availableMembers.length === 0
                }
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {project.members.length === 0 ? (
            <p className="text-sm text-gray-500">No members assigned.</p>
          ) : (
            project.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {member.user.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {member.user.email} · {member.user.role.replace("_", " ")}
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.userId)}
                    disabled={removingUserId === member.userId}
                    className="text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Project
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close edit project form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 p-6">
              <input
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
                placeholder="Project name"
              />
              <textarea
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
                placeholder="Description"
              />
              <select
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
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
                <input
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
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  badgeClassName,
}: {
  label: string;
  value: string;
  badgeClassName?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-600">{label}</p>
      {badgeClassName ? (
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${badgeClassName}`}
        >
          {value}
        </span>
      ) : (
        <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
      )}
    </div>
  );
}
