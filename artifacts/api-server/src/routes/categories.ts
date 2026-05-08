import { Router, type IRouter } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { ListCategoriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  const countRows = await db
    .select({ categoryId: productsTable.categoryId, count: count() })
    .from(productsTable)
    .groupBy(productsTable.categoryId);

  const countMap = new Map(countRows.map((r) => [r.categoryId, Number(r.count)]));

  const result = categories.map((cat) => ({
    ...cat,
    description: cat.description ?? null,
    productCount: countMap.get(cat.id) ?? 0,
  }));

  res.json(ListCategoriesResponse.parse(result));
});

export default router;
