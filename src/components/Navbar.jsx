import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logo from "../fn_logo.svg";
export default function Navbar({ totalQuantity, isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout(); 
    navigate("/login"); 
  };

  return (
    <nav className="navbar">
      <Link to='/' className="navbar-title">
         <img src={logo} alt="Snacks Vending" /> &nbsp;
          <h3>Snacks Vending</h3>
      </Link>
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