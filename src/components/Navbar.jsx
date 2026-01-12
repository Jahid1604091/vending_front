import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
// import logo from "../fn_logo.svg";
import logo from "../logo.jpeg";
export default function Navbar({ totalQuantity, isAuthenticated, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-title">
        <img src={logo} alt="Varendra University Vending Service" />
        <div className="navbar-text">
          <h3>Varendra University Vending Service</h3>
          <p>Powered by - FactoryNext</p>
        </div>
      </Link>
    </nav>

  );
}