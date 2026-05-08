import { pgTable, serial, text, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  governorate: text("governorate").notNull(),
  city: text("city").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 10, scale: 3 }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 3 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 3 }).notNull(),
  items: jsonb("items").notNull().$type<Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>>(),
  notes: text("notes"),
  flouciPaymentId: text("flouci_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
