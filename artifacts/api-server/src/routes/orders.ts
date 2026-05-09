import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams, GetOrderResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const SHIPPING_FEE_COD = 7;

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
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
    items: o.items as Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>,
    notes: o.notes ?? null,
    flouciPaymentId: o.flouciPaymentId ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid order body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, email, phone, address, governorate, city, paymentMethod, items, notes } =
    parsed.data;

  try {
    // ── Security: fetch product prices & stock from DB (never trust client prices) ──
    const productIds = items.map((item) => item.productId);
    const dbProducts = await db
      .select()
      .from(productsTable)
      .where(inArray(productsTable.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validate stock for every item
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ error: `Produit ID ${item.productId} introuvable` });
        return;
      }
      if (product.stock < item.quantity) {
        res
          .status(400)
          .json({
            error: `Stock insuffisant pour "${product.name}" (disponible: ${product.stock})`,
          });
        return;
      }
    }

    // Compute prices server-side
    const serverItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const totalPrice = parseFloat((unitPrice * item.quantity).toFixed(3));
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const subtotal = serverItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingFee = paymentMethod === "cash_on_delivery" ? SHIPPING_FEE_COD : 0;
    const total = subtotal + shippingFee;

    const [order] = await db
      .insert(ordersTable)
      .values({
        customerName,
        email,
        phone,
        address,
        governorate,
        city,
        paymentMethod,
        status: "pending",
        subtotal: subtotal.toFixed(3),
        shippingFee: shippingFee.toFixed(3),
        total: total.toFixed(3),
        items: serverItems,
        notes: notes ?? null,
      })
      .returning();

    if (!order) {
      res.status(500).json({ error: "Erreur lors de la création de la commande" });
      return;
    }

    // Decrement stock atomically per item
    for (const item of serverItems) {
      await db
        .update(productsTable)
        .set({ stock: sql`${productsTable.stock} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));
    }

    res.status(201).json(GetOrderResponse.parse(formatOrder(order)));
  } catch (err) {
    req.log.error({ err }, "Error creating order");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, params.data.id));

    if (!order) {
      res.status(404).json({ error: "Commande introuvable" });
      return;
    }

    res.json(GetOrderResponse.parse(formatOrder(order)));
  } catch (err) {
    req.log.error({ err }, "Error fetching order");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
