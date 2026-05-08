import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, desc, count, sql } from "drizzle-orm";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  GetFeaturedProductsResponse,
  GetProductStatsResponse,
  GetProductParams,
  GetProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect & { categoryName?: string | null }) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: Number(p.price),
    imageUrl: p.imageUrl ?? null,
    categoryId: p.categoryId ?? null,
    categoryName: p.categoryName ?? null,
    stock: p.stock,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products/featured", async (req, res): Promise<void> => {
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
      featured: productsTable.featured,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.featured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  res.json(GetFeaturedProductsResponse.parse(rows.map(formatProduct)));
});

router.get("/products/stats", async (req, res): Promise<void> => {
  const [totalRow] = await db.select({ count: count() }).from(productsTable);
  const [catRow] = await db.select({ count: count() }).from(categoriesTable);
  const [featuredRow] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(eq(productsTable.featured, true));

  const byCategory = await db
    .select({
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      count: count(),
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .groupBy(productsTable.categoryId, categoriesTable.name);

  res.json(
    GetProductStatsResponse.parse({
      totalProducts: Number(totalRow?.count ?? 0),
      totalCategories: Number(catRow?.count ?? 0),
      featuredCount: Number(featuredRow?.count ?? 0),
      byCategory: byCategory
        .filter((r) => r.categoryId != null)
        .map((r) => ({
          categoryId: r.categoryId!,
          categoryName: r.categoryName ?? "Sans catégorie",
          count: Number(r.count),
        })),
    }),
  );
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
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
      featured: productsTable.featured,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  res.json(GetProductResponse.parse(formatProduct(row)));
});

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { categoryId, search, featured, page = 1, limit = 12 } = query.data;
  const pageNum = Math.max(1, page ?? 1);
  const limitNum = Math.min(50, Math.max(1, limit ?? 12));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (featured === "true") conditions.push(eq(productsTable.featured, true));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await db
    .select({ count: count() })
    .from(productsTable)
    .where(whereClause);

  const total = Number(totalRow?.count ?? 0);

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
      featured: productsTable.featured,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(whereClause)
    .orderBy(desc(productsTable.featured), desc(productsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  res.json(
    ListProductsResponse.parse({
      products: rows.map(formatProduct),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }),
  );
});

export default router;
