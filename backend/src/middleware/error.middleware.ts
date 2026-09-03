import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

export const onError = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  res.status(500).json({
    success: false,
    message: error.message || "Unexpected server error",
  });
};
