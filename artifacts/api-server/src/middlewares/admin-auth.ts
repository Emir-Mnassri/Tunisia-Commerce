import { Request, Response, NextFunction } from "express";

export type UserRole = "SUPER_ADMIN" | "STAFF";

export interface AuthenticatedRequest extends Request {
  user?: {
    role: UserRole;
  };
}

export function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const adminSecret = process.env.ADMIN_SECRET;
  const staffSecret = process.env.STAFF_SECRET;

  if (!adminSecret || !staffSecret) {
    res
      .status(503)
      .json({
        error:
          "Admin non configuré — définissez ADMIN_SECRET et STAFF_SECRET",
      });
    return;
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }

  const token = auth.slice(7);
  if (token === adminSecret) {
    req.user = { role: "SUPER_ADMIN" };
    next();
  } else if (token === staffSecret) {
    req.user = { role: "STAFF" };
    next();
  } else {
    res.status(401).json({ error: "Non autorisé" });
  }
}
