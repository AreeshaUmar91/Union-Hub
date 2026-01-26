import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { mediaData } from "../utils/mediaData"; // adjust path if needed

export const Passwordvalidation = ({
  value,
  onChange,
  label = "Password",
  placeholder = "Enter password",
  showForgot = false,
  onForgotClick,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col items-start mb-4 w-full max-w-[432px]">
      <h2 className="text-lg mb-3 mt-3 font-poppins text-inputlabel">{label}</h2>
      <div className="relative w-full">
        {/* Lock icon from mediaData */}
        <img
          src={mediaData.Password}
          alt="Lock Icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
        />

        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full h-[48px] pl-10 pr-10 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-bgcolor
                     font-nunito text-[16px] leading-[24px] text-gray-700 placeholder-gray-400"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Forgot Password */}
      {showForgot && (
        <div className="w-full flex justify-end mt-2">
          <button
            type="button"
            onClick={onForgotClick}
            className="text-red text-md"
          >
            Forgot Password?
          </button>
        </div>
      )}
    </div>
  );
};
