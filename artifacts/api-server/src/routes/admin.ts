import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, desc, count, sum, sql, and } from "drizzle-orm";
import { z } from "zod";
import { adminAuth } from "../middlewares/admin-auth";

const router: IRouter = Router();

/**
 * SECURITY: All routes under /admin require authentication.
 * Make sure your adminAuth middleware attaches 'user' to 'req'.
 */
router.use("/admin", adminAuth);

// ─── HELPER: Permission Guard ───────────────────────────────────────────────
// This prevents Staff from performing destructive actions.
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Permission refusée : Super Admin requis" });
  }
  next();
};

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (req: any, res): Promise<void> => {
  try {
    const [ordersCount] = await db.select({ count: count() }).from(ordersTable);
    const [revenueRow] = await db.select({ total: sum(ordersTable.total) }).from(ordersTable);
    const [pendingRow] = await db
      .select({ count: count() })
      .from(ordersTable)
      .where(eq(ordersTable.status, "pending"));
    const [productsCount] = await db.select({ count: count() }).from(productsTable);

    const recentOrders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);

    res.json({
      totalOrders: Number(ordersCount?.count ?? 0),
      totalRevenue: Number(revenueRow?.total ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
      totalProducts: Number(productsCount?.count ?? 0),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Create Product (Hardenened) ──────────────────────────────────────────────

const CreateProductBody = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().optional().nullable(),
  price: z.number().positive().finite(),
  discountPrice: z.number().positive().optional().nullable(),
  isOnSale: z.boolean().default(false),
  imageUrl: z.string().url().optional().nullable(), // Validates it's a real URL
  stock: z.number().int().min(0),
  sku: z.string().trim().toUpperCase().optional().nullable(),
  categoryId: z.number().int().optional().nullable(),
}).refine(
  (data) => !data.discountPrice || (data.discountPrice < data.price),
  { message: "Le prix de promo doit être inférieur au prix de base", path: ["discountPrice"] }
);

router.post("/admin/products", requireSuperAdmin, async (req: any, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  try {
    const d = parsed.data;
    // Stronger slug generation
    const slug = d.name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-") + "-" + Math.random().toString(36).substring(2, 7);

    const [product] = await db
      .insert(productsTable)
      .values({
        ...d,
        slug,
        price: d.price.toFixed(3),
        discountPrice: d.discountPrice?.toFixed(3) ?? null,
      })
      .returning();

    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Admin create product error");
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// ─── Update Product (Hardened) ───────────────────────────────────────────────

router.put("/admin/products/:id", requireSuperAdmin, async (req: any, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const parsed = CreateProductBody.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const d = parsed.data;
    const updateData: any = { ...d };
    
    // Convert numbers back to string decimals for Drizzle/DB compatibility
    if (d.price) updateData.price = d.price.toFixed(3);
    if (d.discountPrice) updateData.discountPrice = d.discountPrice.toFixed(3);

    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) { res.status(404).json({ error: "Produit non trouvé" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Admin update product error");
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

// ─── Stock Patch (Safe for Staff) ────────────────────────────────────────────

router.patch("/admin/products/:id/stock", async (req: any, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { delta } = req.body;
  
  if (isNaN(id) || typeof delta !== "number") {
    res.status(400).json({ error: "Données invalides" });
    return;
  }

  try {
    const [product] = await db
      .update(productsTable)
      .set({ 
        stock: sql`GREATEST(0, ${productsTable.stock} + ${delta})` 
      })
      .where(eq(productsTable.id, id))
      .returning();

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Erreur stock" });
  }
});

// ─── Delete Product (Super Admin Only) ────────────────────────────────────────

router.delete("/admin/products/:id", requireSuperAdmin, async (req: any, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  try {
    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();
    
    if (!deleted) return res.status(404).json({ error: "Introuvable" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

export default router;
