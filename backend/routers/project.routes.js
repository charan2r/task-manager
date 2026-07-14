import { Router } from "express";
import {
  assignProjectMember,
  createProject,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject,
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  assignProjectMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project and project member management endpoints
 */

router.use(authenticate);

// Only admins can view all projects.
/**
 * @swagger
 * /projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Authentication token is missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Only administrators can view all projects.
 */
router.get("/", authorizeRoles("ADMIN"), getProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *     responses:
 *       200:
 *         description: Project returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You do not have permission to view this project.
 *       404:
 *         description: Project not found.
 */
router.get("/:id", getProjectById);

/**
 * @swagger
 * /projects/{id}/members:
 *   get:
 *     summary: Get project members
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *     responses:
 *       200:
 *         description: Project members returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 members:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectMember'
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You do not have permission to view these members.
 *       404:
 *         description: Project not found.
 */
router.get("/:id/members", getProjectMembers);

// Only admins and project managers can create or manage projects.
/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project created successfully.
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Authentication token is missing
 *       403:
 *         description: Only administrators and project managers can create projects.
 */
router.post(
  "/",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validate(createProjectSchema),
  createProject,
);

/**
 * @swagger
 * /projects/{id}:
 *   patch:
 *     summary: Update a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project updated successfully.
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You can only update projects that you manage.
 *       404:
 *         description: Project not found.
 */
router.patch(
  "/:id",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validate(updateProjectSchema),
  updateProject,
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *     responses:
 *       200:
 *         description: Project deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully.
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You can only delete projects that you manage.
 *       404:
 *         description: Project not found.
 */
router.delete(
  "/:id",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  deleteProject,
);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     summary: Assign a project member
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddProjectMemberRequest'
 *     responses:
 *       201:
 *         description: Project member assigned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project member added successfully.
 *                 member:
 *                   $ref: '#/components/schemas/ProjectMember'
 *       400:
 *         description: Invalid project ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You can only add members to projects that you manage.
 *       404:
 *         description: Project or user not found.
 *       409:
 *         description: This user is already a project member.
 */
router.post(
  "/:id/members",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  validate(assignProjectMemberSchema),
  assignProjectMember,
);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a project member
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID.
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID.
 *     responses:
 *       200:
 *         description: Project member removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Project member removed successfully.
 *       400:
 *         description: Invalid project ID or user ID.
 *       401:
 *         description: Authentication token is missing.
 *       403:
 *         description: You can only remove members from projects that you manage.
 *       404:
 *         description: Project not found, or user is not a member of the project.
 */
router.delete(
  "/:id/members/:userId",
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  removeProjectMember,
);

export default router;
