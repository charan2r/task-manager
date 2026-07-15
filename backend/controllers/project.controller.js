import prisma from "../config/prisma.js";

const projectDetailsInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },

  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  },

  _count: {
    select: {
      members: true,
      tasks: true,
    },
  },
};

// Helper functions
function parseId(value) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function canManageProject(user, project) {
  return (
    user.role === "ADMIN" ||
    (user.role === "PROJECT_MANAGER" && project.createdById === user.id)
  );
}

async function findProjectForAccess(projectId, user) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: projectDetailsInclude,
  });

  if (!project) {
    return {
      project: null,
      allowed: false,
    };
  }

  if (user.role === "ADMIN") {
    return {
      project,
      allowed: true,
    };
  }

  if (user.role === "PROJECT_MANAGER" && project.createdById === user.id) {
    return {
      project,
      allowed: true,
    };
  }

  if (user.role === "TEAM_MEMBER") {
    const isMember = project.members.some(
      (member) => member.userId === user.id,
    );

    return {
      project,
      allowed: isMember,
    };
  }

  return {
    project,
    allowed: false,
  };
}

// Get all projects
export async function getProjects(req, res, next) {
  try {
    let where = {};

    if (req.user.role === "PROJECT_MANAGER") {
      where = {
        createdById: req.user.id,
      };
    }

    if (req.user.role === "TEAM_MEMBER") {
      where = {
        members: {
          some: {
            userId: req.user.id,
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
}

// Add project by a project manager or an admin
export async function createProject(req, res, next) {
  try {
    const { name, description, status, startDate, endDate } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: status || "ACTIVE",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById: req.user.id,
      },

      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Get project by ID
export async function getProjectById(req, res, next) {
  try {
    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const { project, allowed } = await findProjectForAccess(
      projectId,
      req.user,
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this project.",
      });
    }

    return res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Update project by a project manager or an admin
export async function updateProject(req, res, next) {
  try {
    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const existingProject = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!canManageProject(req.user, existingProject)) {
      return res.status(403).json({
        success: false,
        message: "You can only update projects that you manage.",
      });
    }

    const finalStartDate =
      req.body.startDate !== undefined
        ? req.body.startDate
          ? new Date(req.body.startDate)
          : null
        : existingProject.startDate;

    const finalEndDate =
      req.body.endDate !== undefined
        ? req.body.endDate
          ? new Date(req.body.endDate)
          : null
        : existingProject.endDate;

    if (finalStartDate && finalEndDate && finalEndDate < finalStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be on or after the start date.",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      data.name = req.body.name;
    }

    if (req.body.description !== undefined) {
      data.description = req.body.description || null;
    }

    if (req.body.status !== undefined) {
      data.status = req.body.status;
    }

    if (req.body.startDate !== undefined) {
      data.startDate = finalStartDate;
    }

    if (req.body.endDate !== undefined) {
      data.endDate = finalEndDate;
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data,
      include: projectDetailsInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    next(error);
  }
}

// Delete project by a project manager or an admin
export async function deleteProject(req, res, next) {
  try {
    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

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
        message: "You can only delete projects that you manage.",
      });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

// Get project members
export async function getProjectMembers(req, res, next) {
  try {
    const projectId = parseId(req.params.id);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const { project, allowed } = await findProjectForAccess(
      projectId,
      req.user,
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view these members.",
      });
    }

    const members = project.members.map((membership) => ({
      membershipId: membership.id,
      joinedAt: membership.joinedAt,
      ...membership.user,
    }));

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    next(error);
  }
}

// Assign project member by a project manager or an admin
export async function assignProjectMember(req, res, next) {
  try {
    const projectId = parseId(req.params.id);
    const userId = Number(req.body.userId);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

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
        message: "You can only add members to projects that you manage.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot be assigned as project members.",
      });
    }

    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: "This user is already a project member.",
      });
    }

    const membership = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project member assigned successfully.",
      member: {
        membershipId: membership.id,
        joinedAt: membership.joinedAt,
        ...membership.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Remove project member by a project manager or an admin
export async function removeProjectMember(req, res, next) {
  try {
    const projectId = parseId(req.params.id);
    const userId = parseId(req.params.userId);

    if (!projectId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID or user ID.",
      });
    }

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
        message: "You can only remove members from projects that you manage.",
      });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "This user is not a member of the project.",
      });
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: {
          projectId,
          assignedToId: userId,
        },
        data: {
          assignedToId: null,
        },
      }),

      prisma.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message:
        "Project member removed and their project tasks were unassigned.",
    });
  } catch (error) {
    next(error);
  }
}
