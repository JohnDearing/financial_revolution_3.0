import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../config/index.js";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Financial Revolution 3.0 API",
      version: "1.0.0",
      description:
        "Auth, member, admin, and Stripe webhook APIs for Financial Revolution 3.0.",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: "Local development",
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
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            fullName: { type: "string" },
            role: { type: "string", enum: ["member", "admin"] },
            isEmailVerified: { type: "boolean" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
            user: { $ref: "#/components/schemas/PublicUser" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication and account recovery" },
      { name: "Members", description: "Member portal endpoints" },
      { name: "Admin", description: "Admin operations" },
      { name: "Health", description: "Service health" },
    ],
  },
  apis: [
    "./src/modules/**/*.ts",
    "./src/routes/**/*.ts",
    "./dist/modules/**/*.js",
    "./dist/routes/**/*.js",
  ],
});
