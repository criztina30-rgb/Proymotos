import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import OpenAI from "openai";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GET /api/chat/motorcycles-context
 * Returns all motorcycles as context (helper, not required for bot usage)
 */
router.get("/motorcycles-context", async (_req: Request, res: Response): Promise<void> => {
  try {
    const motorcycles = await prisma.motorcycle.findMany({
      include: {
        reviews: {
          select: {
            rating: true,
            comment: true,
          },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { brand: "asc" },
    });
    res.json(motorcycles);
  } catch (error) {
    console.error("Error fetching context:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/chat
 * Body: { message: string, history?: { role: "user"|"assistant", content: string }[] }
 * Returns: { reply: string }
 *
 * The bot has full knowledge of all motorcycles in the DB.
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      res.status(400).json({ error: "El campo 'message' es requerido y no puede estar vacío." });
      return;
    }

    // ── Fetch all motorcycles from DB ──────────────────────────────────────
    const motorcycles = await prisma.motorcycle.findMany({
      include: {
        reviews: {
          select: {
            rating: true,
            comment: true,
          },
        },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { brand: "asc" },
    });

    // Build a human-readable catalogue for the system prompt
    const catalogue = motorcycles
      .map((m) => {
        const avgRating =
          m.reviews.length > 0
            ? (m.reviews.reduce((sum, r) => sum + r.rating, 0) / m.reviews.length).toFixed(1)
            : "Sin calificaciones";

        const reviewSummary =
          m.reviews.length > 0
            ? m.reviews
                .slice(0, 3)
                .map((r) => `"${r.comment || "Sin comentario"}" (${r.rating}⭐)`)
                .join(" | ")
            : "Sin reseñas aún";

        return [
          `• [ID ${m.id}] ${m.brand} ${m.model} (${m.year})`,
          `  Precio: $${m.price}/día | Motor: ${m.engineCapacity}cc`,
          `  Disponible: ${m.available ? "Sí ✅" : "No ❌"}`,
          `  Reservas: ${m._count.bookings} | Reseñas: ${m._count.reviews} | Rating promedio: ${avgRating}`,
          `  Descripción: ${m.description ?? "N/A"}`,
          `  Reseñas destacadas: ${reviewSummary}`,
        ].join("\n");
      })
      .join("\n\n");

    const systemPrompt = `Eres MotoBot 🏍️, un asistente experto en motocicletas para la plataforma de renta de motos "ProyMotos".
Tienes acceso en tiempo real al catálogo completo de motos registradas en la base de datos.

CATÁLOGO ACTUAL (${motorcycles.length} motos):
${catalogue}

INSTRUCCIONES:
- Responde SIEMPRE en español, de forma amable y profesional.
- Usa los datos del catálogo para recomendar motos, comparar modelos, explicar precios, disponibilidad, etc.
- Si el usuario pregunta por una moto específica, da todos los detalles disponibles.
- Si no encuentras información en el catálogo, dilo con honestidad.
- Puedes hacer comparaciones entre motos cuando el usuario lo pida.
- Usa emojis con moderación para hacer la conversación más dinámica.
- Nunca inventes datos que no estén en el catálogo.`;

    // Build messages array for OpenAI (multi-turn support)
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      // Inject conversation history (max last 10 turns to avoid token overflow)
      ...history.slice(-10).map((h: { role: "user" | "assistant"; content: string }) => ({
        role: h.role,
        content: h.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // ── Call OpenAI gpt-4.1-nano ──────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "Lo siento, no pude generar una respuesta. Intenta de nuevo.";

    res.json({
      reply,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("Chat error:", error);

    if (error?.status === 401) {
      res.status(500).json({ error: "API Key de OpenAI inválida o expirada." });
      return;
    }
    if (error?.status === 429) {
      res.status(429).json({ error: "Límite de solicitudes de OpenAI alcanzado. Intenta en unos momentos." });
      return;
    }

    res.status(500).json({ error: "Error interno del servidor al procesar el chat." });
  }
});

export default router;
