// ─── ESTORE API Client ────────────────────────────────────────────────────────
// Calls the api-server at /api/*.
// If the server is unavailable or returns an error, callers handle fallback.

const BASE = '/api';

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || res.statusText), { status: res.status, data: err });
  }
  return res.json();
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list:   (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<{ data: any[]; source: string }>('GET', `/products${qs}`);
  },
  get:    (id: string)                      => req<any>('GET',    `/products/${id}`),
  create: (p: any)                          => req<any>('POST',   '/products', p),
  update: (id: string, p: Partial<any>)     => req<any>('PUT',    `/products/${id}`, p),
  delete: (id: string)                      => req<any>('DELETE', `/products/${id}`),
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string, referralCode?: string) =>
    req<any>('POST', '/auth/register', { name, email, password, referralCode }),
  login:  (email: string, password: string) =>
    req<any>('POST', '/auth/login',    { email, password }),
  logout: ()       => req<any>('POST', '/auth/logout'),
  me:     ()       => req<any>('GET',  '/auth/me'),
};

// ── Cart ──────────────────────────────────────────────────────────────────────
export const cartApi = {
  get:    ()                                                              => req<{ items: any[] }>('GET',    '/cart'),
  add:    (productId: string, quantity = 1, color?: string, size?: string) =>
    req<any>('POST',   '/cart', { productId, quantity, color, size }),
  update: (id: number, quantity: number)                                  => req<any>('PUT',    `/cart/${id}`, { quantity }),
  remove: (id: number)                                                    => req<any>('DELETE', `/cart/${id}`),
  clear:  ()                                                              => req<any>('DELETE', '/cart'),
};

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get:    ()                  => req<{ items: any[] }>('GET',  '/wishlist'),
  toggle: (productId: string) => req<{ added: boolean }>('POST', `/wishlist/${productId}`),
  remove: (productId: string) => req<any>('DELETE', `/wishlist/${productId}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  list:   ()       => req<{ orders: any[] }>('GET', '/orders'),
  create: (data: {
    items: { productId: string; name: string; image?: string; price: number; quantity: number; color?: string; size?: string }[];
    total: number;
    shipping?: { name?: string; address?: string; city?: string; phone?: string };
    paymentMethod?: string;
    notes?: string;
  }) => req<{ orderId: string; status: string; coinsEarned?: number }>('POST', '/orders', data),
  updateStatus: (id: string, status: string) =>
    req<any>('PATCH', `/orders/${id}/status`, { status }),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  get:    (productId: string)                          => req<{ reviews: any[]; stats: any }>('GET', `/reviews/${productId}`),
  create: (productId: string, rating: number, comment?: string) =>
    req<any>('POST', `/reviews/${productId}`, { rating, comment }),
  helpful: (productId: string, reviewId: string)       => req<any>('POST', `/reviews/${productId}/helpful/${reviewId}`),
};

// ── Wallet & Coins ────────────────────────────────────────────────────────────
export const walletApi = {
  get:          ()                                        => req<any>('GET', '/wallet'),
  topup:        (amount: number, method?: string)         => req<any>('POST', '/wallet/topup', { amount, method }),
  cashout:      (amount: number, method?: string)         => req<any>('POST', '/wallet/cashout', { amount, method }),
  redeemCoins:  (coins: number)                           => req<any>('POST', '/wallet/coins/redeem', { coins }),
};

// ── Check-In ──────────────────────────────────────────────────────────────────
export const checkInApi = {
  status:   () => req<any>('GET',  '/checkin'),
  checkIn:  () => req<any>('POST', '/checkin'),
};

// ── Referral ──────────────────────────────────────────────────────────────────
export const referralApi = {
  get: () => req<any>('GET', '/referral'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:          ()                                   => req<any>('GET',    '/admin/stats'),
  users:          (params?: Record<string, string>)    => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any>('GET', `/admin/users${qs}`);
  },
  getUser:        (id: string)                         => req<any>('GET',    `/admin/users/${id}`),
  updateUser:     (id: string, data: any)              => req<any>('PUT',    `/admin/users/${id}`, data),
  deleteUser:     (id: string)                         => req<any>('DELETE', `/admin/users/${id}`),
  orders:         (params?: Record<string, string>)    => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any>('GET', `/admin/orders${qs}`);
  },
  products:       (params?: Record<string, string>)    => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return req<any>('GET', `/admin/products${qs}`);
  },
};

// ── Seller ────────────────────────────────────────────────────────────────────
export const sellerApi = {
  register:    ()                                       => req<any>('POST',  '/seller/register'),
  stats:       ()                                       => req<any>('GET',   '/seller/stats'),
  products:    ()                                       => req<any>('GET',   '/seller/products'),
  orders:      ()                                       => req<any>('GET',   '/seller/orders'),
  recordSale:  (amount: number, description?: string)   => req<any>('POST',  '/seller/record-sale', { amount, description }),
  profile:     (id: string)                             => req<any>('GET',   `/seller/profile/${id}`),
};

// ── User Profile ──────────────────────────────────────────────────────────────
export const userApi = {
  getProfile:       ()                                  => req<any>('GET',  '/users/profile'),
  updateProfile:    (data: any)                         => req<any>('PUT',  '/users/profile', data),
  changePassword:   (currentPassword: string, newPassword: string) =>
    req<any>('PUT', '/users/password', { currentPassword, newPassword }),
  notifications:    ()                                  => req<any>('GET',  '/users/notifications'),
  markAllRead:      ()                                  => req<any>('PUT',  '/users/notifications/read'),
};
