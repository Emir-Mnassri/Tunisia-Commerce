import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { InitiateFlouciBody, VerifyFlouciParams } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

const mockPaymentStore = new Map<string, { orderId: number; status: string; amount: number }>();

router.post("/payment/flouci/initiate", async (req, res): Promise<void> => {
  const parsed = InitiateFlouciBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, amount, successUrl } = parsed.data;

  try {
    const mockToken = process.env.FLOUCI_MOCK_TOKEN ?? "mock_token";
    const paymentId = `flouci_mock_${mockToken.slice(-8)}_${crypto.randomBytes(8).toString("hex")}`;

    mockPaymentStore.set(paymentId, { orderId, status: "pending", amount });

    await db
      .update(ordersTable)
      .set({ flouciPaymentId: paymentId, status: "awaiting_payment" })
      .where(eq(ordersTable.id, orderId));

    const redirectUrl = `${successUrl}?paymentId=${paymentId}&mock=1`;

    req.log.info({ paymentId, orderId }, "Flouci mock payment initiated");

    res.json({ paymentId, redirectUrl, status: "pending" });
  } catch (err) {
    req.log.error({ err }, "Error initiating Flouci payment");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

router.get("/payment/flouci/verify/:paymentId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.paymentId)
    ? req.params.paymentId[0]
    : req.params.paymentId;
  const params = VerifyFlouciParams.safeParse({ paymentId: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const entry = mockPaymentStore.get(params.data.paymentId);

    if (!entry) {
      res.json({ paymentId: params.data.paymentId, status: "success", orderId: null });
      return;
    }

    const confirmedStatus = "success";
    mockPaymentStore.set(params.data.paymentId, { ...entry, status: confirmedStatus });

    await db
      .update(ordersTable)
      .set({ status: "paid" })
      .where(eq(ordersTable.id, entry.orderId));

    res.json({
      paymentId: params.data.paymentId,
      status: confirmedStatus,
      orderId: entry.orderId,
    });
  } catch (err) {
    req.log.error({ err }, "Error verifying Flouci payment");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
