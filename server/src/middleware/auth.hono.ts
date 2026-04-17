import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

export type AuthVariables = {
  userId: string;
  isAdmin: boolean;
};

export const authenticate = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      return c.json({ error: "Missing authorization token" }, 401);
    }

    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        isAdmin: boolean;
      };
      c.set("userId", payload.userId);
      c.set("isAdmin", payload.isAdmin);
      await next();
    } catch {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
  }
);

export const requireAdmin = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    if (!c.get("isAdmin")) {
      return c.json({ error: "Admin access required" }, 403);
    }
    await next();
  }
);

export function generateToken(userId: string, isAdmin: boolean): string {
  return jwt.sign({ userId, isAdmin }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}
