import { Signreset } from "../components/Signreset"; 
import { Passwordvalidation } from "../components/Passwordvalidation";
import { useState, useEffect } from "react";
import { Imagemodal } from "../components/Imagemodal"; 
import { useLocation, useNavigate } from "react-router-dom";
import { Back } from "../components/Back";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const Confirmpassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = (() => {
    const fromState = location?.state?.resetToken || "";
    if (fromState) return String(fromState);
    const fromStorage = localStorage.getItem("resetToken") || "";
    return String(fromStorage);
  })();

  // Handle Update click
  const handleUpdateClick = async () => {
    if (!resetToken) {
      navigate("/resetpassword", { replace: true });
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.custom((t) => <CustomToast id={t} message="Both fields are required." />);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.custom((t) => <CustomToast id={t} message="Passwords do not match." />);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/auth/password-reset/reset", {
        method: "POST",
        body: { resetToken, newPassword },
      });
      setIsModalOpen(true);
    } catch (e) {
      // Toast handled in apiRequest
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-close modal and navigate after 2 seconds
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
        localStorage.removeItem("resetToken");
        navigate("/login");
      }, 2000); // 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isModalOpen, navigate]);

  return (
    <Signreset centerHeading="New Password" contentOffsetClassName="mt-4">
      <h4 className="text-grey text-center mb-2 font-montserrat font-semibold">
        Please enter and confirm your new password to continue.
      </h4>

      <Passwordvalidation
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        label="New Password"
        placeholder="Enter new password"
      />

      <Passwordvalidation
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        label="Confirm Password"
        placeholder="Confirm password"
      />

      {/* Update Button */}
      <button
        className={`w-full max-w-[422px] py-2 rounded-3xl font-montserrat mt-3 block mx-auto ${
          newPassword && confirmPassword
            ? "bg-primary text-white cursor-pointer"
            : "bg-primary text-white cursor-not-allowed"
        }`}
        onClick={handleUpdateClick}
        disabled={isSubmitting || !newPassword || !confirmPassword}
      >
        Update
      </button>

      {/* Image Modal */}
      {isModalOpen && (
        <Imagemodal
          heading="Password Updated"
          subheading="Your password has been successfully updated."
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <Back variant="inline" className="mx-auto" />
    </Signreset>
  );
};
