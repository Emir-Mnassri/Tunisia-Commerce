import { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Admin non configuré — définissez ADMIN_SECRET" });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || auth.slice(7) !== secret) {
    res.status(401).json({ error: "Non autorisé" });
    return;
  }
  next();
}
