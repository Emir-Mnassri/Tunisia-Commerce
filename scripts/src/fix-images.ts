import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { productsTable } from "@workspace/db/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const fixes: { id: number; name: string; imageUrl: string }[] = [
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80",
  },
  {
    id: 3,
    name: "MacBook Air M3",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
  },
  {
    id: 11,
    name: "Parfum Jasmin Tunisien",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
  },
];

for (const fix of fixes) {
  const [row] = await db
    .update(productsTable)
    .set({ imageUrl: fix.imageUrl })
    .where(eq(productsTable.id, fix.id))
    .returning({ id: productsTable.id, name: productsTable.name });

  if (row) {
    console.log(`✓ Fixed image for: ${row.name}`);
  } else {
    console.log(`⚠ Product id=${fix.id} (${fix.name}) not found — skipping`);
  }
}

await pool.end();
console.log("Image fix complete.");
