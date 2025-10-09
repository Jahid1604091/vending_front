import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Dispensing.css";
import noImg from "../no-image.png";
import thanksSound from "../thanks.mp3"; // Add this audio file

export default function Dispensing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = location.state || { cart: [] };
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [productUnits, setProductUnits] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);
  const redirectTimerRef = useRef(null);
  const audioRef = useRef(null);
  const hasPlayedThanksRef = useRef(false); // Prevent multiple plays

  // Initialize product units from cart
  useEffect(() => {
    console.log("📥 Received cart:", cart);
    
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      console.log("🕒 Empty or invalid cart, redirecting to home");
      setTimeout(() => navigate("/", { replace: true }), 1000);
      return;
    }

    const units = [];
    cart.forEach((item, index) => {
      if (!item.id || !item.quantity || item.quantity < 1) {
        console.warn(`⚠️ Invalid cart item at index ${index}:`, item);
        return;
      }
      
      for (let i = 0; i < item.quantity; i++) {
        units.push({
          ...item,
          unitIndex: i,
          unitKey: `${item.id}-${i}`,
          originalQuantity: item.quantity,
        });
      }
    });

    console.log("📦 Generated productUnits:", units);
    
    if (units.length === 0) {
      console.log("🕒 No valid product units, redirecting to home");
      setTimeout(() => navigate("/", { replace: true }), 1000);
      return;
    }

    setProductUnits(units);
    
    // Initialize statuses
    const initialStatuses = units.reduce(
      (acc, unit) => ({
        ...acc,
        [unit.unitKey]: { status: unit.failed ? "Failed" : "Pending" },
      }),
      {}
    );
    
    setStatuses(initialStatuses);
    setIsInitialized(true);

    // Play welcome/start sound on mount
    if (audioRef.current) {
      audioRef.current.volume = 0.7; // Set volume to 70%
    }
  }, [cart, navigate]);

  // Handle dispensing progression
  useEffect(() => {
    if (!isInitialized || productUnits.length === 0) {
      console.log("🕒 Waiting for initialization or no product units");
      return;
    }

    if (currentUnitIndex >= productUnits.length) {
      console.log("✅ All product units processed");
      setAllCompleted(true);

      // Play thank you sound only once when all completed
      if (!hasPlayedThanksRef.current && audioRef.current) {
        console.log("🔊 Playing thank you sound");
        audioRef.current.play().catch((err) => {
          console.warn("Audio play failed:", err);
        });
        hasPlayedThanksRef.current = true;
      }
      
      // Redirect after showing completion for 5 seconds (time for audio to play)
      redirectTimerRef.current = setTimeout(() => {
        console.log("🏠 Redirecting to home");
        navigate("/", { replace: true });
      }, 5000); // Extended to 5 seconds to allow audio to finish
      
      return;
    }

    const currentUnit = productUnits[currentUnitIndex];

    // Skip if already failed
    if (currentUnit.failed) {
      console.log(`⏭️ Skipping failed unit ${currentUnit.unitKey}`);
      setCurrentUnitIndex((prev) => prev + 1);
      return;
    }

    // Set to Dispensing
    console.log(`📤 Dispensing unit ${currentUnit.unitKey}`);
    setStatuses((prev) => ({
      ...prev,
      [currentUnit.unitKey]: { status: "Dispensing" },
    }));

    // After 3 seconds, mark as completed and move to next
    const timer = setTimeout(() => {
      console.log(`✅ Completed unit ${currentUnit.unitKey}`);
      
      setStatuses((prev) => ({
        ...prev,
        [currentUnit.unitKey]: { status: currentUnit.failed ? "Failed" : "Completed" },
      }));

      setCurrentUnitIndex((prev) => {
        console.log(`🕒 Advancing to unit index ${prev + 1}`);
        return prev + 1;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUnitIndex, productUnits, isInitialized, navigate]);

  // Cleanup redirect timer and audio
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Calculate item status based on all units
  const getItemStatus = (item) => {
    if (!item.quantity || item.quantity === 0) return "Pending";

    const unitStatuses = Array.from({ length: item.quantity }, (_, i) => {
      const status = statuses[`${item.id}-${i}`]?.status || "Pending";
      return status;
    });

    // If any unit is dispensing, show Dispensing
    if (unitStatuses.includes("Dispensing")) return "Dispensing";
    
    // If all units are completed, show Completed
    if (unitStatuses.every((s) => s === "Completed")) return "Completed";
    
    // If all units are failed, show Failed
    if (unitStatuses.every((s) => s === "Failed")) return "Failed";
    
    // If some completed and some failed, show Partial
    const completedCount = unitStatuses.filter((s) => s === "Completed").length;
    const failedCount = unitStatuses.filter((s) => s === "Failed").length;
    
    if (completedCount > 0 && failedCount > 0) {
      return `Partial (${completedCount}/${item.quantity})`;
    }

    return "Pending";
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (productUnits.length === 0) return 0;
    const completedUnits = Object.values(statuses).filter(
      (s) => s.status === "Completed" || s.status === "Failed"
    ).length;
    return Math.round((completedUnits / productUnits.length) * 100);
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="dispensing-container">
        <div className="empty-dispensing">
          <h2>No items to dispense</h2>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dispensing-container">
      <div className="dispensing-header">
        <h1>🎁 Dispensing Your Order</h1>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgress()}%` }}
            ></div>
          </div>
          <span className="progress-text">{getProgress()}% Complete</span>
        </div>
        {allCompleted && (
          <div className="completion-message">
            <p className="success-icon">✅</p>
            <p className="success-text">All items dispensed successfully!</p>
            <p className="thanks-text">🔊 Thank you for your purchase!</p>
            <p className="redirect-text">Redirecting to home...</p>
          </div>
        )}
      </div>

      <table className="dispensing-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item) => {
            const itemStatus = getItemStatus(item);
            const statusClass = itemStatus.toLowerCase().replace(/\s/g, "-");

            return (
              <tr key={item.id} className={`item-row ${statusClass}`}>
                <td>
                  <img
                    src={process.env.REACT_APP_API_URL + item.image || noImg}
                    alt={item.name || "Unknown"}
                    className="dispensing-image"
                    onError={(e) => (e.target.src = noImg)}
                  />
                </td>
                <td className="product-name">{item.name || "Unknown"}</td>
                <td className="product-quantity">{item.quantity || 0}</td>
                <td>
                  <span className={`status-badge status-${statusClass}`}>
                    {itemStatus === "Dispensing" && (
                      <span className="status-spinner"></span>
                    )}
                    {itemStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="dispensing-footer">
        <p className="info-text">
          ⏳ Please wait while your items are being dispensed...
        </p>
        <p className="warning-text">
          ⚠️ Do not leave the machine until all items are collected
        </p>
      </div>

      {/* Audio element for thank you sound */}
      <audio ref={audioRef} src={thanksSound} preload="auto" />
    </div>
  );
}