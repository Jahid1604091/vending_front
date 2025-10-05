// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./Dispensing.css";

// export default function Dispensing() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { cart } = location.state || { cart: [] };
//   const [currentItemIndex, setCurrentItemIndex] = useState(0);
//   const [statuses, setStatuses] = useState({});

//   useEffect(() => {
//     if (cart.length === 0) {
//       console.log("🕒 No items in cart, redirecting to home");
//       navigate("/", { replace: true });
//       return;
//     }

//     // Initialize statuses based on cart's failed property
//     setStatuses(
//       cart.reduce((acc, item) => ({
//         ...acc,
//         [item.id]: { status: item.failed ? "Failed" : "Pending" }
//       }), {})
//     );

//     if (currentItemIndex >= cart.length) {
//       console.log("🕒 All items processed, redirecting to home");
//       navigate("/", { replace: true });
//       return;
//     }

//     if (!cart[currentItemIndex].failed) {
//       setStatuses((prev) => ({
//         ...prev,
//         [cart[currentItemIndex].id]: { status: "Dispensing" }
//       }));
//     }

//     const timer = setTimeout(() => {
//       setCurrentItemIndex((prev) => prev + 1);
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, [currentItemIndex, cart, navigate]); // Includes all dependencies

//   return (
//     <div className="dispensing-container">
//       <h1>Dispensing Your Order</h1>
//       {cart.length === 0 ? (
//         <p>No items to dispense</p>
//       ) : (
//         <table className="dispensing-table">
//           <thead>
//             <tr>
//               <th>Image</th>
//               <th>Name</th>
//               <th>Quantity</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {cart.map((item) => (
//               <tr key={item.id}>
//                 <td>
//                   <img
//                     src={item.image}
//                     alt={item.name}
//                     className="dispensing-image"
//                     onError={(e) => (e.target.src = "/images/no-image.png")}
//                   />
//                 </td>
//                 <td>{item.name}</td>
//                 <td>{item.quantity}</td>
//                 <td className={`status-${(statuses[item.id]?.status || "Pending").toLowerCase()}`}>
//                   {statuses[item.id]?.status || "Pending"}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }














import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Dispensing.css";

export default function Dispensing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = location.state || { cart: [] };
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [productUnits, setProductUnits] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Log cart for debugging
  useEffect(() => {
    console.log("📥 Received cart:", cart);
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      console.log("🕒 Empty or invalid cart, redirecting to home");
      navigate("/", { replace: true });
      return;
    }

    const units = [];
    cart.forEach((item, index) => {
      if (!item.id || !item.quantity || item.quantity < 1) {
        console.warn(`⚠️ Invalid cart item at index ${index}:`, item);
        return;
      }
      for (let i = 0; i < item.quantity; i++) {
        units.push({ ...item, unitIndex: i, unitKey: `${item.id}-${i}` });
      }
    });

    console.log("📦 Generated productUnits:", units);
    if (units.length === 0) {
      console.log("🕒 No valid product units, redirecting to home");
      navigate("/", { replace: true });
      return;
    }

    setProductUnits(units);
    setStatuses(
      units.reduce((acc, unit) => ({
        ...acc,
        [unit.unitKey]: { status: unit.failed ? "Failed" : "Pending" }
      }), {})
    );
    setIsInitialized(true);
  }, [cart, navigate]);

  useEffect(() => {
    if (!isInitialized || productUnits.length === 0) {
      console.log("🕒 Waiting for initialization or no product units");
      return;
    }

    if (currentUnitIndex >= productUnits.length) {
      console.log("🕒 All product units processed, redirecting to home");
      navigate("/", { replace: true });
      return;
    }

    if (!productUnits[currentUnitIndex].failed) {
      console.log(`📤 Setting Dispensing for unit ${productUnits[currentUnitIndex].unitKey}`);
      setStatuses((prev) => ({
        ...prev,
        [productUnits[currentUnitIndex].unitKey]: { status: "Dispensing" }
      }));
    }

    const timer = setTimeout(() => {
      setCurrentUnitIndex((prev) => {
        console.log(`🕒 Advancing to unit index ${prev + 1}`);
        return prev + 1;
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUnitIndex, productUnits, isInitialized, navigate]);

  return (
    <div className="dispensing-container">
      <h1>Dispensing Your Order</h1>
      {cart.length === 0 ? (
        <p>No items to dispense</p>
      ) : (
        <table className="dispensing-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => {
              // Determine the status for this item based on its units
              const unitStatuses = Array.from({ length: item.quantity || 0 }, (_, i) => statuses[`${item.id}-${i}`]?.status || "Pending");
              const displayStatus = unitStatuses.includes("Dispensing")
                ? "Dispensing"
                : unitStatuses.every((s) => s === "Failed")
                ? "Failed"
                : "Pending";

              return (
                <tr key={item.id}>
                  <td>
                    <img
                      src={process.env.REACT_APP_API_URL + item.image || "/images/no-image.png"}
                      alt={item.name || "Unknown"}
                      className="dispensing-image"
                      onError={(e) => (e.target.src = "/images/no-image.png")}
                    />
                  </td>
                  <td>{item.name || "Unknown"}</td>
                  <td>{item.quantity || 0}</td>
                  <td className={`status-${displayStatus.toLowerCase()}`}>
                    {displayStatus}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}