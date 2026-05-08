import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
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
      items,
      notes: notes ?? null,
    })
    .returning();

  if (!order) {
    res.status(500).json({ error: "Erreur lors de la création de la commande" });
    return;
  }

  res.status(201).json(GetOrderResponse.parse(formatOrder(order)));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, params.data.id));

  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.json(GetOrderResponse.parse(formatOrder(order)));
});

export default router;
