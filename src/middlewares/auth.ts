import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-motorcycle-key-2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "USER" | "ADMIN";
  };
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token is required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  });
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Administrator permission required" });
    return;
  }
  next();
}
