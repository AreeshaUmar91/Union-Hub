import { useState, useRef, useEffect } from "react";
import { Signreset } from "../components/Signreset";
import { useLocation, useNavigate } from "react-router-dom";
import { Back } from "../components/Back";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = String(location?.state?.email || "").toLowerCase();
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(59); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputsRef = useRef([]);

  // Auto focus first input on load
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!email) navigate("/resetpassword", { replace: true });
  }, [email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle resend OTP
  const resendCode = async () => {
    if (!email) return;
    setIsSubmitting(true);
    setOtp(Array(6).fill(""));
    setTimeLeft(60);
    inputsRef.current[0]?.focus();
    try {
      await apiRequest("/auth/password-reset/request", {
        method: "POST",
        body: { email },
      });
    } catch (e) {
      // Toast handled in apiRequest
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle verify
  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      toast.custom((t) => <CustomToast id={t} message="Please enter complete 6-digit OTP" />);
      return;
    }

    try {
      const data = await apiRequest("/auth/password-reset/verify-otp", {
        method: "POST",
        body: { email: location.state?.email, otp: enteredOtp },
      });
      if (data?.resetToken) {
        localStorage.setItem("resetToken", data.resetToken);
      }
      navigate("/confirmpassword", {
        state: { email: location.state?.email || email, resetToken: data?.resetToken || "" },
      });
    } catch (e) {
      // Toast handled in apiRequest
    }
  };

  return (
    <Signreset centerHeading="Verify OTP" contentOffsetClassName="mt-6">
      <h4 className="text-grey text-center mb-4 font-montserrat font-semibold">
        Enter the 6-digit code sent to your email.
      </h4>

      {/* OTP Input Boxes */}
      <div className="flex justify-between w-full max-w-[512px] mx-auto gap-2 sm:gap-[10px] px-2">
        {otp.map((digit, index) => (
          <div
            key={index}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
          >
            <input
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              ref={(el) => (inputsRef.current[index] = el)}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (!value) return;

                const newOtp = [...otp];
                newOtp[index] = value;
                setOtp(newOtp);

                if (index < 5) {
                  inputsRef.current[index + 1]?.focus();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  const newOtp = [...otp];

                  if (otp[index]) {
                    // clear current digit
                    newOtp[index] = "";
                    setOtp(newOtp);
                  } else if (index > 0) {
                    // move focus back and clear previous
                    newOtp[index - 1] = "";
                    setOtp(newOtp);
                    inputsRef.current[index - 1]?.focus();
                  }
                }
              }}
              className="w-full h-full text-center font-poppins text-[16px] sm:text-[18px] leading-[24px] 
                         bg-bgcolor rounded-xl focus:outline-none text-grey"
            />

            {/* Placeholder bar */}
            {!digit && (
              <span
                className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-grey text-2xl pointer-events-none
                  ${index === 0 ? "animate-pulse" : ""}`}
              >
                -
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Timer */}
      <p className="text-red font-montserrat font-semibold text-[24px] text-center mt-6">
        00:{String(timeLeft).padStart(2, "0")}
      </p>

      {/* Resend */}
      <button
        type="button"
        onClick={resendCode}
        disabled={timeLeft > 0}
        className={`mt-4 font-montserrat text-sm font-semibold
          ${timeLeft > 0 ? "text-gray-400 cursor-not-allowed" : "text-primary cursor-pointer hover:text-primary/80"}
        `}
      >
        {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Resend OTP"}
      </button>

      {/* Verify Button */}
<button
  onClick={handleVerify}
  disabled={isSubmitting || otp.some((digit) => digit === "")}
  className={`w-full max-w-[432px] py-2 rounded-3xl font-montserrat mt-[30px] block mx-auto text-white
    ${otp.some((digit) => digit === "") 
      ? "bg-gray-400 cursor-not-allowed" 
      : "bg-primary cursor-pointer"}
  `}
>
  Verify
</button>

      <Back variant="inline" className="mx-auto" />
    </Signreset>
  );
};
