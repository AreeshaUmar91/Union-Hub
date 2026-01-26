import React, { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

export const CustomToast = ({ id, message, type = "error", duration = 4000 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => toast.dismiss(id), 300);
  };

  const isError = type === "error";
  const mainColor = isError ? "#FF3B30" : "#34C759";
  const bgColor = isError ? "#FFE5E5" : "#E5F9E7";

  return (
    <div
      className={`
        relative flex flex-col w-full max-w-[400px] bg-white rounded-lg shadow-lg overflow-hidden pointer-events-auto
        transition-all duration-300 ease-in-out transform
        ${visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}
      `}
      style={{
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div className="flex items-start p-4 gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: mainColor }}
          >
            {isError ? (
              <span className="text-white text-sm font-bold">!</span>
            ) : (
              <Check size={14} className="text-white" strokeWidth={3} />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          <p className="text-[#1C1C1E] text-[14px] leading-tight font-medium">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div
        className="absolute bottom-0 left-0 h-[4px] w-full"
        style={{ backgroundColor: bgColor }}
      >
        <div
          className="h-full"
          style={{
            width: "100%",
            backgroundColor: mainColor,
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
