import { Router, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";
import { authenticateToken, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-motorcycle-key-2026";
const TOKEN_EXPIRY = "7d";

// POST /register
router.post("/register", async (req: any, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: "Email is already registered" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set role (default to USER, only allow ADMIN if specified and valid or first user)
    // For demo purposes, we will allow setting the role if passed, but default to USER.
    const userRole = role === "ADMIN" ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /login
router.post("/login", async (req: any, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /me
router.get("/me", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
