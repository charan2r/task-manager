import prisma from "../config/prisma.js";

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      createdById: true,
    },
  },

  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  },

  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

function parseId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

// Helper functions
function canManageProject(user, project) {
  return (
    user.role === "ADMIN" ||
    (user.role === "PROJECT_MANAGER" && project.createdById === user.id)
  );
}

async function validateTaskAssignee(projectId, assignedToId) {
  if (assignedToId === null || assignedToId === undefined) {
    return {
      valid: true,
      user: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: assignedToId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return {
      valid: false,
      status: 404,
      message: "Assigned user not found.",
    };
  }

  if (user.role !== "TEAM_MEMBER") {
    return {
      valid: false,
      status: 400,
      message: "Tasks can only be assigned to team members.",
    };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: assignedToId,
      },
    },
  });

  if (!membership) {
    return {
      valid: false,
      status: 400,
      message:
        "The selected user must be a member of the project to assign tasks.",
    };
  }

  return {
    valid: true,
    user,
  };
}

// Get all tasks
export async function getTasks(req, res, next) {
  try {
    const where = {};

    if (req.user.role === "PROJECT_MANAGER") {
      where.project = {
        createdById: req.user.id,
      };
    }

    if (req.user.role === "TEAM_MEMBER") {
      where.assignedToId = req.user.id;
    }

    if (req.query.projectId) {
      const projectId = parseId(req.query.projectId);

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      where.projectId = projectId;
    }

    const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE"];

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status.",
        });
      }

      where.status = req.query.status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

// Create a new task
export async function createTask(req, res, next) {
  try {
    const { title, description, projectId, assignedToId, status, dueDate } =
      req.body;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!canManageProject(req.user, project)) {
      return res.status(403).json({
        success: false,
        message: "You can only create tasks for the projects that you manage.",
      });
    }

    const assigneeResult = await validateTaskAssignee(projectId, assignedToId);

    if (!assigneeResult.valid) {
      return res.status(assigneeResult.status).json({
        success: false,
        message: assigneeResult.message,
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId,
        assignedToId: assignedToId || null,
        createdById: req.user.id,
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: taskInclude,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
}

// Get a task by ID
export async function getTaskById(req, res, next) {
  try {
    const taskId = parseId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: taskInclude,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    let allowed = false;

    if (req.user.role === "ADMIN") {
      allowed = true;
    }

    if (
      req.user.role === "PROJECT_MANAGER" &&
      task.project.createdById === req.user.id
    ) {
      allowed = true;
    }

    if (req.user.role === "TEAM_MEMBER" && task.assignedToId === req.user.id) {
      allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this task.",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    next(error);
  }
}

// Update a task
export async function updateTask(req, res, next) {
  try {
    const taskId = parseId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!canManageProject(req.user, existingTask.project)) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update tasks belonging to projects that you manage.",
      });
    }

    if (req.body.assignedToId !== undefined) {
      const assigneeResult = await validateTaskAssignee(
        existingTask.projectId,
        req.body.assignedToId,
      );

      if (!assigneeResult.valid) {
        return res.status(assigneeResult.status).json({
          success: false,
          message: assigneeResult.message,
        });
      }
    }

    const data = {};

    if (req.body.title !== undefined) {
      data.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      data.description = req.body.description || null;
    }

    if (req.body.assignedToId !== undefined) {
      data.assignedToId = req.body.assignedToId || null;
    }

    if (req.body.status !== undefined) {
      data.status = req.body.status;
    }

    if (req.body.dueDate !== undefined) {
      data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data,
      include: taskInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
}

// Update task status by team member only
export async function updateTaskStatus(req, res, next) {
  try {
    const taskId = parseId(req.params.id);
    const { status } = req.body;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (existingTask.assignedToId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update the status of tasks assigned to you.",
      });
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
      include: taskInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE a task
export async function deleteTask(req, res, next) {
  try {
    const taskId = parseId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    if (!canManageProject(req.user, task.project)) {
      return res.status(403).json({
        success: false,
        message:
          "You can only delete tasks belonging to projects that you manage.",
      });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}
