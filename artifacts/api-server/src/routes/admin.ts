import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { z } from "zod";
import { adminAuth } from "../middlewares/admin-auth";

const router: IRouter = Router();

router.use("/admin", adminAuth);

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (req, res): Promise<void> => {
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
        id: o.id,
        customerName: o.customerName,
        email: o.email,
        governorate: o.governorate,
        paymentMethod: o.paymentMethod,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        items: o.items,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

router.get("/admin/orders", async (req, res): Promise<void> => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(100);

    res.json(
      orders.map((o) => ({
        id: o.id,
        customerName: o.customerName,
        email: o.email,
        phone: o.phone,
        address: o.address,
        governorate: o.governorate,
        city: o.city,
        paymentMethod: o.paymentMethod,
        status: o.status,
        subtotal: Number(o.subtotal),
        shippingFee: Number(o.shippingFee),
        total: Number(o.total),
        items: o.items,
        notes: o.notes ?? null,
        flouciPaymentId: o.flouciPaymentId ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin orders error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

function formatAdminProduct(p: {
  id: number; name: string; slug: string; description: string | null;
  price: string; discountPrice: string | null; isOnSale: boolean;
  imageUrl: string | null; categoryId: number | null; categoryName?: string | null;
  stock: number; sku: string | null; featured: boolean; createdAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: Number(p.price),
    discountPrice: p.discountPrice != null ? Number(p.discountPrice) : null,
    isOnSale: p.isOnSale,
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: p.categoryName ?? null,
    stock: p.stock,
    sku: p.sku ?? null,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/admin/products", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
        discountPrice: productsTable.discountPrice,
        isOnSale: productsTable.isOnSale,
        imageUrl: productsTable.imageUrl,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        stock: productsTable.stock,
        sku: productsTable.sku,
        featured: productsTable.featured,
        createdAt: productsTable.createdAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .orderBy(desc(productsTable.createdAt));

    res.json(rows.map(formatAdminProduct));
  } catch (err) {
    req.log.error({ err }, "Admin products error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Create product ───────────────────────────────────────────────────────────

const CreateProductBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  isOnSale: z.boolean().optional().default(false),
  imageUrl: z.string().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
  featured: z.boolean().optional().default(false),
  categoryId: z.number().int().optional().nullable(),
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const d = parsed.data;
    const slug = d.slug ?? d.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const [product] = await db
      .insert(productsTable)
      .values({
        name: d.name,
        slug,
        description: d.description ?? null,
        price: d.price.toFixed(3),
        discountPrice: d.discountPrice != null ? d.discountPrice.toFixed(3) : null,
        isOnSale: d.isOnSale ?? false,
        imageUrl: d.imageUrl ?? null,
        stock: d.stock ?? 0,
        sku: d.sku ?? null,
        featured: d.featured ?? false,
        categoryId: d.categoryId ?? null,
      })
      .returning();
    res.status(201).json(formatAdminProduct({ ...product, categoryName: null }));
  } catch (err) {
    req.log.error({ err }, "Admin create product error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Update product ───────────────────────────────────────────────────────────

const UpdateProductBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional().nullable(),
  isOnSale: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  categoryId: z.number().int().optional().nullable(),
});

router.put("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const d = parsed.data;
    const update: Record<string, unknown> = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.description !== undefined) update.description = d.description;
    if (d.price !== undefined) update.price = d.price.toFixed(3);
    if (d.discountPrice !== undefined) update.discountPrice = d.discountPrice != null ? d.discountPrice.toFixed(3) : null;
    if (d.isOnSale !== undefined) update.isOnSale = d.isOnSale;
    if (d.imageUrl !== undefined) update.imageUrl = d.imageUrl;
    if (d.stock !== undefined) update.stock = d.stock;
    if (d.sku !== undefined) update.sku = d.sku;
    if (d.featured !== undefined) update.featured = d.featured;
    if (d.categoryId !== undefined) update.categoryId = d.categoryId;

    const [product] = await db
      .update(productsTable)
      .set(update)
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) { res.status(404).json({ error: "Produit introuvable" }); return; }
    res.json(formatAdminProduct({ ...product, categoryName: null }));
  } catch (err) {
    req.log.error({ err }, "Admin update product error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Quick stock patch ────────────────────────────────────────────────────────

const StockPatchBody = z.object({
  delta: z.number().int(),
});

router.patch("/admin/products/:id/stock", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const parsed = StockPatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const [product] = await db
      .update(productsTable)
      .set({ stock: sql`GREATEST(0, ${productsTable.stock} + ${parsed.data.delta})` })
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id, stock: productsTable.stock });

    if (!product) { res.status(404).json({ error: "Produit introuvable" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Admin patch stock error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Delete product ───────────────────────────────────────────────────────────

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }
  try {
    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id });
    if (!deleted) { res.status(404).json({ error: "Produit introuvable" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Admin delete product error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

// ─── Order status update ───────────────────────────────────────────────────────

const UpdateOrderStatusBody = z.object({
  status: z.enum(["pending", "awaiting_payment", "paid", "shipped", "delivered", "cancelled"]),
});

router.put("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID invalide" }); return; }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: parsed.data.status })
      .where(eq(ordersTable.id, id))
      .returning({ id: ordersTable.id, status: ordersTable.status });
    if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Admin update order status error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
