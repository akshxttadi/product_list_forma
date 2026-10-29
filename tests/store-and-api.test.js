import assert from "node:assert/strict";
import { after, test } from "node:test";
import { productsApi } from "../src/api/productsApi.js";
import {
  addToCart,
  clearCart,
  fetchCategories,
  fetchCategoryProducts,
  fetchProduct,
  fetchProducts,
  removeFromCart,
  setCartQuantity,
  store,
  submitFeedback,
} from "../src/store.js";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;
after(() => {
  globalThis.fetch = originalFetch;
  if (originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

test("product API methods call the expected routes and encode queries", async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return { ok: true, json: async () => ({}) };
  };

  await productsApi.getProducts({
    limit: 12,
    skip: 0,
    sortBy: "price",
    order: "asc",
  });
  await productsApi.getProduct(7);
  await productsApi.searchProducts("hand cream");
  await productsApi.getCategories();
  await productsApi.getCategoryProducts("beauty");

  assert.deepEqual(calls, [
    "https://dummyjson.com/products?limit=12&skip=0&sortBy=price&order=asc",
    "https://dummyjson.com/products/7",
    "https://dummyjson.com/products/search?q=hand%20cream",
    "https://dummyjson.com/products/category-list",
    "https://dummyjson.com/products/category/beauty",
  ]);
});

test("product result groups have independent state and ignore stale responses", () => {
  const products = store.getState().products;
  assert.notStrictEqual(products.list, products.search);
  assert.notStrictEqual(products.list, products.category);
  assert.notStrictEqual(products.search, products.category);

  store.dispatch(fetchProducts.pending("old-request", { limit: 12 }));
  store.dispatch(fetchProducts.pending("new-request", { limit: 12 }));
  store.dispatch(
    fetchProducts.fulfilled(
      { products: [{ id: 2 }], total: 1 },
      "new-request",
      { limit: 12 },
    ),
  );
  store.dispatch(
    fetchProducts.fulfilled(
      { products: [{ id: 1 }], total: 1 },
      "old-request",
      { limit: 12 },
    ),
  );

  assert.deepEqual(
    store.getState().products.list.items.map(({ id }) => id),
    [2],
  );

  store.dispatch(fetchCategoryProducts.pending("old-category", "beauty"));
  store.dispatch(fetchCategoryProducts.pending("new-category", "fragrances"));
  store.dispatch(
    fetchCategoryProducts.fulfilled(
      { products: [{ id: 2 }], total: 1 },
      "new-category",
      "fragrances",
    ),
  );
  store.dispatch(
    fetchCategoryProducts.fulfilled(
      { products: [{ id: 1 }], total: 1 },
      "old-category",
      "beauty",
    ),
  );
  assert.deepEqual(
    store.getState().products.category.items.map(({ id }) => id),
    [2],
  );

  store.dispatch(fetchProduct.pending("old-detail", "1"));
  store.dispatch(fetchProduct.pending("new-detail", "2"));
  store.dispatch(fetchProduct.fulfilled({ id: 2 }, "new-detail", "2"));
  store.dispatch(fetchProduct.fulfilled({ id: 1 }, "old-detail", "1"));
  assert.equal(store.getState().products.detail.item.id, 2);

  store.dispatch(fetchCategories.pending("old-categories", undefined));
  store.dispatch(fetchCategories.pending("new-categories", undefined));
  store.dispatch(
    fetchCategories.fulfilled(["new"], "new-categories", undefined),
  );
  store.dispatch(
    fetchCategories.fulfilled(["old"], "old-categories", undefined),
  );
  assert.deepEqual(store.getState().products.categories.items, ["new"]);
});

test("cart quantity is bounded by stock and cart/feedback changes persist", async () => {
  const saved = new Map();
  globalThis.localStorage = {
    getItem: (key) => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  };

  const product = {
    id: 987654,
    title: "Limited stock item",
    price: 8,
    stock: 1,
  };
  store.dispatch(clearCart());
  store.dispatch(addToCart(product));
  store.dispatch(addToCart(product));
  store.dispatch(setCartQuantity({ id: product.id, quantity: 5 }));
  assert.equal(store.getState().cart.items[0].quantity, 1);
  store.dispatch(removeFromCart(product.id));
  assert.equal(store.getState().cart.items.length, 0);

  store.dispatch(
    submitFeedback({
      name: "Test",
      email: "test@example.com",
      message: "A small test note.",
    }),
  );
  const entry = store.getState().feedback.entries[0];
  assert.equal(entry.name, "Test");
  assert.ok(Number.isInteger(entry.id));
  assert.ok(Number.isFinite(Date.parse(entry.submittedAt)));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(JSON.parse(saved.get("forma-cart")), []);
  assert.equal(JSON.parse(saved.get("forma-feedback"))[0].name, "Test");
});
