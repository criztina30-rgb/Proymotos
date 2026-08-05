import { Router, Response } from "express";
import { prisma } from "../prisma.js";
import { authenticateToken, AuthenticatedRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/bookings - List bookings (Admins see all, Users see their own)
router.get("/", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { status } = req.query;

    const where: any = {};

    // Filter by ownership
    if (role !== "ADMIN") {
      where.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as any;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        motorcycle: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bookings/:id - Single booking details
router.get("/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid booking ID" });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        motorcycle: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    // Access control: only owner or admin
    if (req.user!.role !== "ADMIN" && booking.userId !== req.user!.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json(booking);
  } catch (error: any) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/bookings - Create a booking
router.post("/", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { motorcycleId, startDate, endDate } = req.body;

    if (!motorcycleId || !startDate || !endDate) {
      res.status(400).json({ error: "Motorcycle ID, start date, and end date are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    if (start >= end) {
      res.status(400).json({ error: "Start date must be before end date" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      res.status(400).json({ error: "Start date cannot be in the past" });
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

    if (!motorcycle.available) {
      res.status(400).json({ error: "Motorcycle is currently not available for rent" });
      return;
    }

    // Check for date overlaps with already approved/pending bookings
    const overlap = await prisma.booking.findFirst({
      where: {
        motorcycleId: motorcycle.id,
        status: { in: ["PENDING", "APPROVED"] },
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
    });

    if (overlap) {
      res.status(400).json({
        error: "Motorcycle is already booked for the selected dates",
      });
      return;
    }

    // Calculate total price based on days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = Number(motorcycle.price) * diffDays;

    const booking = await prisma.booking.create({
      data: {
        userId,
        motorcycleId: motorcycle.id,
        startDate: start,
        endDate: end,
        totalPrice,
        status: "PENDING",
      },
      include: {
        motorcycle: true,
      },
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put("/:id/status", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid booking ID" });
      return;
    }

    const { status } = req.body;

    if (!status || !["PENDING", "APPROVED", "CANCELLED"].includes(status)) {
      res.status(400).json({ error: "Invalid status value (PENDING, APPROVED, CANCELLED)" });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Authorization:
    // - Users can cancel their own booking.
    // - Admins can change status to anything (including approving).
    if (userRole !== "ADMIN") {
      if (booking.userId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (status !== "CANCELLED") {
        res.status(403).json({ error: "Users can only cancel their own bookings" });
        return;
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status as any },
      include: { motorcycle: true },
    });

    res.json({
      message: `Booking status updated to ${status}`,
      booking: updated,
    });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete("/:id", authenticateToken as any, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid booking ID" });
      return;
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    // Access control: only owner or admin
    if (req.user!.role !== "ADMIN" && booking.userId !== req.user!.id) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await prisma.booking.delete({ where: { id } });

    res.json({ message: "Booking deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
