import { Router, Response } from "express";
import { prisma } from "../prisma.js";
import { authenticateToken, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

// POST /api/reviews - Add review
router.post("/", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { motorcycleId, rating, comment } = req.body;

    if (!motorcycleId || rating === undefined) {
      res.status(400).json({ error: "Motorcycle ID and rating are required" });
      return;
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
      return;
    }

    // Check if motorcycle exists
    const motorcycle = await prisma.motorcycle.findUnique({
      where: { id: parseInt(motorcycleId, 10) },
    });

    if (!motorcycle) {
      res.status(404).json({ error: "Motorcycle not found" });
      return;
    }

    // Optional constraint: check if the user has a reservation for this motorcycle (approved or completed)
    // To keep it simple but flexible, we allow any logged-in user to review.

    const review = await prisma.review.create({
      data: {
        userId,
        motorcycleId: motorcycle.id,
        rating: ratingVal,
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error: any) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
