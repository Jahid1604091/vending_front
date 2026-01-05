import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";
import "./Home.css";
import Loader from "../components/Loader";

export default function Home({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    api.get("/api/products")
      .then((res) => {
        setProducts(res.data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err.message);
        setError("Failed to load products. Please try again later.");
        setLoading(false);
      });
  }, [location.pathname]);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((p) => p.id === product.display_id);
      if (existingProduct) {
        if (existingProduct.quantity < product.quantity) {
          return prevCart.map((p) =>
            p.id === product.display_id ? { ...p, quantity: p.quantity + 1 } : p
          );
        } else {
          alert("Cannot add more than available stock!");
          return prevCart;
        }
      } else {
        return [
          ...prevCart,
          { 
            id: product.display_id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1, 
            stock: product.quantity,
            product_ids: product.product_ids,
            group_id: product.group_id
          },
        ];
      }
    });
  };

  const handleBuyNow = (product) => {
    let updatedCart = cart;
    if (!cart.find((p) => p.id === product.display_id)) {
      updatedCart = [
        ...cart,
        { 
          id: product.display_id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1, 
          stock: product.quantity,
          product_ids: product.product_ids,
          group_id: product.group_id
        },
      ];
      setCart(updatedCart);
    }
    navigate("/cart", { state: { cart: updatedCart } });
  };

  // Filter and sort products
  const getFilteredProducts = () => {
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch(sortBy) {
      case "price-low":
        return filtered.sort((a, b) => a.price - b.price);
      case "price-high":
        return filtered.sort((a, b) => b.price - a.price);
      case "name":
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case "stock":
        return filtered.sort((a, b) => b.quantity - a.quantity);
      default:
        return filtered;
    }
  };

  const filteredProducts = getFilteredProducts();
  const inStockCount = products.filter(p => p.quantity > 0).length;
  const totalProducts = products.length;

  return (
    <div className="home-wrapper">
      {/* Header Banner */}
      {/* <div className="home-header">
        <div className="header-content">
          <h1 className="home-title">
            <span className="title-icon">🛒</span>
            Vending Machine
          </h1>
          <p className="home-subtitle">
            Select your favorite items • Quick & Easy Checkout
          </p>
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{totalProducts}</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{inStockCount}</span>
              <span className="stat-label">In Stock</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{cart.length}</span>
              <span className="stat-label">In Cart</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Search and Filter Bar */}
      {/* <div className="controls-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
        <div className="sort-box">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="default">Default</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="stock">Stock Level</option>
          </select>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="home-container">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Retry
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="loader-container">
            <Loader />
            <p className="loading-text">Loading products...</p>
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <div className="no-products-icon">📦</div>
                <h3>No products found</h3>
                <p>
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try a different search term.`
                    : "No products available at the moment."
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="clear-filter-btn" 
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="results-info">
                  Showing {filteredProducts.length} of {totalProducts} products
                </div>
                <div className="products-grid">
                  {filteredProducts.map((product, index) => (
                    <div 
                      key={product.display_id} 
                      className="product-card-wrapper"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ProductCard
                        product={product}
                        addToCart={() => handleAddToCart(product)}
                        handleBuy={() => handleBuyNow(product)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Cart Float Button */}
      {cart.length > 0 && (
        <button 
          className="cart-float-btn" 
          onClick={() => navigate("/cart")}
        >
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{cart.length}</span>
        </button>
      )}
    </div>
  );
}