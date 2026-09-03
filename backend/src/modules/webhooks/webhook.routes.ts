import { Router } from "express";
import { stripeWebhookController } from "./stripe.controller.js";
import { telegramWebhookController } from "./telegram.controller.js";

export const webhookRouter = Router();

webhookRouter.post("/stripe", stripeWebhookController);
webhookRouter.post("/telegram", telegramWebhookController);
