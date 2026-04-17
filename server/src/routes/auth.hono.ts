import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail, getUserById, updateUser } from "../storage";
import { authenticate, generateToken, type AuthVariables } from "../middleware/auth.hono";
import type { InsertUser } from "@deenyai/shared";

const app = new Hono<{ Variables: AuthVariables }>();

// Register
app.post("/register", async (c) => {
  try {
    const { email, password, firstName, lastName } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ email, passwordHash, firstName, lastName });

    const token = generateToken(user.id, user.isAdmin);
    const { passwordHash: _, ...userPublic } = user;
    return c.json({ token, user: userPublic }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Login
app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const token = generateToken(user.id, user.isAdmin);
    const { passwordHash: _, ...userPublic } = user;
    return c.json({ token, user: userPublic });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get current user
app.get("/me", authenticate, async (c) => {
  try {
    const user = await getUserById(c.get("userId"));
    if (!user) return c.json({ error: "User not found" }, 404);

    const { passwordHash: _, ...userPublic } = user;
    return c.json(userPublic);
  } catch (error) {
    console.error("Get me error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update profile (onboarding + settings)
app.patch("/me", authenticate, async (c) => {
  try {
    const { firstName, lastName, country, madhab } = await c.req.json();
    const userId = c.get("userId");

    const updates: Partial<InsertUser> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (country !== undefined) updates.country = country;
    if (madhab !== undefined) updates.madhab = madhab;

    const currentUser = await getUserById(userId);
    const finalCountry = country ?? currentUser?.country;
    const finalMadhab = madhab ?? currentUser?.madhab;
    if (finalCountry && finalMadhab) {
      updates.onboardingComplete = true;
    }

    const user = await updateUser(userId, updates);
    const { passwordHash: _, ...userPublic } = user;
    return c.json(userPublic);
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
