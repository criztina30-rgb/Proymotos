import { Router, Response } from "express";
import { prisma } from "../prisma.js";
import { authenticateToken, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/favorites - Get user's favorites
router.get("/", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        motorcycle: true
      },
      orderBy: { createdAt: "desc" }
    });
    
    // Return just the motorcycles for easier frontend consumption
    res.json(favorites.map(f => f.motorcycle));
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites - Add favorite
router.post("/", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { motorcycleId } = req.body;

    if (!motorcycleId) {
      res.status(400).json({ error: "Motorcycle ID is required" });
      return;
    }

    const motoId = parseInt(motorcycleId, 10);
    if (isNaN(motoId)) {
      res.status(400).json({ error: "Invalid motorcycle ID" });
      return;
    }

    // Check if motorcycle exists
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id: motoId }
    });

    if (!motorcycle) {
      res.status(404).json({ error: "Motorcycle not found" });
      return;
    }

    // Check if already favorite
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_motorcycleId: {
          userId,
          motorcycleId: motoId
        }
      }
    });

    if (existing) {
      res.json({ message: "Already in favorites", favorite: existing });
      return;
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        motorcycleId: motoId
      }
    });

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error: any) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/favorites/:motorcycleId - Remove favorite
router.delete("/:motorcycleId", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const motorcycleId = parseInt(req.params.motorcycleId, 10);

    if (isNaN(motorcycleId)) {
      res.status(400).json({ error: "Invalid motorcycle ID" });
      return;
    }

    // Try deleting
    try {
      await prisma.favorite.delete({
        where: {
          userId_motorcycleId: {
            userId,
            motorcycleId
          }
        }
      });
      res.json({ message: "Removed from favorites" });
    } catch (e: any) {
      // Record to delete does not exist
      if (e.code === 'P2025') {
         res.status(404).json({ error: "Favorite not found" });
         return;
      }
      throw e;
    }
  } catch (error: any) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
