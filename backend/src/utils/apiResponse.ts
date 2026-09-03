import { Response } from "express";

export function sendOk<T>(res: Response, data: T, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export function sendMessage(res: Response, message: string, statusCode = 200) {
  res.status(statusCode).json({ success: true, message });
}
