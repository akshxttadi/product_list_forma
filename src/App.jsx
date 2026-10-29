import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Check,
  ChevronDown,
  Menu,
  Minus,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  clearCart,
  clearSearch,
  fetchCategories,
  fetchCategoryProducts,
  fetchProduct,
  fetchProducts,
  removeFromCart,
  searchProducts,
  setCartQuantity,
  submitFeedback,
} from "./store";

// This file contains the visible pages and the small reusable pieces they share.
const money = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const titleCase = (text = "") =>
  text.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

// When the URL changes, start at the top of the new page or scroll to its #anchor.
function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash)
      requestAnimationFrame(() =>
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth" }),
      );
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.key, location.hash]);
  return null;
}

// Shared navigation, search box, and shopping-bag count.
function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const goSearch = (event) => {
    event.preventDefault();
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
      setMobileOpen(false);
      setSearchOpen(false);
    }
  };
  return (
    <>
      <div className="announcement">
        A little more considered. A little more everyday.{" "}
        <span>Free shipping on orders over $75</span>
      </div>
      <header className="site-header">
        <button
          className="icon-button mobile-menu"
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="main-navigation"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <Link className="wordmark" to="/" onClick={() => setMobileOpen(false)}>
          forma<span>.</span>
        </Link>
        <nav
          className={`main-nav ${mobileOpen ? "is-open" : ""}`}
          id="main-navigation"
        >
          <NavLink to="/products" onClick={() => setMobileOpen(false)}>
            Shop all
          </NavLink>
          <NavLink to="/categories" onClick={() => setMobileOpen(false)}>
            Collections
          </NavLink>
          <NavLink to="/feedback" onClick={() => setMobileOpen(false)}>
            Our notes
          </NavLink>
        </nav>
        <form
          className={`header-search ${searchOpen ? "is-open" : ""}`}
          onSubmit={goSearch}
          role="search"
        >
          <button
            type="button"
            className="mobile-search-toggle"
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMobileOpen(false);
            }}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <Search className="desktop-search-icon" size={17} strokeWidth={1.8} />
          <input
            aria-label="Search products"
            placeholder="Search anything"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button aria-label="Submit search" type="submit">
            <ArrowRight size={16} />
          </button>
        </form>
        <Link
          className="cart-link"
          to="/cart"
          aria-label={`Shopping bag, ${cartCount} items`}
          onClick={() => setMobileOpen(false)}
        >
          <ShoppingBag size={18} />
          <span>Bag</span>
          <b>{cartCount}</b>
        </Link>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <Link className="wordmark" to="/">
        forma<span>.</span>
      </Link>
      <p>Good things for the everyday.</p>
      <div className="footer-links">
        <Link to="/categories">Browse collections</Link>
        <Link to="/feedback">Leave a note</Link>
      </div>
      <small>© {new Date().getFullYear()} Forma Supply Co.</small>
    </footer>
  );
}

