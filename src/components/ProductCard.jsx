import React from "react";
import "./ProductCard.css";
import noImg from "../no-image.png";

const ProductCard = ({ product, addToCart, handleBuy }) => {
  const isOutOfStock = product.quantity === 0;
  const backendUrl = process.env.REACT_APP_API_URL; // Backend base URL

  return (
    <div className="product-card" onClick={handleBuy}>
      <div className="product-id">ID: {product.display_id}</div>
      <img
        className="product-image"
        src={product.image ? `${backendUrl}${product.image}?t=${Date.now()}` : noImg}
        alt={product.name}
        onError={(e) => {
          console.error(`Image failed to load: ${product.image}`);
          e.target.src = noImg;
        }}
      />
      <h3 className="product-name">{product.name}</h3>
      <p className="product-price">৳{product.price.toFixed(2)}</p>
      <p className={`product-stock ${isOutOfStock ? "out" : "in"}`}>
        {isOutOfStock ? "Out of Stock" : `Stock: ${product.quantity}`}
      </p>
      {product.group_id && (
        <p className="product-group">
          Group: {product.group_id} 
          {product.product_ids && ` (Springs: ${product.product_ids.join(', ')})`}
        </p>
      )}
      {/* <div className="product-buttons">
        <button
          className="button-slot button-buy"
          onClick={handleBuy}
          disabled={isOutOfStock}
        >
          Buy Now
        </button>
      </div> */}
    </div>
  );
};

export default ProductCard;