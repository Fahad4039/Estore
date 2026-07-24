import { randomBytes } from "node:crypto";
import { Router, type IRouter, type RequestHandler } from "express";
import { z } from "zod";
import { execute, query, queryOne } from "../db/postgres";
import {
  requireAdmin,
  requireSeller,
  type AuthUser,
} from "../middlewares/auth";

const router: IRouter = Router();

const sortValues = ["price_asc", "price_desc", "newest", "popular", "rating"] as const;
const productStatusValues = ["active", "inactive", "pending"] as const;

const productFields = {
  name: z.string().trim().min(1).max(240),
  brand: z.string().trim().max(120).default(""),
  category: z.string().trim().min(1).max(120).default("General"),
  price: z.number().finite().nonnegative(),
  originalPrice: z.number().finite().nonnegative().optional(),
  discount: z.number().int().min(0).max(100).default(0),
  rating: z.number().finite().min(0).max(5).default(0),
  reviewCount: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  description: z.string().max(10000).default(""),
  images: z.array(z.string().max(2000)).default([]),
  tags: z.array(z.string().max(120)).default([]),
  specifications: z.record(z.unknown()).default({}),
  specs: z.record(z.unknown()).optional(),
  colors: z.array(z.string().max(120)).default([]),
  sizes: z.array(z.string().max(120)).default([]),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFlashSale: z.boolean().default(false),
  flashSalePrice: z.number().finite().nonnegative().nullable().optional(),
  isNew: z.boolean().default(false),
  deliveryDays: z.number().int().positive().max(365).default(3),
};

const createProductSchema = z.object(productFields);
const updateProductSchema = z.object({
  ...productFields,
  originalPrice: z.number().finite().nonnegative().optional(),
  specs: z.record(z.unknown()).optional(),
  flashSalePrice: z.number().finite().nonnegative().nullable().optional(),
  sellerId: z.string().trim().min(1).nullable().optional(),
  sellerName: z.string().trim().max(240).nullable().optional(),
}).partial();

const listQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  rating: z.coerce.number().finite().min(0).max(5).optional(),
  sort: z.enum(sortValues).default("newest"),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  featured: z.enum(["1", "true"]).optional(),
  trending: z.enum(["1", "true"]).optional(),
  flashSale: z.enum(["1", "true"]).optional(),
  isNew: z.enum(["1", "true"]).optional(),
  bestSeller: z.enum(["1", "true"]).optional(),
  seller: z.string().trim().min(1).optional(),
});

const statusSchema = z.object({
  status: z.enum(productStatusValues),
});

const flashSaleSchema = z.object({
  enabled: z.boolean(),
  flash_sale_price: z.number().finite().nonnegative().nullable().optional(),
}).superRefine((value, context) => {
  if (value.enabled && value.flash_sale_price === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["flash_sale_price"],
      message: "flash_sale_price is required when flash sale is enabled",
    });
  }
});

function validationError(res: any, error: z.ZodError) {
  return res.status(400).json({
    error: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", "),
  });
}

function dbValue(value: unknown, fallback: unknown) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function dbRow(row: any) {
  const specs = dbValue(row.specs, {});
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    discount: Number(row.discount ?? 0),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    stock: Number(row.stock ?? 0),
    description: row.description || "",
    images: dbValue(row.images, []),
    tags: dbValue(row.tags, []),
    specifications: specs,
    specs,
    colors: dbValue(row.colors, []),
    sizes: dbValue(row.sizes, []),
    isFeatured: Boolean(row.is_featured),
    isTrending: Boolean(row.is_trending),
    isBestSeller: Boolean(row.is_best_seller),
    isFlashSale: Boolean(row.is_flash_sale),
    isNew: Boolean(row.is_new),
    flashSalePrice: row.flash_sale_price === null || row.flash_sale_price === undefined
      ? null
      : Number(row.flash_sale_price),
    sellerId: row.seller_id || null,
    sellerName: row.seller_name || null,
    deliveryDays: Number(row.delivery_days ?? 3),
    status: row.status || "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sellerFromRow(row: any) {
  if (!row.seller_info_id && !row.seller_id) return null;
  return {
    id: row.seller_info_id || row.seller_id,
    name: row.seller_info_name || row.seller_name || null,
    email: row.seller_info_email || null,
    avatar: row.seller_info_avatar || null,
    bio: row.seller_info_bio || null,
  };
}

