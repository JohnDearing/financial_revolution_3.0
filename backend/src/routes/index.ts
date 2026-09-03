import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { memberRouter } from "../modules/member/member.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";

export const apiRouter = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
apiRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: { service: "financial-revolution-api", timestamp: new Date().toISOString() },
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/members", memberRouter);
apiRouter.use("/admin", adminRouter);
