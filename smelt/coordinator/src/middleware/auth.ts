import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Bearer token" });
    return;
  }

  const token = auth.slice(7);
  const { data, error } = await supabase
    .from("auth_tokens")
    .select("miner, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (new Date(data.expires_at) < new Date()) {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  (req as any).miner = data.miner;
  next();
}
