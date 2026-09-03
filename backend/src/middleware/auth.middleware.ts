import { NextFunction, Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import type { UserRole } from "../types/domain.js";
import { verifyAccessToken } from "../modules/auth/auth.service.js";

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Missing bearer token" });
    return;
  }

  try {
    req.user = verifyAccessToken(authorization.replace("Bearer ", "").trim());
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
};
