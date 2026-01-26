import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const Back = ({ variant = "fixed", className = "" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/login");
  };

  if (variant !== "fixed") {
    return (
      <button
        onClick={handleBack}
        className={`mt-4 text-grey font-montserrat font-semibold inline-flex items-center gap-2 ${className}`.trim()}
      >
        <ArrowLeft size={18} />
        <span>Login</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleBack}
      className={className}
      style={{
        position: "fixed",
        bottom: "20px", // distance from bottom
        left: "20px",   // distance from left
        fontFamily: "Montserrat",
        fontWeight: 600, // SemiBold
        fontStyle: "normal",
        fontSize: "16px",
        lineHeight: "100%",
        letterSpacing: "0%",
        color: "#9E9E9E", // test-grey
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 12px",
      }}
    >
      <span className="inline-flex items-center gap-2">
        <ArrowLeft size={18} />
        <span>Back</span>
      </span>
    </button>
  );
};
