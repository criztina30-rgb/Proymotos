import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.js";
const router = Router();
// GET /api/motorcycles - List with filters
router.get("/", async (req, res) => {
    try {
        const { brand, year, available, minPrice, maxPrice, search } = req.query;
        const where = {};
        if (brand) {
            where.brand = { contains: brand, mode: "insensitive" };
        }
        if (year) {
            const yearNum = parseInt(year, 10);
            if (!isNaN(yearNum)) {
                where.year = yearNum;
            }
        }
        if (available !== undefined) {
            where.available = available === "true";
        }
        // Price filtering
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) {
                const min = parseFloat(minPrice);
                if (!isNaN(min))
                    where.price.gte = min;
            }
            if (maxPrice) {
                const max = parseFloat(maxPrice);
                if (!isNaN(max))
                    where.price.lte = max;
            }
        }
        // Search query across fields
        if (search) {
            where.OR = [
                { brand: { contains: search, mode: "insensitive" } },
                { model: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        const motorcycles = await prisma.motorcycle.findMany({
            where,
            include: {
                _count: {
                    select: { reviews: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(motorcycles);
    }
    catch (error) {
        console.error("Error fetching motorcycles:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// GET /api/motorcycles/:id - Details by ID
router.get("/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid motorcycle ID" });
            return;
        }
        const motorcycle = await prisma.motorcycle.findUnique({
            where: { id },
            include: {
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!motorcycle) {
            res.status(404).json({ error: "Motorcycle not found" });
            return;
        }
        res.json(motorcycle);
    }
    catch (error) {
        console.error("Error fetching motorcycle detail:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /api/motorcycles - Add (Admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { brand, model, year, price, engineCapacity, imageUrl, description, available } = req.body;
        if (!brand || !model || !year || !price || !engineCapacity) {
            res.status(400).json({ error: "Brand, model, year, price, and engine capacity are required" });
            return;
        }
        const motorcycle = await prisma.motorcycle.create({
            data: {
                brand,
                model,
                year: parseInt(year, 10),
                price: parseFloat(price),
                engineCapacity: parseInt(engineCapacity, 10),
                imageUrl,
                description,
                available: available !== undefined ? !!available : true,
            },
        });
        res.status(201).json({
            message: "Motorcycle added successfully",
            motorcycle,
        });
    }
    catch (error) {
        console.error("Error creating motorcycle:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PUT /api/motorcycles/:id - Edit (Admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid motorcycle ID" });
            return;
        }
        const { brand, model, year, price, engineCapacity, imageUrl, description, available } = req.body;
        const existing = await prisma.motorcycle.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Motorcycle not found" });
            return;
        }
        const updated = await prisma.motorcycle.update({
            where: { id },
            data: {
                brand: brand !== undefined ? brand : existing.brand,
                model: model !== undefined ? model : existing.model,
                year: year !== undefined ? parseInt(year, 10) : existing.year,
                price: price !== undefined ? parseFloat(price) : existing.price,
                engineCapacity: engineCapacity !== undefined ? parseInt(engineCapacity, 10) : existing.engineCapacity,
                imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
                description: description !== undefined ? description : existing.description,
                available: available !== undefined ? !!available : existing.available,
            },
        });
        res.json({
            message: "Motorcycle updated successfully",
            motorcycle: updated,
        });
    }
    catch (error) {
        console.error("Error updating motorcycle:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// DELETE /api/motorcycles/:id - Delete (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            res.status(400).json({ error: "Invalid motorcycle ID" });
            return;
        }
        const existing = await prisma.motorcycle.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: "Motorcycle not found" });
            return;
        }
        await prisma.motorcycle.delete({ where: { id } });
        res.json({ message: "Motorcycle deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting motorcycle:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=motorcycles.js.map