import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and, desc, count } from "drizzle-orm";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  GetFeaturedProductsResponse,
  GetProductStatsResponse,
  GetProductParams,
  GetProductResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: {
  id: number; name: string; slug: string; description: string | null;
  price: string; discountPrice: string | null; isOnSale: boolean;
  imageUrl: string | null; categoryId: number | null; categoryName?: string | null;
  stock: number; sku?: string | null; featured: boolean; createdAt: Date;
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

router.get("/products/featured", async (req, res): Promise<void> => {
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
      .where(eq(productsTable.featured, true))
      .orderBy(desc(productsTable.createdAt))
      .limit(8);

    res.json(GetFeaturedProductsResponse.parse(rows.map(formatProduct)));
  } catch (err) {
    req.log.error({ err }, "Error fetching featured products");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

router.get("/products/stats", async (req, res): Promise<void> => {
  try {
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
  } catch (err) {
    req.log.error({ err }, "Error fetching product stats");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [row] = await db
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
      .where(eq(productsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Produit introuvable" });
      return;
    }

    res.json(GetProductResponse.parse(formatProduct(row)));
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
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
  } catch (err) {
    req.log.error({ err }, "Error fetching products");
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

export default router;
