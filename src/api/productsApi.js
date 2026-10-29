// Change this in .env to point the app at another API with the same routes.
const API_BASE = (
  import.meta.env?.VITE_API_BASE_URL || "https://dummyjson.com"
).replace(/\/$/, "");

async function request(path, signal) {
  // Keep fetch and its error handling in one place so every endpoint behaves the same way.
  const response = await fetch(`${API_BASE}${path}`, { signal });
  if (!response.ok)
    throw new Error(
      `The request failed (${response.status}). Please try again.`,
    );
  return response.json();
}

export const productsApi = {
  // These methods match the product routes listed in README.md.
  getProducts: (params = {}, signal) => {
    const query = new URLSearchParams();
    if (params.limit != null) query.set("limit", params.limit);
    if (params.skip != null) query.set("skip", params.skip);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.order) query.set("order", params.order);
    const search = query.toString();
    return request(`/products${search ? `?${search}` : ""}`, signal);
  },
  getProduct: (id, signal) =>
    request(`/products/${encodeURIComponent(id)}`, signal),
  searchProducts: (query, signal) =>
    request(`/products/search?q=${encodeURIComponent(query)}`, signal),
  getCategories: (signal) => request("/products/category-list", signal),
  getCategoryProducts: (slug, signal) =>
    request(`/products/category/${encodeURIComponent(slug)}`, signal),
};
