import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Dispensing from "./pages/Dispensing";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  const [cart, setCart] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("adminId"));

  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    // Check authentication status on mount
    const adminId = localStorage.getItem("adminId");
    setIsAuthenticated(!!adminId);
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
          <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
          <Route path="/login" element={<Login setAuthenticated={setIsAuthenticated} />} />
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