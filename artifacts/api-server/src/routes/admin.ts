import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, desc, count, sum, inArray } from "drizzle-orm";
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

router.get("/admin/products", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        slug: productsTable.slug,
        description: productsTable.description,
        price: productsTable.price,
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

    res.json(
      rows.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? null,
        price: Number(p.price),
        imageUrl: p.imageUrl ?? null,
        categoryId: p.categoryId ?? null,
        categoryName: p.categoryName ?? null,
        stock: p.stock,
        sku: p.sku ?? null,
        featured: p.featured,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Admin products error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

const UpdateProductBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  categoryId: z.number().int().optional().nullable(),
});

router.put("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const update: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.description !== undefined) update.description = parsed.data.description;
    if (parsed.data.price !== undefined) update.price = parsed.data.price.toFixed(3);
    if (parsed.data.imageUrl !== undefined) update.imageUrl = parsed.data.imageUrl;
    if (parsed.data.stock !== undefined) update.stock = parsed.data.stock;
    if (parsed.data.sku !== undefined) update.sku = parsed.data.sku;
    if (parsed.data.featured !== undefined) update.featured = parsed.data.featured;
    if (parsed.data.categoryId !== undefined) update.categoryId = parsed.data.categoryId;

    const [product] = await db
      .update(productsTable)
      .set(update)
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }
    res.json({ id: product.id, stock: product.stock, name: product.name, sku: product.sku });
  } catch (err) {
    req.log.error({ err }, "Admin update product error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

const CreateProductBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  categoryId: z.number().int().optional().nullable(),
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [product] = await db
      .insert(productsTable)
      .values({
        ...parsed.data,
        price: parsed.data.price.toFixed(3),
      })
      .returning();
    res.status(201).json({ id: product.id, name: product.name });
  } catch (err) {
    req.log.error({ err }, "Admin create product error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }
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
  if (isNaN(id)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: parsed.data.status })
      .where(eq(ordersTable.id, id))
      .returning({ id: ordersTable.id, status: ordersTable.status });
    if (!order) {
      res.status(404).json({ error: "Commande introuvable" });
      return;
    }
    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Admin update order status error");
    res.status(500).json({ error: "Erreur interne" });
  }
});

export default router;
