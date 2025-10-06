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
      <Link to="/" className="back-link">
        ← Back to Shop
      </Link>
      <h4>🛒 Your Shopping Cart</h4>
      {localCart.length === 0 ? (
        <div className="empty-cart-wrapper">
          <p className="empty-cart">Your cart is empty.</p>
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {localCart.map((item, index) => (
              <div key={index} className="cart-item">
                <img
                  src={process.env.REACT_APP_API_URL + item.image || "/images/no-image.png"}
                  alt={item.name || "Unknown"}
                  className="cart-item-image"
                  onError={(e) => {
                    e.target.src = "/images/no-image.png";
                  }}
                />
                <div className="cart-item-info">
                  <h3>{item.name || "Unknown"}</h3>
                  <p className="item-price">৳{item.price.toFixed(2)}</p>
                  <p className="item-stock">Available: {item.stock} in stock</p>
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQty(index)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button onClick={() => increaseQty(index)} aria-label="Increase quantity">
                      +
                    </button>
                  </div>
                </div>
                <div className="item-subtotal">
                  <p className="subtotal-label">Subtotal</p>
                  <p className="subtotal-price">৳{(item.price * item.quantity).toFixed(2)}</p>
                  <button className="remove-btn" onClick={() => removeItem(index)}>
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-row">
              <span>Items ({localCart.length})</span>
              <span>৳{totalPrice.toFixed(2)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total-row">
              <span>Total Amount</span>
              <span className="total-amount">৳{totalPrice.toFixed(2)}</span>
            </div>

            {cardData ? (
              <div className="card-info">
                <h3 className="card-info-title">💳 Payment Card Info</h3>
                <div className="card-details">
                  <div className="card-detail-row">
                    <span className="detail-label">User ID:</span>
                    <span className="detail-value">{cardData.userid}</span>
                  </div>
                  <div className="card-detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{cardData.username}</span>
                  </div>
                  <div className="card-detail-row">
                    <span className="detail-label">Available Credit:</span>
                    <span className="detail-value credit-amount">৳{cardData.credit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-warning">
                <p className="warning-icon">⚠️</p>
                <p className="warning-text">Please insert your card to proceed with checkout</p>
              </div>
            )}

            {error && error !== "Please insert the card for checkout" && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}

            <button
              className="checkout-btn"
              onClick={checkout}
              disabled={!cardData || cardData.credit < totalPrice || error === "Invalid user card"}
            >
              {!cardData ? "Insert Card to Checkout" : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}