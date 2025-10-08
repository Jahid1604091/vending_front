import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api";
import "./Cart.css";
import noImg from "../no-image.png";
import processSound from "../process.mp3";
import mqtt from "mqtt";
import Loader from "../components/Loader";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef(null);
  const initialCart = location.state?.cart || cart;
  const [localCart, setLocalCart] = useState(initialCart);
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(true);

  useEffect(() => {
    setLocalCart(initialCart);
  }, [initialCart]);

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9003", {
      keepalive: 0,
    });

    let cardRemovalTimeout = null;

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe(
        process.env.REACT_APP_MQTT_TOPIC_CARD_RESPONSE,
        (err) => {
          if (err) {
            console.error("Subscription error:", err);
          }
        }
      );
    });

    client.on("message", (topic, message) => {
      setMessages((prevMessages) => [...prevMessages, message.toString()]);
      const data = JSON.parse(message.toString());

      // Clear any existing timeout
      if (cardRemovalTimeout) {
        clearTimeout(cardRemovalTimeout);
        cardRemovalTimeout = null;
      }

      // If data is null, wait 5 seconds before setting it
      if (data === null) {
        cardRemovalTimeout = setTimeout(() => {
          setCardData(null);
          setError("Please insert the card for checkout");
          setIsCardLoading(false);
        }, process.env.REACT_APP_CARD_REMOVAL_TIMEOUT || 5000);
      } else {
        // If valid data, set immediately
        setCardData(data);
        setError(null);
        setIsCardLoading(false);
      }
    });

    setClient(client);

    return () => {
      if (cardRemovalTimeout) {
        clearTimeout(cardRemovalTimeout);
      }
      client.end();
      setClient(null);
    };
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

      setIsLoading(true);
      audioRef.current.play();
      const res = await api.post("/api/order", {
        products: orderProducts,
        cardData,
      });

      if (res.data.success) {
        navigate("/dispensing", { state: { cart: res.data.cart } });
        setCart([]);
        setLocalCart([]);
        setIsLoading(false);
        audioRef.current.pause();
      } else {
        setError(res.data.error || "Order failed. Try again.");
        setIsLoading(false);
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
      setIsLoading(false);
      audioRef.current.stop();
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
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(index)}
                      aria-label="Increase quantity"
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
                    <span className="detail-value credit-amount">
                      ৳{cardData.credit.toFixed(2)}
                    </span>
                  </div>
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

            {/* {error && error !== "Please insert the card for checkout" && (
              <div className="error-message">
                <p>❌ {error}</p>
              </div>
            )} */}

            {isLoading ? (
              <Loader />
            ) : (
              <button
                className="checkout-btn"
                onClick={checkout}
                disabled={
                  !cardData ||
                  cardData.credit < totalPrice ||
                  error === "Invalid user card"
                }
              >
                {!cardData ? "Insert Card to Checkout" : "Proceed to Checkout"}
              </button>
            )}
          </div>
        </div>
      )}
      <audio ref={audioRef} src={processSound} />
    </div>
  );
}
