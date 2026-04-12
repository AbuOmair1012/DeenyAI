import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser, getUserByEmail, getUserById, updateUser } from "../storage";
import {
  authenticate,
  generateToken,
  AuthRequest,
} from "../middleware/auth";
import type { InsertUser } from "@deenyai/shared";

const router = Router();

// Register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const token = generateToken(user.id, user.isAdmin);
    const { passwordHash: _, ...userPublic } = user;

    res.status(201).json({ token, user: userPublic });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = generateToken(user.id, user.isAdmin);
    const { passwordHash: _, ...userPublic } = user;

    res.json({ token, user: userPublic });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { passwordHash: _, ...userPublic } = user;
    res.json(userPublic);
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile (onboarding + settings)
router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, country, madhab } = req.body;

    const updates: Partial<InsertUser> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (country !== undefined) updates.country = country;
    if (madhab !== undefined) updates.madhab = madhab;

    // Mark onboarding complete if user ends up with both country AND madhab
    // (check existing DB values so partial updates still trigger completion)
    const currentUser = await getUserById(req.userId!);
    const finalCountry = (country ?? currentUser?.country);
    const finalMadhab = (madhab ?? currentUser?.madhab);
    if (finalCountry && finalMadhab) {
      updates.onboardingComplete = true;
    }

    const user = await updateUser(req.userId!, updates);
    const { passwordHash: _, ...userPublic } = user;
    res.json(userPublic);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
