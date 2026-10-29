# Forma Product Showcase

A responsive React storefront powered by Redux Toolkit. Product data is loaded from the DummyJSON products API by default.

[Open the live site](https://product-list-forma.vercel.app) · [Read the project guide](./PROJECT_GUIDE.md)

## Features

- Browse products, categories, and product details
- Search the catalog
- Add items to the shopping bag and try the demo checkout
- Submit feedback, saved in the current browser's local storage

## Run locally

```sh
npm install
npm run dev
```

To use a different API origin, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. The API must support these routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/products` | Product list and metadata |
| `GET` | `/products/:id` | Product details |
| `GET` | `/products/search?q=:query` | Search products |
| `GET` | `/products/category-list` | Category list |
| `GET` | `/products/category/:slug` | Products in a category |

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm test` | Run the API and Redux checks |
| `npm run build` | Build the app for deployment |
| `npm run preview` | Preview the production build locally |
