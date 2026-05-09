const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function jsonHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function multipartHeaders(token: string): HeadersInit {
    return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export type UserRole = "SUPER_ADMIN" | "STAFF";

export async function fetchUserRole(token: string): Promise<{ role: UserRole }> {
  return handle(await fetch(`${BASE}/api/admin/me`, { headers: jsonHeaders(token) }));
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  recentOrders: AdminOrder[];
}

export interface AdminOrder {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  governorate: string;
  city: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  notes: string | null;
  flouciPaymentId: string | null;
  createdAt: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  isOnSale: boolean;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  stock: number;
  sku: string | null;
  featured: boolean;
  createdAt: string;
}

// This type is for the form state, which will include the File object
export type ProductFormData = {
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  isOnSale?: boolean;
  image?: File | null;
  stock?: number;
  sku?: string | null;
  featured?: boolean;
  categoryId?: number | null;
};


export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return handle(await fetch(`${BASE}/api/admin/stats`, { headers: jsonHeaders(token) }));
}

export async function fetchAdminOrders(token: string): Promise<AdminOrder[]> {
  return handle(await fetch(`${BASE}/api/admin/orders`, { headers: jsonHeaders(token) }));
}

export async function fetchAdminProducts(token: string): Promise<AdminProduct[]> {
  return handle(await fetch(`${BASE}/api/admin/products`, { headers: jsonHeaders(token) }));
}

export async function createProduct(token: string, data: FormData): Promise<AdminProduct> {
  return handle(
    await fetch(`${BASE}/api/admin/products`, {
      method: "POST",
      headers: multipartHeaders(token),
      body: data,
    }),
  );
}

export async function updateProduct(token: string, id: number, data: FormData): Promise<AdminProduct> {
  return handle(
    await fetch(`${BASE}/api/admin/products/${id}`, {
      method: "PUT",
      headers: multipartHeaders(token),
      body: data,
    }),
  );
}

export async function patchProductStock(
  token: string,
  id: number,
  delta: number,
): Promise<{ id: number; stock: number }> {
  return handle(
    await fetch(`${BASE}/api/admin/products/${id}/stock`, {
      method: "PATCH",
      headers: jsonHeaders(token),
      body: JSON.stringify({ delta }),
    }),
  );
}

export async function deleteProduct(token: string, id: number): Promise<void> {
  await handle(
    await fetch(`${BASE}/api/admin/products/${id}`, {
      method: "DELETE",
      headers: jsonHeaders(token),
    }),
  );
}

export async function updateOrderStatus(
  token: string,
  id: number,
  status: string,
): Promise<{ id: number; status: string }> {
  return handle(
    await fetch(`${BASE}/api/admin/orders/${id}/status`, {
      method: "PUT",
      headers: jsonHeaders(token),
      body: JSON.stringify({ status }),
    }),
  );
}
