import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/index.js";
import { seedTestAccounts } from "./data/store.js";
import { swaggerSpec } from "./docs/swagger.js";
import { ensureDatabaseConnection } from "./lib/prisma.js";
import { notFound, onError } from "./middleware/error.middleware.js";
import { webhookRouter } from "./modules/webhooks/webhook.routes.js";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: [env.frontendUrl, "http://localhost:3000"].filter(
      (value, index, list) => Boolean(value) && list.indexOf(value) === index,
    ),
    credentials: true,
  }),
);

// Stripe webhooks need the raw body for signature verification.
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/webhooks/stripe")) {
    next();
    return;
  }
  express.json()(req, res, next);
});

app.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      project: "Financial Revolution 3.0",
      docs: "/api/docs",
      openapi: "/api/docs.json",
      endpoints: [
        "/api/health",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/refresh",
        "/api/auth/logout",
        "/api/auth/verify-email",
        "/api/auth/resend-verification",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/members/me",
        "/api/members/checkout-session",
        "/api/admin/members",
        "/api/webhooks/stripe",
      ],
    },
  });
});

app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Financial Revolution 3.0 API Docs",
  }),
);

app.use("/api", apiRouter);
app.use("/api/webhooks", webhookRouter);

app.use(notFound);
app.use(onError);

async function bootstrap() {
  // Neon free-tier can sleep; wake it before seeding / serving traffic.
  await ensureDatabaseConnection();
  await seedTestAccounts();
}

if (process.env.VERCEL !== "1") {
  void bootstrap()
    .then(() => {
      app.listen(env.port, () => {
        console.info(`Financial Revolution API running at http://localhost:${env.port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to bootstrap server:", error);
      process.exit(1);
    });
} else {
  void bootstrap();
}

export default app;
