import { Request } from "express";
import type { UserRole } from "./domain.js";

export type AuthPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthRequest = Request & {
  user?: AuthPayload;
};
