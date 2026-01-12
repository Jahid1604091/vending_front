import React from "react";
import "./ProductCard.css";
import noImg from "../no-image.png";

const ProductCard = ({ product, addToCart, handleBuy }) => {
  const isOutOfStock = product.quantity === 0;
  const backendUrl = process.env.REACT_APP_API_URL; // Backend base URL

  if(isOutOfStock){
    return (
    <div className="product-card disabled" aria-disabled='true'>
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
    </div>
  );
  }
  return (
    <div className="product-card" onClick={handleBuy}>
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
    </div>
  );
};

export default ProductCard;