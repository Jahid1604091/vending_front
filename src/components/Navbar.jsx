import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ totalQuantity, isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout(); // Clear token and set isAuthenticated to false in App
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className="navbar">
      <div className="navbar-title"> <img src="/fn_logo.svg" width={30} height={20} alt="Snacks Vending" /> Snacks Vending</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/cart">
          Cart {totalQuantity > 0 && <span className="cart-badge">{totalQuantity}</span>}
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/admin">Admin</Link>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}