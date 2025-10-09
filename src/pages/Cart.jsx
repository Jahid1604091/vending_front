import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";
import "./Cart.css";
import noImg from "../no-image.png";
import processSound from "../process.mp3";
import Loader from "../components/Loader";

export default function Cart({
  cart,
  setCart,
  cardData,
  isMqttConnected,
  isCardLoading,
  error,
  setError,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef(null);
  const initialCart = location.state?.cart || cart;
  const [localCart, setLocalCart] = useState(initialCart);
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isBalanceChecking, setIsBalanceChecking] = useState(false);

  useEffect(() => {
    setLocalCart(initialCart);
  }, [initialCart]);

  const fetchCardBalance = async () => {
    try {
      setIsBalanceChecking(true);
      const res = await api.post("/api/check-balance", {
        cardData,
      });
      if (res.data.success) {
        setBalance(res.data.balance);
      }
      setIsBalanceChecking(false);
    } catch (error) {
      console.log(error);
      setIsBalanceChecking(false);
    }
  };

  useEffect(() => {
    fetchCardBalance();
  }, [cardData]);

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

    if (balance < totalPrice) {
      setError("Insufficient balance. Please recharge your card.");
      return;
    }

    try {
      const orderProducts = localCart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      setIsLoading(true);
      setError(null);

      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio play failed:", err);
        });
      }

      const res = await api.post("/api/order", {
        products: orderProducts,
        cardData,
      });

      if (res.data.success) {
        navigate("/dispensing", { state: { cart: res.data.cart } });
        setCart([]);
        setLocalCart([]);
      } else {
        setError(res.data.error || "Order failed. Try again.");
      }
    } catch (err) {
      console.error(
        "Checkout error:",
        err.message,
        err.response?.status,
        err.response?.data
      );
      setError(
        err.response?.data?.error ||
          "Error while placing order. Please try again."
      );
    } finally {
      setIsLoading(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const totalPrice = localCart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-container">
      <Link to="/" className="back-link">
        ← Back to Shop
      </Link>
      <h4>🛒 Your Shopping Cart</h4>

      {/* MQTT Connection Status */}
      {!isMqttConnected && (
        <div className="connection-status connecting">
          <span className="status-indicator">🔄</span>
          <span>Connecting to card reader...</span>
        </div>
      )}

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
                  src={process.env.REACT_APP_API_URL + item.image || noImg}
                  alt={item.name || "Unknown"}
                  className="cart-item-image"
                  onError={(e) => {
                    e.target.src = noImg;
                  }}
                />
                <div className="cart-item-info">
                  <h3>{item.name || "Unknown"}</h3>
                  <p className="item-price">৳{item.price.toFixed(2)}</p>
                  <p className="item-stock">Available: {item.stock} in stock</p>
                  <div className="quantity-controls">
                    <button
                      onClick={() => decreaseQty(index)}
                      aria-label="Decrease quantity"
                      disabled={isLoading}
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(index)}
                      aria-label="Increase quantity"
                      disabled={isLoading}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="item-subtotal">
                  <p className="subtotal-label">Subtotal</p>
                  <p className="subtotal-price">
                    ৳{(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    className="remove-btn"
                    onClick={() => removeItem(index)}
                    disabled={isLoading}
                  >
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

            {/* Card Loading State */}
            {isCardLoading ? (
              <div className="card-loading">
                <div className="card-loader-container">
                  <div className="spinner"></div>
                  <p className="loading-text">Waiting for card...</p>
                </div>
              </div>
            ) : cardData ? (
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
                    {isBalanceChecking ? (
                      "Checking Balance..."
                    ) : (
                      <span
                        className={`detail-value credit-amount ${
                          balance < totalPrice ? "insufficient" : ""
                        }`}
                      >
                        ৳{balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {balance < totalPrice && (
                    <div className="insufficient-balance-warning">
                      <p className="warning-icon">⚠️</p>
                      <p className="warning-text">
                        Insufficient balance. Need ৳
                        {(totalPrice - balance).toFixed(2)} more.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card-warning">
                <p className="warning-icon">⚠️</p>
                <p className="warning-text">
                  Please insert your card to proceed with checkout
                </p>
              </div>
            )}

            {/* Error Messages */}
            {error && error !== "Please insert the card for checkout" && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )}

            {/* Checkout Button */}
            {isLoading ? (
              <div className="checkout-loading">
                <Loader />
                <p className="processing-text">Processing your order...</p>
              </div>
            ) : (
              <button
                className="checkout-btn"
                onClick={checkout}
                disabled={
                  !cardData ||
                  balance < totalPrice ||
                  isCardLoading ||
                  !isMqttConnected
                }
              >
                {!isMqttConnected
                  ? "Connecting to Card Reader..."
                  : isCardLoading
                  ? "Waiting for Card..."
                  : !cardData
                  ? "Insert Card to Checkout"
                  : balance < totalPrice
                  ? "Insufficient Balance"
                  : "Proceed to Checkout"}
              </button>
            )}
          </div>
        </div>
      )}
      <audio ref={audioRef} src={processSound} />
    </div>
  );
}
