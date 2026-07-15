/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useAuth, type UserRole } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";

type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
};

type UsersResponse = {
  success: boolean;
  count: number;
  users: ManagedUser[];
  message?: string;
  errors?: { field?: string; message: string }[];
};

type UserResponse = {
  success: boolean;
  message?: string;
  user: ManagedUser;
  errors?: { field?: string; message: string }[];
};

type EditableRole = Exclude<UserRole, "ADMIN">;

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "");

const roleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800",
  PROJECT_MANAGER: "bg-blue-100 text-blue-800",
  TEAM_MEMBER: "bg-green-100 text-green-800",
};

const roleOptions: { value: EditableRole; label: string }[] = [
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "TEAM_MEMBER", label: "Team Member" },
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "TEAM_MEMBER" as EditableRole,
};

export default function UsersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canLoadUsers = useMemo(
    () => !loading && user?.role === "ADMIN" && Boolean(token),
    [loading, token, user?.role],
  );

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const apiRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      const data = (await response.json().catch(() => ({}))) as
        | UsersResponse
        | UserResponse;

      if (!response.ok) {
        const validationMessage = data.errors
          ?.map((apiError) => apiError.message)
          .join(" ");
        throw new Error(validationMessage || data.message || "Request failed");
      }

      return data as T;
    },
    [token],
  );

  const fetchUsers = useCallback(async () => {
    setIsFetching(true);
    setError("");

    try {
      const data = await apiRequest<UsersResponse>("/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsFetching(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (canLoadUsers) {
      void fetchUsers();
    }
  }, [canLoadUsers, fetchUsers]);

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsCreating(true);

    try {
      const data = await apiRequest<UserResponse>("/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setUsers((currentUsers) => [data.user, ...currentUsers]);
      setFormData(initialForm);
      setIsCreateOpen(false);
      setSuccess("User account created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRoleChange(targetUser: ManagedUser, role: EditableRole) {
    if (targetUser.role === role) return;

    setError("");
    setSuccess("");
    setUpdatingUserId(targetUser.id);

    try {
      const data = await apiRequest<UserResponse>(
        `/users/${targetUser.id}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role }),
        },
      );

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === targetUser.id
            ? { ...currentUser, ...data.user }
            : currentUser,
        ),
      );
      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage project managers and team members
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add member
          </button>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
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

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add member
                </h2>
                <p className="text-sm text-gray-500">
                  Create a project manager or team member account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close add member form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Full name
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      role: event.target.value as EditableRole,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {isCreating ? "Creating..." : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Role
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {isFetching && users.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-8 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((managedUser) => (
                <UserRow
                  key={managedUser.id}
                  user={managedUser}
                  updatingUserId={updatingUserId}
                  onRoleChange={handleRoleChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  updatingUserId,
  onRoleChange,
}: {
  user: ManagedUser;
  updatingUserId: number | null;
  onRoleChange: (user: ManagedUser, role: EditableRole) => void;
}) {
  const joinedDate = user.createdAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(user.createdAt),
      )
    : "-";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">
        {user.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
      <td className="px-6 py-4">
        {user.role === "ADMIN" ? (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[user.role]}`}
          >
            ADMIN
          </span>
        ) : (
          <select
            value={user.role}
            disabled={updatingUserId === user.id}
            onChange={(event) =>
              onRoleChange(user, event.target.value as EditableRole)
            }
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{joinedDate}</td>
      <td className="px-6 py-4">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            user.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {user.isActive ? "Active" : "Inactive"}
        </span>
      </td>
    </tr>
  );
}
