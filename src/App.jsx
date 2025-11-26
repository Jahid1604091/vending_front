import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Dispensing from "./pages/Dispensing";
import Navbar from "./components/Navbar";
import "./App.css";
import mqtt from "mqtt";

function App() {
  const [cart, setCart] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("adminId")
  );
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(true);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    // Check authentication status on mount
    const adminId = localStorage.getItem("adminId");
    setIsAuthenticated(!!adminId);
  }, []);

  //mqtt connection
  useEffect(() => {
    const WS_URL =
      process.env.REACT_APP_MQTT_HOST_PORT.startsWith("ws://") ||
      process.env.REACT_APP_MQTT_HOST_PORT.startsWith("wss://")
        ? process.env.REACT_APP_MQTT_HOST_PORT
        : `ws://${process.env.REACT_APP_MQTT_HOST_PORT}`;

    const mqttClient = mqtt.connect(WS_URL, {
      keepalive: 0,
      reconnectPeriod: 1000,
    });
    let cardRemovalTimeout = null;

    mqttClient.on("connect", () => {
      console.log("✅ Connected to MQTT broker");
      setIsMqttConnected(true);

      mqttClient.subscribe(
        process.env.REACT_APP_MQTT_TOPIC_CARD_RESPONSE,
        { qos: 1 },
        (err) => {
          if (err) {
            console.error("❌ Subscription error:", err);
            setError("Failed to connect to card reader");
            setIsCardLoading(false);
          } else {
            console.log("📡 Subscribed to card/response");

            // Request current card data after subscribing
            console.log("📨 Requesting current card data...");
            mqttClient.publish("card/request", "get_current", { qos: 1 });
          }
        }
      );
    });

    mqttClient.on("error", (err) => {
      console.error("❌ MQTT connection error:", err);
      setIsMqttConnected(false);
      setError("Connection to card reader failed");
      setIsCardLoading(false);
    });

    mqttClient.on("close", () => {
      console.log("❌ MQTT connection closed");
      setIsMqttConnected(false);
      setIsCardLoading(true);
    });

    mqttClient.on("reconnect", () => {
      console.log("🔄 Reconnecting to MQTT...");
      setIsCardLoading(true);
    });

    mqttClient.on("message", (topic, message) => {
      console.log(`📥 Received message: ${message.toString()}`);
      setMessages((prevMessages) => [...prevMessages, message.toString()]);

      try {
        const data = JSON.parse(message.toString());

        // Clear any existing timeout
        if (cardRemovalTimeout) {
          clearTimeout(cardRemovalTimeout);
          cardRemovalTimeout = null;
        }

        // If data is null, wait before showing error
        if (data === null) {
          cardRemovalTimeout = setTimeout(() => {
            setCardData(null);
            setError("Please insert the card for checkout");
            setIsCardLoading(false);
          }, parseInt(process.env.REACT_APP_CARD_REMOVAL_TIMEOUT) || 5000);
        } else {
          // Valid card data received
          setCardData(data);
          setError(null);
          setIsCardLoading(false);
        }
      } catch (err) {
        console.error("❌ Error parsing card data:", err);
        setError("Invalid card data received");
        setIsCardLoading(false);
      }
    });

    setClient(mqttClient);

    return () => {
      console.log("🧹 Cleaning up MQTT connection...");
      if (cardRemovalTimeout) {
        clearTimeout(cardRemovalTimeout);
      }
      mqttClient.end();
      setClient(null);
      setIsMqttConnected(false);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Navbar
        totalQuantity={totalQuantity}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home cart={cart} setCart={setCart} />} />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                setCart={setCart}
                cardData={cardData}
                error={error}
                setError={setError}
                isCardLoading={isCardLoading}
                isMqttConnected={isMqttConnected}
              />
            }
          />
          <Route
            path="/login"
            element={<Login setAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/admin"
            element={isAuthenticated ? <Admin /> : <Navigate to="/login" />}
          />
          <Route path="/dispensing" element={<Dispensing />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
