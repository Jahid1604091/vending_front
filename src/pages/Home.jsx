import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ProductCard from "../components/ProductCard";
import "./Home.css";

export default function Home({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/products")
      .then((res) => {
        setProducts(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching products:", err.message);
        setError("Failed to load products. Please try again later.");
      });
  }, []);

  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((p) => p.id === product.id);
      if (existingProduct) {
        if (existingProduct.quantity < product.quantity) {
          return prevCart.map((p) =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
          );
        } else {
          alert("Cannot add more than available stock!");
          return prevCart;
        }
      } else {
        return [...prevCart, { ...product, quantity: 1, stock: product.quantity }];
      }
    });
  };

  const handleBuyNow = (product) => {
    let updatedCart = cart;
    if (!cart.find((p) => p.id === product.id)) {
      updatedCart = [
        ...cart,
        { ...product, quantity: 1, stock: product.quantity },
      ];
      setCart(updatedCart);
    }
    navigate("/cart", { state: { cart: updatedCart } });
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Snacks Vending</h1>
      {error && <p className="error-message">{error}</p>}
      {products.length === 0 && !error ? (
        <p>Loading products...</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={() => handleAddToCart(product)}
              handleBuy={() => handleBuyNow(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}