function sellerOrAdmin(): RequestHandler {
  return (req, res, next) => {
    if (req.user?.role === "admin") return requireAdmin(req, res, next);
    return requireSeller(req, res, next);
  };
}

function isAdmin(user: AuthUser | undefined) {
  return user?.role === "admin";
}

function sendDatabaseError(res: any, error: unknown) {
  console.error("Products API error", error);
  return res.status(500).json({ error: "Unable to process product request" });
}

function flagCondition(queryValue: string | undefined, column: string) {
  return queryValue ? `${column}=TRUE` : null;
}

function sortExpression(sort: (typeof sortValues)[number]) {
  switch (sort) {
    case "price_asc": return "p.price ASC, p.created_at DESC";
    case "price_desc": return "p.price DESC, p.created_at DESC";
    case "popular": return "p.review_count DESC, p.rating DESC, p.created_at DESC";
    case "rating": return "p.rating DESC, p.review_count DESC, p.created_at DESC";
    default: return "p.created_at DESC";
  }
}

function selectColumns(prefix = "p") {
  return `${prefix}.*`;
}

// Keep the more specific paths before /products/:id.
router.get("/products/featured", async (_req, res) => {
  try {
    const [featured, trending, flashSale, newArrivals, bestSellers] = await Promise.all([
      query(`SELECT ${selectColumns()} FROM products p WHERE p.status='active' AND p.is_featured=TRUE ORDER BY p.created_at DESC LIMIT 12`),
      query(`SELECT ${selectColumns()} FROM products p WHERE p.status='active' AND p.is_trending=TRUE ORDER BY p.review_count DESC, p.created_at DESC LIMIT 12`),
      query(`SELECT ${selectColumns()} FROM products p WHERE p.status='active' AND p.is_flash_sale=TRUE ORDER BY p.flash_sale_price NULLS LAST, p.created_at DESC LIMIT 12`),
      query(`SELECT ${selectColumns()} FROM products p WHERE p.status='active' AND p.is_new=TRUE ORDER BY p.created_at DESC LIMIT 12`),
      query(`SELECT ${selectColumns()} FROM products p WHERE p.status='active' AND p.is_best_seller=TRUE ORDER BY p.review_count DESC, p.rating DESC LIMIT 12`),
    ]);
    return res.json({
      featured: featured.map(dbRow),
      trending: trending.map(dbRow),
      flashSale: flashSale.map(dbRow),
      newArrivals: newArrivals.map(dbRow),
      bestSellers: bestSellers.map(dbRow),
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

router.get("/products/by-ids", async (req, res) => {
  const rawIds = req.query.ids;
  if (typeof rawIds !== "string") return res.status(400).json({ error: "ids is required" });
  const ids = rawIds.split(",").map((id) => id.trim()).filter(Boolean);
  if (!ids.length) return res.json({ products: [] });
  if (ids.length > 100) return res.status(400).json({ error: "A maximum of 100 ids is allowed" });

  try {
    const rows = await query<any>(
      `SELECT ${selectColumns()} FROM products p
       WHERE p.status='active' AND p.id=ANY($1::text[])`,
      [ids],
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    return res.json({ products: ids.flatMap((id) => {
      const row = byId.get(id);
      return row ? [dbRow(row)] : [];
    }) });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// GET /api/products
router.get("/products", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return validationError(res, parsed.error);
  const filters = parsed.data;

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    return res.status(400).json({ error: "minPrice cannot be greater than maxPrice" });
  }

  const conditions = ["p.status='active'"];
  const params: unknown[] = [];
  let parameter = 1;
  const add = (condition: string, value?: unknown) => {
    if (value !== undefined) {
      conditions.push(condition.replace("?", `$${parameter++}`));
      params.push(value);
    }
  };

  add("p.category=$?", filters.category);
  add("p.brand=$?", filters.brand);
  add("p.price >= $?", filters.minPrice);
  add("p.price <= $?", filters.maxPrice);
  add("p.rating >= $?", filters.rating);
  add("p.seller_id=$?", filters.seller);
  if (filters.search) {
    const search = `%${filters.search}%`;
    conditions.push(`(p.name ILIKE $${parameter} OR p.brand ILIKE $${parameter} OR p.category ILIKE $${parameter} OR p.description ILIKE $${parameter})`);
    params.push(search);
    parameter += 1;
  }

  for (const [value, column] of [
    [filters.featured, "p.is_featured"],
    [filters.trending, "p.is_trending"],
    [filters.flashSale, "p.is_flash_sale"],
    [filters.isNew, "p.is_new"],
    [filters.bestSeller, "p.is_best_seller"],
  ] as const) {
    const condition = flagCondition(value, column);
    if (condition) conditions.push(condition);
  }

  const where = conditions.join(" AND ");
  const offset = (filters.page - 1) * filters.limit;
  params.push(filters.limit, offset);
  const limitParameter = parameter;
  const offsetParameter = parameter + 1;

  try {
    const [rows, totalRow] = await Promise.all([
      query<any>(
        `SELECT ${selectColumns()} FROM products p
         WHERE ${where}
         ORDER BY ${sortExpression(filters.sort)}
         LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
        params,
      ),
      queryOne<any>(`SELECT COUNT(*)::int AS total FROM products p WHERE ${where}`, params.slice(0, -2)),
    ]);
    const total = Number(totalRow?.total ?? 0);
    return res.json({
      products: rows.map(dbRow),
      total,
      page: filters.page,
      totalPages: total === 0 ? 0 : Math.ceil(total / filters.limit),
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// GET /api/products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const row = await queryOne<any>(
      `SELECT ${selectColumns()},
              rs.avg_rating,
              s.id AS seller_info_id, s.name AS seller_info_name,
              s.email AS seller_info_email, s.avatar AS seller_info_avatar,
              s.bio AS seller_info_bio
       FROM products p
       LEFT JOIN (
         SELECT product_id, AVG(rating)::numeric(3,2) AS avg_rating
         FROM reviews GROUP BY product_id
       ) rs ON rs.product_id=p.id
       LEFT JOIN users s ON s.id=p.seller_id
       WHERE p.id=$1 AND p.status='active'`,
      [req.params.id],
    );
    if (!row) return res.status(404).json({ error: "Product not found" });
    return res.json({
      ...dbRow(row),
      avg_rating: row.avg_rating === null ? 0 : Number(row.avg_rating),
      seller: sellerFromRow(row),
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// POST /api/products/:id/view
router.post("/products/:id/view", async (req, res) => {
  try {
    const product = await queryOne<any>(
      "SELECT id,seller_id FROM products WHERE id=$1 AND status='active'",
      [req.params.id],
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.seller_id) {
      await execute(
        `INSERT INTO seller_analytics (seller_id,report_date,views)
         VALUES ($1,CURRENT_DATE,1)
         ON CONFLICT (seller_id,report_date)
         DO UPDATE SET views=seller_analytics.views+1`,
        [product.seller_id],
      );
    }
    return res.json({ success: true });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// POST /api/products
router.post("/products", sellerOrAdmin(), async (req, res) => {
  const parsed = createProductSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);
  const product = parsed.data;
  const user = req.user as AuthUser;
  const id = randomBytes(8).toString("hex");
  const sellerId = user.id;
  const sellerName = user.name;
  const status = isAdmin(user) ? "active" : "pending";
  const specs = product.specs ?? product.specifications;

  try {
    await execute(
      `INSERT INTO products
       (id,name,brand,category,price,original_price,discount,rating,review_count,
        stock,description,images,tags,specs,colors,sizes,is_featured,is_trending,
        is_best_seller,is_flash_sale,flash_sale_price,is_new,seller_id,seller_name,delivery_days,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
               $19,$20,$21,$22,$23,$24,$25,$26)`,
      [
        id, product.name, product.brand, product.category, product.price,
        product.originalPrice ?? product.price, product.discount, product.rating,
        product.reviewCount, product.stock, product.description,
        JSON.stringify(product.images), JSON.stringify(product.tags), JSON.stringify(specs),
        JSON.stringify(product.colors), JSON.stringify(product.sizes),
        isAdmin(user) ? product.isFeatured : false,
        isAdmin(user) ? product.isTrending : false,
        isAdmin(user) ? product.isBestSeller : false,
        product.isFlashSale, product.flashSalePrice ?? null, product.isNew,
        sellerId, sellerName, product.deliveryDays, status,
      ],
    );
    const created = await queryOne<any>("SELECT * FROM products WHERE id=$1", [id]);
    return res.status(201).json({ product: created ? dbRow(created) : null });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// PUT /api/products/:id
router.put("/products/:id", sellerOrAdmin(), async (req, res) => {
  const parsed = updateProductSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);
  const updates = parsed.data;
  const user = req.user as AuthUser;

  try {
    const existing = await queryOne<any>("SELECT * FROM products WHERE id=$1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (!isAdmin(user) && existing.seller_id !== user.id) {
      return res.status(403).json({ error: "You do not own this product" });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    const addField = (column: string, value: unknown) => {
      setClauses.push(`${column}=$${values.length + 1}`);
      values.push(value);
    };
    const fields: Record<string, string> = {
      name: "name", brand: "brand", category: "category", price: "price",
      originalPrice: "original_price", discount: "discount", rating: "rating",
      reviewCount: "review_count", stock: "stock", description: "description",
      colors: "colors", sizes: "sizes", images: "images", tags: "tags",
      deliveryDays: "delivery_days", isFeatured: "is_featured",
      isTrending: "is_trending", isBestSeller: "is_best_seller", isNew: "is_new",
      isFlashSale: "is_flash_sale", flashSalePrice: "flash_sale_price",
      sellerId: "seller_id", sellerName: "seller_name",
    };
    for (const [key, column] of Object.entries(fields)) {
      if (!(key in updates)) continue;
      if (!isAdmin(user) && ["isFeatured", "isTrending", "isBestSeller", "isFlashSale", "isNew", "sellerId", "sellerName"].includes(key)) continue;
      const value = (updates as any)[key];
      addField(
        column,
        ["images", "tags", "colors", "sizes"].includes(key) ? JSON.stringify(value) : value,
      );
    }
    if ("specifications" in updates || "specs" in updates) {
      addField("specs", JSON.stringify(updates.specs ?? updates.specifications));
    }
    if (!setClauses.length) return res.status(400).json({ error: "No fields to update" });
    setClauses.push("updated_at=NOW()");
    values.push(req.params.id);
    await execute(`UPDATE products SET ${setClauses.join(",")} WHERE id=$${values.length}`, values);
    const updated = await queryOne<any>("SELECT * FROM products WHERE id=$1", [req.params.id]);
    return res.json({ product: updated ? dbRow(updated) : null });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// DELETE /api/products/:id
router.delete("/products/:id", sellerOrAdmin(), async (req, res) => {
  try {
    const existing = await queryOne<any>("SELECT seller_id FROM products WHERE id=$1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (!isAdmin(req.user) && existing.seller_id !== req.user?.id) {
      return res.status(403).json({ error: "You do not own this product" });
    }
    await execute("DELETE FROM products WHERE id=$1", [req.params.id]);
    return res.json({ success: true });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// PATCH /api/products/:id/status
router.patch("/products/:id/status", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const result = await execute(
      "UPDATE products SET status=$1,updated_at=NOW() WHERE id=$2",
      [parsed.data.status, req.params.id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Product not found" });
    const updated = await queryOne<any>("SELECT * FROM products WHERE id=$1", [req.params.id]);
    return res.json({ product: updated ? dbRow(updated) : null });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// PATCH /api/products/:id/flash-sale
router.patch("/products/:id/flash-sale", sellerOrAdmin(), async (req, res) => {
  const parsed = flashSaleSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);
  try {
    const existing = await queryOne<any>("SELECT seller_id FROM products WHERE id=$1", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Product not found" });
    if (!isAdmin(req.user) && existing.seller_id !== req.user?.id) {
      return res.status(403).json({ error: "You do not own this product" });
    }
    await execute(
      `UPDATE products
       SET is_flash_sale=$1, flash_sale_price=$2, updated_at=NOW()
       WHERE id=$3`,
      [
        parsed.data.enabled,
        parsed.data.enabled ? parsed.data.flash_sale_price : null,
        req.params.id,
      ],
    );
    const updated = await queryOne<any>("SELECT * FROM products WHERE id=$1", [req.params.id]);
    return res.json({ product: updated ? dbRow(updated) : null });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

export default router;