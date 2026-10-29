# Forma Product Showcase

A responsive React storefront powered by Redux Toolkit. Product data comes from the DummyJSON products API by default.

New to the project? Start with [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for a plain-language tour of every file and page.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` if you want to set a different API base URL.
3. Start the app with `npm run dev`.

Run the built-in API and Redux checks with `npm test`.

Set `VITE_API_BASE_URL` to the origin of an API that supports the same product routes:

- `GET /products` - product list and metadata
- `GET /products/:id` - product details
- `GET /products/search?q=:query` - server side product search
- `GET /products/category-list` - categories
- `GET /products/category/:slug` - products in a category

The feedback form saves submitted notes in the current browser's local storage.
