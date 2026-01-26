import { Signreset } from "../components/Signreset";
import { Emailvalidation } from "../components/Emailvalidation";
import { useNavigate } from "react-router-dom";
import { Back } from "../components/Back";
import { useState } from "react";
import { apiRequest } from "../auth/api";
export const Resetpassword = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle email submit
  const handleEmailSubmit = async (values) => {
    const email = String(values?.email || "").toLowerCase();
    setIsSubmitting(true);
    try {
      await apiRequest("/auth/password-reset/request", {
        method: "POST",
        body: { email },
      });
      navigate("/otp", { state: { email } });
    } catch (e) {
      // Toast handled in apiRequest
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Signreset centerHeading="Reset Password" contentOffsetClassName="mt-14">
      <h4 className="text-grey text-center mb-4 font-montserrat font-semibold">
        Please enter your email to reset your password
      </h4>

      {/* Email Input (Formik handles validation inside) */}
      <Emailvalidation onSubmit={handleEmailSubmit}>
        {/* Continue Button inside Emailvalidation */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full max-w-[432px] bg-primary text-white py-2 rounded-3xl font-montserrat mt-[30px]"
        >
          Continue
        </button>
      </Emailvalidation>
      <Back variant="inline" className="mx-auto" />
    </Signreset>
    
  );
};
