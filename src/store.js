import {
  configureStore,
  createAsyncThunk,
  createListenerMiddleware,
  createSlice,
} from "@reduxjs/toolkit";
import { productsApi } from "./api/productsApi.js";

// Each product list gets a separate object so one screen cannot change another screen's data.
const emptyProducts = () => ({
  items: [],
  total: 0,
  loading: false,
  error: null,
  requestId: null,
});
// A thunk is a Redux action that can wait for a network request to finish.
const createProductRequest = (name, request) =>
  createAsyncThunk(`products/${name}`, request);

export const fetchProducts = createProductRequest(
  "fetchAll",
  async (params, { signal, rejectWithValue }) => {
    try {
      return await productsApi.getProducts(params, signal);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const fetchProduct = createProductRequest(
  "fetchOne",
  async (id, { signal, rejectWithValue }) => {
    try {
      return await productsApi.getProduct(id, signal);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const searchProducts = createProductRequest(
  "search",
  async (query, { signal, rejectWithValue }) => {
    try {
      return await productsApi.searchProducts(query, signal);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const fetchCategories = createProductRequest(
  "categories",
  async (_, { signal, rejectWithValue }) => {
    try {
      return await productsApi.getCategories(signal);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
export const fetchCategoryProducts = createProductRequest(
  "category",
  async (slug, { signal, rejectWithValue }) => {
    try {
      return await productsApi.getCategoryProducts(slug, signal);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    list: emptyProducts(),
    detail: { item: null, loading: false, error: null, requestId: null },
    categories: { items: [], loading: false, error: null, requestId: null },
    search: emptyProducts(),
    category: emptyProducts(),
  },
  reducers: {
    clearSearch(state) {
      state.search = emptyProducts();
    },
  },
  extraReducers: (builder) => {
    // Reuse the loading/success/error steps for product lists, search results, and categories.
    const listCases = (thunk, key) =>
      builder
        .addCase(thunk.pending, (state, action) => {
          state[key].loading = true;
          state[key].error = null;
          state[key].requestId = action.meta.requestId;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          // A slow old response must not replace results from a newer page or search.
          if (state[key].requestId !== action.meta.requestId) return;
          state[key].loading = false;
          state[key].requestId = null;
          state[key].items = action.meta.arg?.append
            ? [...state[key].items, ...(action.payload.products || [])]
            : action.payload.products || [];
          state[key].total = action.payload.total || 0;
        })
        .addCase(thunk.rejected, (state, action) => {
          if (state[key].requestId !== action.meta.requestId) return;
          state[key].loading = false;
          state[key].requestId = null;
          state[key].error = action.payload || action.error.message;
        });
    listCases(fetchProducts, "list");
    listCases(searchProducts, "search");
    listCases(fetchCategoryProducts, "category");
    builder
      .addCase(fetchProduct.pending, (state, action) => {
        state.detail.loading = true;
        state.detail.error = null;
        state.detail.item = null;
        state.detail.requestId = action.meta.requestId;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        if (state.detail.requestId !== action.meta.requestId) return;
        state.detail.loading = false;
        state.detail.requestId = null;
        state.detail.item = action.payload;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        if (state.detail.requestId !== action.meta.requestId) return;
        state.detail.loading = false;
        state.detail.requestId = null;
        state.detail.error = action.payload || action.error.message;
      })
      .addCase(fetchCategories.pending, (state, action) => {
        state.categories.loading = true;
        state.categories.error = null;
        state.categories.requestId = action.meta.requestId;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        if (state.categories.requestId !== action.meta.requestId) return;
        state.categories.loading = false;
        state.categories.requestId = null;
        state.categories.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        if (state.categories.requestId !== action.meta.requestId) return;
        state.categories.loading = false;
        state.categories.requestId = null;
        state.categories.error = action.payload || action.error.message;
      });
  },
});

// localStorage belongs to the browser, so guard reads in case it is disabled or damaged.
const readArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    // A missing or malformed saved value should not stop the app from opening.
    return [];
  }
};

// These slices hold visitor data that should remain after a page refresh.
const feedbackSlice = createSlice({
  name: "feedback",
  initialState: { entries: readArray("forma-feedback") },
  reducers: {
    submitFeedback: {
      reducer(state, action) {
        state.entries.unshift(action.payload);
      },
      prepare(feedback) {
        // Add timestamps before the reducer runs so reducers stay predictable.
        return {
          payload: {
            ...feedback,
            id: Date.now(),
            submittedAt: new Date().toISOString(),
          },
        };
      },
    },
  },
});

// Each cart line keeps a product and its quantity so the bag page can display it.
const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: readArray("forma-cart").filter(
      (line) =>
        line?.product?.id != null &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0,
    ),
  },
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const stock = Number.isFinite(Number(product.stock))
        ? Number(product.stock)
        : Infinity;
      if (stock <= 0) return;
      const existing = state.items.find(
        (item) => item.product.id === product.id,
      );
      if (existing) existing.quantity = Math.min(existing.quantity + 1, stock);
      else state.items.push({ product, quantity: 1 });
    },
    setCartQuantity(state, action) {
      const line = state.items.find(
        (item) => item.product.id === action.payload.id,
      );
      const quantity = Math.floor(Number(action.payload.quantity));
      if (!line || !Number.isFinite(quantity)) return;
      const stock = Number.isFinite(Number(line.product.stock))
        ? Number(line.product.stock)
        : Infinity;
      line.quantity = Math.min(Math.max(1, quantity), Math.max(1, stock));
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload,
      );
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { clearSearch } = productSlice.actions;
export const { submitFeedback } = feedbackSlice.actions;
export const { addToCart, setCartQuantity, removeFromCart, clearCart } =
  cartSlice.actions;

const persistence = createListenerMiddleware();
// Save browser-only data after Redux updates, keeping storage writes out of reducers.
export const store = configureStore({
  reducer: {
    products: productSlice.reducer,
    feedback: feedbackSlice.reducer,
    cart: cartSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(persistence.middleware),
});

const persist = (key, select) => (_, listenerApi) => {
  try {
    localStorage.setItem(key, JSON.stringify(select(listenerApi.getState())));
  } catch {
    /* Keep the current session usable if storage is unavailable. */
  }
};

persistence.startListening({
  actionCreator: submitFeedback,
  effect: persist("forma-feedback", (state) => state.feedback.entries),
});
persistence.startListening({
  actionCreator: addToCart,
  effect: persist("forma-cart", (state) => state.cart.items),
});
persistence.startListening({
  actionCreator: setCartQuantity,
  effect: persist("forma-cart", (state) => state.cart.items),
});
persistence.startListening({
  actionCreator: removeFromCart,
  effect: persist("forma-cart", (state) => state.cart.items),
});
persistence.startListening({
  actionCreator: clearCart,
  effect: persist("forma-cart", (state) => state.cart.items),
});
