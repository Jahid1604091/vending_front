import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";
import "./Cart.css";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCart = location.state?.cart || cart;
  const [localCart, setLocalCart] = useState(initialCart);
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocalCart(initialCart);
  }, [initialCart]);

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const response = await api.get("/api/card-data");
        console.log("📋 Fetched card data:", response.data);
        setCardData(response.data.error ? null : response.data);
        setError(response.data.error || null);
      } catch (err) {
        console.error("❌ Error fetching card data:", err.message);
        setCardData(null);
        setError("Failed to fetch card data");
      }
    };

    fetchCardData();
    const interval = setInterval(fetchCardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const increaseQty = (index) => {
    const newCart = [...localCart];
    if (newCart[index].quantity < newCart[index].stock) {
      newCart[index].quantity += 1;
      setLocalCart(newCart);
      setCart(newCart);
    } else {
      alert("Cannot add more than available stock!");
    }
  };

  const decreaseQty = (index) => {
    const newCart = [...localCart];
    if (newCart[index].quantity > 1) {
      newCart[index].quantity -= 1;
      setLocalCart(newCart);
      setCart(newCart);
    }
  };

  const removeItem = (index) => {
    const newCart = [...localCart];
    newCart.splice(index, 1);
    setLocalCart(newCart);
    setCart(newCart);
  };

  const checkout = async () => {
    if (localCart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const exceedsStock = localCart.some((item) => item.quantity > item.stock);
    if (exceedsStock) {
      alert("Some items exceed available stock!");
      return;
    }

    if (!cardData) {
      setError("Please insert the card for checkout");
      return;
    }

    try {
      const orderProducts = localCart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      const res = await api.post("/api/order", { products: orderProducts });
      console.log("✅ Checkout response:", res.data);

      if (res.data.success) {
        navigate("/dispensing", { state: { cart: res.data.cart } });
        setCart([]);
        setLocalCart([]);
      } else {
        setError(res.data.error || "Order failed. Try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err.message, err.response?.status, err.response?.data);
      setError(err.response?.data?.error || "Error while placing order. Please try again.");
    }
  };

  const totalPrice = localCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="cart-container">
      <Link to="/" className="back-link">← Back </Link>
      <h1>Your Cart</h1>
      {localCart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {localCart.map((item, index) => (
            <div key={index} className="cart-item">
              <img
                src={process.env.REACT_APP_API_URL+item.image || "/images/fallback.jpg"}
                alt={item.name || "Unknown"}
                className="cart-item-image"
                onError={(e) => {
                  e.target.src = "/images/fallback.jpg";
                }}
              />
              <div className="cart-item-info">
                <h3>{item.name || "Unknown"}</h3>
                <p>৳{item.price.toFixed(2)}</p>
                <p>Stock: {item.stock}</p>
                <div className="quantity-controls">
                  <button onClick={() => decreaseQty(index)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQty(index)}>+</button>
                </div>
              </div>
              <button className="remove-btn" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
          ))}
          <div className="cart-total">
            <h2>Total: ৳{totalPrice.toFixed(2)}</h2>
            {cardData ? (
              <div className="card-info">
                <p>User ID: {cardData.userid}</p>
                <p>Username: {cardData.username}</p>
                <p>Credit: ৳{cardData.credit.toFixed(2)}</p>
              </div>
            ) : (
              <p className="error">{error || "Please insert the card for checkout"}</p>
            )}
            {error && error !== "Please insert the card for checkout" && (
              <p className="error">{error}</p>
            )}
            <button
              className="checkout-btn"
              onClick={checkout}
              disabled={!cardData || error === "Invalid user card"}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}