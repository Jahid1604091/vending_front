import React from "react";
import "./ProductCard.css";

const ProductCard = ({ product, addToCart, handleBuy }) => {
  const isOutOfStock = product.quantity === 0;
  const backendUrl = "http://localhost:5001"; // Backend base URL

  return (
    <div className="product-card">
      <img
        className="product-image"
        src={product.image ? `${backendUrl}${product.image}?t=${Date.now()}` : "/images/fallback.jpg"}
        alt={product.name}
        onError={(e) => {
          console.error(`Image failed to load: ${product.image}`);
          e.target.src = "/images/fallback.jpg";
        }}
      />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">৳{product.price.toFixed(2)}</p>
      <p className={`product-stock ${isOutOfStock ? "out" : "in"}`}>
        {isOutOfStock ? "Out of Stock" : `Stock: ${product.quantity}`}
      </p>
      <div className="product-buttons">
        <button
          className="button-slot button-buy"
          onClick={handleBuy}
          disabled={isOutOfStock}
        >
          Buy Now
        </button>
        <button
          className="button-slot button-cart"
          onClick={addToCart}
          disabled={isOutOfStock}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;