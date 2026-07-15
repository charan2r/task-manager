/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { apiRequest } from "@/lib/api";
import { useAuth, type UserRole } from "@/lib/auth-context";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  projectId: number;
  assignedToId: number | null;
  project: {
    id: number;
    name: string;
    createdById: number;
  };
  assignedTo: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
};

type Project = {
  id: number;
  name: string;
  createdById: number;
};

type ProjectMember = {
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

type TasksResponse = {
  success: boolean;
  count: number;
  tasks: Task[];
};

type TaskResponse = {
  success: boolean;
  message?: string;
  task: Task;
};

type ProjectsResponse = {
  success: boolean;
  projects: Project[];
};

type ProjectResponse = {
  success: boolean;
  project: {
    id: number;
    members: ProjectMember[];
  };
};

const initialForm = {
  title: "",
  description: "",
  projectId: "",
  assignedToId: "",
  status: "TODO" as TaskStatus,
  dueDate: "",
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "DONE", label: "Done" },
];

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
};

function statusLabel(status: TaskStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toApiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function TasksPage() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  const canManageTasks =
    user?.role === "ADMIN" || user?.role === "PROJECT_MANAGER";

  const loadTasks = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError("");

    try {
      const data = await apiRequest<TasksResponse>("/tasks", token);
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadProjects = useCallback(async () => {
    if (!token || !canManageTasks) return;

    try {
      const data = await apiRequest<ProjectsResponse>("/projects", token);
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
  }, [canManageTasks, token]);

  const loadProjectMembers = useCallback(
    async (projectId: string) => {
      if (!token || !projectId) {
        setProjectMembers([]);
        return;
      }

      try {
        const data = await apiRequest<ProjectResponse>(
          `/projects/${projectId}`,
          token,
        );
        setProjectMembers(
          data.project.members.filter(
            (member) => member.user.role === "TEAM_MEMBER",
          ),
        );
      } catch (err) {
        setProjectMembers([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load project members",
        );
      }
    },
    [token],
  );

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadProjectMembers(formData.projectId);
  }, [formData.projectId, loadProjectMembers]);

  if (!user) return null;

  function openCreateModal() {
    setEditingTask(null);
    setFormData(initialForm);
    setProjectMembers([]);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? "",
      projectId: String(task.projectId),
      assignedToId: task.assignedToId ? String(task.assignedToId) : "",
      status: task.status,
      dueDate: toDateInput(task.dueDate),
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    const body = {
      title: formData.title,
      description: formData.description || null,
      assignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      status: formData.status,
      dueDate: toApiDate(formData.dueDate),
    };

    try {
      const data = editingTask
        ? await apiRequest<TaskResponse>(`/tasks/${editingTask.id}`, token, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiRequest<TaskResponse>("/tasks", token, {
            method: "POST",
            body: JSON.stringify({
              ...body,
              projectId: Number(formData.projectId),
            }),
          });

      setTasks((currentTasks) =>
        editingTask
          ? currentTasks.map((task) =>
              task.id === data.task.id ? data.task : task,
            )
          : [data.task, ...currentTasks],
      );
      setIsModalOpen(false);
      setFormData(initialForm);
      setSuccess(
        editingTask ? "Task updated successfully." : "Task created successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(taskId: number) {
    if (!token) return;

    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    setDeletingTaskId(taskId);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/tasks/${taskId}`, token, { method: "DELETE" });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      );
      setSuccess("Task deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (!token || task.status === status) return;

    setUpdatingStatusId(task.id);
    setError("");
    setSuccess("");

    try {
      const data = await apiRequest<TaskResponse>(
        `/tasks/${task.id}/status`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? data.task : currentTask,
        ),
      );
      setSuccess("Task status updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update task status",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">
            {user.role === "TEAM_MEMBER" ? "Your assigned tasks" : "Managed tasks"}
          </p>
        </div>
        {canManageTasks && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create Task
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

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Task</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assignee</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={6}>
                  Loading tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-sm text-gray-500" colSpan={6}>
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  canManage={canManageTasks}
                  userRole={user.role}
                  isUpdatingStatus={updatingStatusId === task.id}
                  isDeleting={deletingTaskId === task.id}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTask ? "Edit Task" : "Create Task"}
                </h2>
                <p className="text-sm text-gray-500">
                  Tasks can only be assigned to members of the selected project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close task form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 p-6">
              <input
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
                minLength={4}
                maxLength={150}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Task title"
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
                maxLength={1000}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description"
              />

              <select
                value={formData.projectId}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    projectId: event.target.value,
                    assignedToId: "",
                  }))
                }
                required
                disabled={Boolean(editingTask)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={formData.assignedToId}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    assignedToId: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      status: event.target.value as TaskStatus,
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
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingTask ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  canManage,
  userRole,
  isUpdatingStatus,
  isDeleting,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  canManage: boolean;
  userRole: UserRole;
  isUpdatingStatus: boolean;
  isDeleting: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const canUpdateOwnStatus = userRole === "TEAM_MEMBER";

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-900">
        <div className="font-medium">{task.title}</div>
        {task.description && (
          <div className="mt-1 max-w-sm truncate text-xs text-gray-500">
            {task.description}
          </div>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{task.project.name}</td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {task.assignedTo?.name ?? "Unassigned"}
      </td>
      <td className="px-6 py-4">
        {canUpdateOwnStatus ? (
          <select
            value={task.status}
            disabled={isUpdatingStatus}
            onChange={(event) =>
              onStatusChange(task, event.target.value as TaskStatus)
            }
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              statusColors[task.status]
            }`}
          >
            {statusLabel(task.status)}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {toDateInput(task.dueDate) || "-"}
      </td>
      <td className="px-6 py-4">
        {canManage ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              aria-label="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              disabled={isDeleting}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Status only</span>
        )}
      </td>
    </tr>
  );
}