// One clickable product tile, reused wherever the app shows a product list.
function ProductCard({ product, index = 0 }) {
  return (
    <Link
      className="product-card"
      style={{ "--card-delay": `${(index % 12) * 28}ms` }}
      to={`/products/${product.id}`}
    >
      <div className={`product-image tone-${index % 6}`}>
        <img
          src={product.thumbnail || product.images?.[0]}
          alt={product.title}
          loading="lazy"
        />
        <span className="image-arrow">
          <ArrowUpRight size={17} />
        </span>
        {product.discountPercentage > 10 && (
          <span className="sale-pill">A good find</span>
        )}
      </div>
      <div className="product-meta">
        <div>
          <p className="product-category">{titleCase(product.category)}</p>
          <h3>{product.title}</h3>
        </div>
        <span className="price">{money(product.price)}</span>
      </div>
      <p className="product-description">
        {product.brand || "Forma edit"} <span>·</span>{" "}
        {product.rating ? (
          <>
            <Star size={12} fill="currentColor" />{" "}
            {Number(product.rating).toFixed(1)}
          </>
        ) : (
          "Made for everyday"
        )}
      </p>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, linkText, linkTo }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {linkText && (
        <Link className="text-link" to={linkTo}>
          {linkText}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

// A list can be loading, failed, empty, or ready. This component handles all four states.
function ProductGrid({
  products,
  loading,
  error,
  onRetry,
  empty = "Nothing here just yet.",
}) {
  if (loading)
    return (
      <div className="product-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skeleton-card" key={i}>
            <div />
            <i />
            <i />
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <div className="notice error-notice">
        {error}{" "}
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  if (!products?.length) return <div className="notice">{empty}</div>;
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}

// Homepage: load a small product preview and the category list when it opens.
function HomePage() {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.products.list);
  const cats = useSelector((state) => state.products.categories);
  useEffect(() => {
    dispatch(fetchProducts({ limit: 12 }));
    dispatch(fetchCategories());
  }, [dispatch]);
  return (
    <main className="route-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={14} /> A slower kind of shopping
          </p>
          <h1>
            Everyday things,
            <br />
            <em>thoughtfully</em> found.
          </h1>
          <p className="hero-description">
            Useful little things that make the everyday feel a bit more like
            you. Meet the pieces we keep coming back to.
          </p>
          <a className="button button-dark" href="#shop">
            Explore the edit <ArrowDownRight size={17} />
          </a>
          <div className="hero-footnote">
            <span className="avatar-stack">
              <i>F</i>
              <i>+</i>
              <i>Y</i>
            </span>
            <span>Loved by the ones who live in them</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1300&q=85"
            alt="Warm, sunlit home with natural textures"
          />
          <div className="hero-stamp">
            OBJECTS
            <br />
            FOR LIVING
            <br />
            <span>№ 01 - 25</span>
          </div>
          <div className="hero-caption">
            The soft things collection <ArrowUpRight size={15} />
          </div>
        </div>
        <div className="hero-index">01 / 04</div>
      </section>
      <section className="service-strip">
        <div>
          <span>01</span> Good things, chosen well
        </div>
        <div>
          <span>02</span> Designed to stay awhile
        </div>
        <div>
          <span>03</span> A little kindness, always
        </div>
      </section>
      <section className="content-section" id="shop">
        <SectionHeading
          eyebrow="The considered edit"
          title="Good things, lately"
          linkText="See everything"
          linkTo="/products"
        />
        <ProductGrid
          products={list.items}
          loading={list.loading}
          error={list.error}
          onRetry={() => dispatch(fetchProducts({ limit: 12 }))}
        />
        {!list.loading && !list.error && list.items.length < list.total && (
          <button
            className="button button-outline load-more"
            type="button"
            onClick={() =>
              dispatch(
                fetchProducts({
                  limit: 12,
                  skip: list.items.length,
                  append: true,
                }),
              )
            }
          >
            Load more good things <ArrowDownRight size={16} />
          </button>
        )}
      </section>
      <section className="category-promo">
        <div className="category-promo-image">
          <img
            src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1100&q=85"
            alt="Calm, natural home interior"
          />
        </div>
        <div className="category-promo-copy">
          <p className="eyebrow">Find your kind of good</p>
          <h2>
            Little corners
            <br />
            of <em>inspiration.</em>
          </h2>
          <p>
            From the things you wear to the things you keep, discover a
            collection for every little corner of your life.
          </p>
          <Link className="text-link" to="/categories">
            Explore all collections <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="content-section category-section">
        <SectionHeading
          eyebrow="A place for everything"
          title="Browse by feeling"
          linkText="All collections"
          linkTo="/categories"
        />
        {cats.loading ? (
          <div className="category-chips">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        ) : cats.error ? (
          <div className="notice error-notice">
            {cats.error}{" "}
            <button type="button" onClick={() => dispatch(fetchCategories())}>
              Try again
            </button>
          </div>
        ) : (
          <div className="category-chips">
            {cats.items.slice(0, 8).map((category, i) => (
              <Link
                className={`category-tile tile-${i % 4}`}
                to={`/categories/${encodeURIComponent(typeof category === "string" ? category : category.slug)}`}
                key={typeof category === "string" ? category : category.slug}
              >
                <span>
                  {titleCase(
                    typeof category === "string" ? category : category.name,
                  )}
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="quote-band">
        <span className="quote-mark">“</span>
        <p>
          Buy less. Choose well.
          <br />
          <em>Make it last.</em>
        </p>
        <small>A note to ourselves, and maybe you.</small>
      </section>
    </main>
  );
}

// Show every category returned by the API.
function CategoriesPage() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(
    (state) => state.products.categories,
  );
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  return (
    <main className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Find your kind of good</p>
        <h1>
          Browse <em>collections.</em>
        </h1>
        <p>A little something for every corner of your everyday.</p>
      </div>
      {loading ? (
        <div className="category-chips">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="notice error-notice">
          {error}{" "}
          <button type="button" onClick={() => dispatch(fetchCategories())}>
            Try again
          </button>
        </div>
      ) : (
        <div className="category-chips category-page-grid">
          {items.map((category, i) => {
            const slug =
              typeof category === "string" ? category : category.slug;
            const name =
              typeof category === "string"
                ? titleCase(category)
                : category.name;
            return (
              <Link
                className={`category-tile tile-${i % 4}`}
                to={`/categories/${encodeURIComponent(slug)}`}
                key={slug}
              >
                <span>{name}</span>
                <ArrowUpRight size={18} />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

// The full catalog loads in batches; the button requests the next batch.
function ProductsPage() {
  const dispatch = useDispatch();
  const list = useSelector((state) => state.products.list);
  useEffect(() => {
    dispatch(fetchProducts({ limit: 12 }));
  }, [dispatch]);
  return (
    <main className="page-shell route-page">
      <div className="page-intro">
        <p className="eyebrow">The considered edit</p>
        <h1>
          All the <em>good things.</em>
        </h1>
        <p>Useful, thoughtful finds for the everyday.</p>
      </div>
      <SectionHeading
        eyebrow="Made for everyday"
        title={
          list.total ? `${list.total} things to love` : "The full collection"
        }
      />
      <ProductGrid
        products={list.items}
        loading={list.loading}
        error={list.error}
        onRetry={() => dispatch(fetchProducts({ limit: 12 }))}
      />
      {!list.loading && !list.error && list.items.length < list.total && (
        <button
          className="button button-outline load-more"
          type="button"
          onClick={() =>
            dispatch(
              fetchProducts({
                limit: 12,
                skip: list.items.length,
                append: true,
              }),
            )
          }
        >
          Load more good things <ArrowDownRight size={16} />
        </button>
      )}
    </main>
  );
}

// The category slug comes from the URL, for example /categories/beauty.
function CategoryPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const category = useSelector((state) => state.products.category);
  useEffect(() => {
    dispatch(fetchCategoryProducts(slug));
  }, [dispatch, slug]);
  return (
    <main className="page-shell">
      <Link className="back-link" to="/categories">
        <ArrowLeft size={16} /> All collections
      </Link>
      <div className="page-intro category-intro">
        <p className="eyebrow">A collection for you</p>
        <h1>
          {titleCase(slug || "")}
          <em>.</em>
        </h1>
        <p>Thoughtful picks for a more considered everyday.</p>
      </div>
      <SectionHeading
        eyebrow="The collection"
        title={category.total ? `${category.total} good things` : "The edit"}
      />
      <ProductGrid
        products={category.items}
        loading={category.loading}
        error={category.error}
        onRetry={() => dispatch(fetchCategoryProducts(slug))}
      />
    </main>
  );
}

// Read q from the URL and ask Redux to search the API for that text.
function SearchPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const result = useSelector((state) => state.products.search);
  useEffect(() => {
    if (query) dispatch(searchProducts(query));
    else dispatch(clearSearch());
  }, [dispatch, query]);
  return (
    <main className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">A little looking around</p>
        <h1>
          Search <em>results.</em>
        </h1>
        <p>
          {query ? (
            <>
              Showing what we found for <strong>“{query}”</strong>
            </>
          ) : (
            "Enter a search term above to find a good thing."
          )}
        </p>
      </div>
      <SectionHeading
        eyebrow="The search"
        title={result.total ? `${result.total} results` : "Your results"}
      />
      <ProductGrid
        products={result.items}
        loading={result.loading}
        error={result.error}
        onRetry={() => query && dispatch(searchProducts(query))}
        empty={
          query
            ? `We couldn't find anything for “${query}”. Try another search.`
            : "Start with a word or two in the search field."
        }
      />
    </main>
  );
}

// Show product information and let the visitor add it to the local shopping bag.
function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { item, loading, error } = useSelector(
    (state) => state.products.detail,
  );
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);
  useEffect(() => {
    setActiveImage(0);
  }, [id]);
  if (loading)
    return (
      <main className="page-shell detail-loading">
        <div />
        <div />
      </main>
    );
  if (error)
    return (
      <main className="page-shell">
        <div className="notice error-notice">
          {error}{" "}
          <button type="button" onClick={() => dispatch(fetchProduct(id))}>
            Try again
          </button>
        </div>
      </main>
    );
  if (!item) return null;
  const images = item.images?.length ? item.images : [item.thumbnail];
  return (
    <main className="page-shell route-page">
      <Link className="back-link" to="/products">
        <ArrowLeft size={16} /> Back to the edit
      </Link>
      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-image">
            <img src={images[activeImage]} alt={item.title} />
          </div>
          <div className="thumbnail-row">
            {images.slice(0, 5).map((src, i) => (
              <button
                type="button"
                aria-label={`Show product image ${i + 1}`}
                className={i === activeImage ? "active" : ""}
                onClick={() => setActiveImage(i)}
                key={src}
              >
                <img src={src} alt={`${item.title}, view ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {titleCase(item.category)} · {item.brand || "Forma edit"}
          </p>
          <h1>
            {item.title}
            <em>.</em>
          </h1>
          <div className="detail-rating">
            <Star size={15} fill="currentColor" />{" "}
            {Number(item.rating || 0).toFixed(1)} <span>·</span>{" "}
            {item.stock > 0
              ? "In stock and ready to find a home"
              : "Currently out of stock"}
          </div>
          <p className="detail-price">
            {money(item.price)} <small>USD</small>
          </p>
          <p className="detail-description">{item.description}</p>
          <button
            type="button"
            className="button button-dark add-button"
            disabled={item.stock <= 0}
            onClick={() => {
              dispatch(addToCart(item));
              setAdded(true);
            }}
          >
            {added
              ? "Added to your bag"
              : item.stock > 0
                ? "Add to bag"
                : "Out of stock"}{" "}
            {added ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>
          {added && (
            <Link className="text-link added-link" to="/cart">
              View your bag <ArrowRight size={16} />
            </Link>
          )}
          <div className="detail-note">
            <Check size={16} /> Thoughtful finds, with care at every step.
          </div>
          <div className="detail-accordion">
            <details>
              <summary>
                A few good details <ChevronDown size={16} />
              </summary>
              <p>
                {item.warrantyInformation ||
                  "Made to be used and loved for a long time."}
              </p>
            </details>
            <details>
              <summary>
                Shipping & returns <ChevronDown size={16} />
              </summary>
              <p>
                {item.shippingInformation ||
                  "Complimentary shipping on orders over $75. Easy returns within 30 days."}
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}

// Quantities, removal, and totals are read from and written to the Redux cart.
function CartPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  );
  return (
    <main className="page-shell route-page cart-page">
      <div className="page-intro">
        <p className="eyebrow">Your good finds</p>
        <h1>
          Your <em>bag.</em>
        </h1>
        <p>
          {items.reduce((sum, line) => sum + line.quantity, 0)} items saved for
          you.
        </p>
      </div>
      {items.length === 0 ? (
        <div className="empty-cart">
          <ShoppingBag size={30} />
          <h2>Your bag is taking a little nap.</h2>
          <p>Find something thoughtful for your everyday.</p>
          <Link className="button button-dark" to="/products">
            Explore the edit <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <Link className="cart-thumb" to={`/products/${product.id}`}>
                  <img
                    src={product.thumbnail || product.images?.[0]}
                    alt={product.title}
                  />
                </Link>
                <div className="cart-line-info">
                  <p className="product-category">
                    {titleCase(product.category)}
                  </p>
                  <Link to={`/products/${product.id}`}>
                    <h2>{product.title}</h2>
                  </Link>
                  <span>{money(product.price)}</span>
                  <div className="quantity-control">
                    <button
                      aria-label={`Decrease ${product.title} quantity`}
                      onClick={() =>
                        dispatch(
                          setCartQuantity({
                            id: product.id,
                            quantity: quantity - 1,
                          }),
                        )
                      }
                    >
                      <Minus size={13} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      aria-label={`Increase ${product.title} quantity`}
                      onClick={() =>
                        dispatch(
                          setCartQuantity({
                            id: product.id,
                            quantity: quantity + 1,
                          }),
                        )
                      }
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <button
                  className="remove-line"
                  aria-label={`Remove ${product.title} from bag`}
                  onClick={() => dispatch(removeFromCart(product.id))}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <p className="eyebrow">A little sum-up</p>
            <div>
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <span>{total >= 75 ? "Free" : "No charge in demo"}</span>
            </div>
            <hr />
            <div className="cart-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <Link className="button button-dark checkout-button" to="/checkout">
              Continue to checkout <ArrowRight size={16} />
            </Link>
            <Link className="text-link continue-link" to="/products">
              Keep looking around <ArrowRight size={15} />
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}

// Demo-only checkout: it validates the form but does not send a payment or order.
function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
  });
  if (!items.length) return <Navigate to="/cart" replace />;
  const total = items.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  );
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const submit = (event) => {
    event.preventDefault();
    dispatch(clearCart());
    navigate("/order-confirmation", { state: { completed: true } });
  };
  return (
    <main className="page-shell route-page checkout-page">
      <Link className="back-link" to="/cart">
        <ArrowLeft size={16} /> Back to your bag
      </Link>
      <div className="page-intro">
        <p className="eyebrow">Just a few details</p>
        <h1>
          Make it <em>yours.</em>
        </h1>
        <p>Checkout preview. No payment is collected in this demo.</p>
      </div>
      <div className="checkout-layout">
        <form className="feedback-form checkout-form" onSubmit={submit}>
          <h2>Delivery details</h2>
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={update}
              required
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update}
              required
            />
          </label>
          <label>
            Street address
            <input
              name="address"
              autoComplete="street-address"
              value={form.address}
              onChange={update}
              required
            />
          </label>
          <div className="checkout-fields">
            <label>
              City
              <input
                name="city"
                autoComplete="address-level2"
                value={form.city}
                onChange={update}
                required
              />
            </label>
            <label>
              Postal code
              <input
                name="postalCode"
                autoComplete="postal-code"
                value={form.postalCode}
                onChange={update}
                required
              />
            </label>
          </div>
          <button className="button button-dark" type="submit">
            Place demo order <ArrowRight size={16} />
          </button>
        </form>
        <aside className="cart-summary checkout-summary">
          <p className="eyebrow">Your order</p>
          {items.map(({ product, quantity }) => (
            <div key={product.id}>
              <span>
                {product.title} × {quantity}
              </span>
              <strong>{money(product.price * quantity)}</strong>
            </div>
          ))}
          <div>
            <span>Shipping</span>
            <strong>No charge in demo</strong>
          </div>
          <hr />
          <div className="cart-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

// Only show this screen after the demo checkout navigates here successfully.
function OrderConfirmationPage() {
  const location = useLocation();
  if (!location.state?.completed) return <Navigate to="/products" replace />;
  return (
    <main className="page-shell route-page confirmation-page">
      <span className="confirmation-icon">
        <Check size={26} />
      </span>
      <p className="eyebrow">A good choice</p>
      <h1>
        Thank you, <em>it's all yours.</em>
      </h1>
      <p>Your demo order is complete. Thanks for exploring Forma.</p>
      <Link className="button button-dark" to="/products">
        Keep exploring <ArrowRight size={16} />
      </Link>
    </main>
  );
}

// Feedback is saved in this browser; there is no feedback server endpoint yet.
function FeedbackPage() {
  const dispatch = useDispatch();
  const entries = useSelector((state) => state.feedback.entries);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "A little feedback",
    message: "",
  });
  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 5000);
    return () => window.clearTimeout(timer);
  }, [sent]);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const send = (event) => {
    event.preventDefault();
    dispatch(submitFeedback(form));
    setForm({ name: "", email: "", topic: "A little feedback", message: "" });
    setSent(true);
  };
  return (
    <main className="feedback-page">
      <section className="feedback-intro">
        <p className="eyebrow">A little note goes a long way</p>
        <h1>
          We'd love to
          <br />
          <em>hear from you.</em>
        </h1>
        <p>
          Ideas, feedback, questions, a story about something you found here.
          Our inbox is open.
        </p>
        <div className="feedback-decoration">
          A note
          <br />
          from you
          <br />
          <span>means a lot.</span>
        </div>
      </section>
      <section className="feedback-form-wrap">
        <div className="form-heading">
          <span>01 - 02</span>
          <h2>Leave us a note</h2>
          <p>We read every one. Promise.</p>
        </div>
        {sent && (
          <div className="success-message">
            <Check size={18} /> Thanks for taking a moment to write. Your note
            is saved.
          </div>
        )}
        <form className="feedback-form" onSubmit={send}>
          <label>
            Your name
            <input
              name="name"
              value={form.name}
              onChange={update}
              placeholder="How should we call you?"
              required
            />
          </label>
          <label>
            Email address
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            What's on your mind?
            <select name="topic" value={form.topic} onChange={update}>
              <option>A little feedback</option>
              <option>Product question</option>
              <option>Shipping & orders</option>
              <option>Just saying hello</option>
              <option>Something else</option>
            </select>
          </label>
          <label>
            Your note
            <textarea
              name="message"
              value={form.message}
              onChange={update}
              placeholder="Tell us anything..."
              rows="5"
              required
              minLength="8"
            />
          </label>
          <button className="button button-dark" type="submit">
            Send your note <Send size={16} />
          </button>
          <small>
            Your note is stored on this device. We'll keep it thoughtful.
          </small>
        </form>
        <p className="notes-count">
          {entries.length
            ? `${entries.length} note${entries.length === 1 ? "" : "s"} shared so far`
            : "Your note will be the first in this little inbox."}
        </p>
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <main className="page-shell not-found">
      <p className="eyebrow">A small detour</p>
      <h1>
        Nothing here, <em>yet.</em>
      </h1>
      <Link className="button button-dark" to="/">
        Back to the good things <ArrowRight size={16} />
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Header />
      {/* Each Route connects a URL path to the page component that should appear. */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
