import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const apiVersion = "v1";
const apiPrefix = `/api/${apiVersion}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routeFiles = path.join(__dirname, "../routers/*.js").replace(/\\/g, "/");

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "API documentation for the Task Manager.",
    },
    servers: [
      {
        url: apiPrefix,
        description: "Version 1 API",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              example: "Jane Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "password123",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 20,
              example: "Alex Morgan",
            },
            email: {
              type: "string",
              format: "email",
              example: "alex@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "password123",
            },
            role: {
              type: "string",
              enum: ["PROJECT_MANAGER", "TEAM_MEMBER"],
              example: "TEAM_MEMBER",
            },
          },
        },
        UpdateUserRoleRequest: {
          type: "object",
          required: ["role"],
          properties: {
            role: {
              type: "string",
              enum: ["PROJECT_MANAGER", "TEAM_MEMBER"],
              example: "PROJECT_MANAGER",
            },
          },
        },
        CreateProjectRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 50,
              example: "Website Redesign",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 100,
              example: "Refresh the marketing website.",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"],
              example: "ACTIVE",
            },
            startDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-07-15T09:00:00.000Z",
            },
            endDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-08-15T17:00:00.000Z",
            },
          },
        },
        UpdateProjectRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            name: {
              type: "string",
              minLength: 3,
              maxLength: 50,
              example: "Website Launch",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 100,
              example: "Prepare the site for launch.",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"],
              example: "COMPLETED",
            },
            startDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-07-15T09:00:00.000Z",
            },
            endDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-08-20T17:00:00.000Z",
            },
          },
        },
        AddProjectMemberRequest: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: {
              type: "integer",
              example: 3,
            },
          },
        },
        CreateTaskRequest: {
          type: "object",
          required: ["title", "projectId"],
          properties: {
            title: {
              type: "string",
              minLength: 4,
              maxLength: 150,
              example: "Build dashboard UI",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 1000,
              example: "Create the first version of the project dashboard.",
            },
            projectId: {
              type: "integer",
              example: 1,
            },
            assignedToId: {
              type: "integer",
              nullable: true,
              example: 3,
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
              example: "TODO",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-07-25T17:00:00.000Z",
            },
          },
        },
        UpdateTaskRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            title: {
              type: "string",
              minLength: 4,
              maxLength: 150,
              example: "Build dashboard UI",
            },
            description: {
              type: "string",
              nullable: true,
              maxLength: 1000,
              example: "Create the dashboard charts and summary cards.",
            },
            assignedToId: {
              type: "integer",
              nullable: true,
              example: 3,
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
              example: "IN_PROGRESS",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-07-28T17:00:00.000Z",
            },
          },
        },
        UpdateTaskStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
              example: "DONE",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Jane Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"],
              example: "TEAM_MEMBER",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            title: {
              type: "string",
              example: "Build dashboard UI",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Create the first version of the project dashboard.",
            },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
              example: "IN_PROGRESS",
            },
            dueDate: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            projectId: {
              type: "integer",
              example: 1,
            },
            assignedToId: {
              type: "integer",
              nullable: true,
              example: 3,
            },
            createdById: {
              type: "integer",
              example: 1,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
            project: {
              type: "object",
              properties: {
                id: {
                  type: "integer",
                  example: 1,
                },
                name: {
                  type: "string",
                  example: "Website Redesign",
                },
                status: {
                  type: "string",
                  example: "ACTIVE",
                },
                createdById: {
                  type: "integer",
                  example: 1,
                },
              },
            },
            assignedTo: {
              nullable: true,
              allOf: [{ $ref: "#/components/schemas/User" }],
            },
            createdBy: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        ProjectMember: {
          type: "object",
          properties: {
            membershipId: {
              type: "integer",
              example: 1,
            },
            joinedAt: {
              type: "string",
              format: "date-time",
            },
            id: {
              type: "integer",
              example: 3,
            },
            name: {
              type: "string",
              example: "Sam Taylor",
            },
            email: {
              type: "string",
              format: "email",
              example: "sam@example.com",
            },
            role: {
              type: "string",
              enum: ["PROJECT_MANAGER", "TEAM_MEMBER"],
              example: "TEAM_MEMBER",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "Website Redesign",
            },
            description: {
              type: "string",
              nullable: true,
              example: "Refresh the marketing website.",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"],
              example: "ACTIVE",
            },
            startDate: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            endDate: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdById: {
              type: "integer",
              example: 1,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
            createdBy: {
              $ref: "#/components/schemas/User",
            },
            members: {
              type: "array",
              items: {
                type: "object",
              },
            },
            _count: {
              type: "object",
              properties: {
                members: {
                  type: "integer",
                  example: 2,
                },
                tasks: {
                  type: "integer",
                  example: 5,
                },
              },
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Login successful.",
            },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Validation failed.",
            },
          },
        },
      },
    },
  },
  apis: [routeFiles],
});

export { apiPrefix };
