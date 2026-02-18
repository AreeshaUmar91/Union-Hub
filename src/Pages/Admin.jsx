import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Imagemodal } from "../components/Imagemodal";
import { useAuth } from "../auth/AuthContext";
import { apiRequest } from "../auth/api";
import { toast } from "sonner";
import { CustomToast } from "../components/CustomToast";

export const Admin = () => {
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const isDirector = auth.user?.role === "director";
  const roleTitle = auth.user?.role
    ? `${String(auth.user.role).slice(0, 1).toUpperCase()}${String(auth.user.role).slice(1)}`
    : "Admin";

  const [name, setName] = useState(() => auth.user?.name || "");
  const [email, setEmail] = useState(() => auth.user?.email || "");
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!nameTouched) setName(auth.user?.name || "");
    if (!emailTouched) setEmail(auth.user?.email || "");
  }, [auth.user, emailTouched, isAuthenticated, nameTouched]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const handleUpdate = async () => {
    if (!auth.token) return;
    if (!currentPassword) {
      toast.custom((t) => <CustomToast id={t} message="Please enter your current password" type="error" />);
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      toast.custom((t) => <CustomToast id={t} message="New password and confirm password do not match" type="error" />);
      return;
    }

    try {
      const data = await apiRequest("/director/users/account", {
        method: "PUT",
        token: auth.token,
        body: {
          name,
          email,
          oldPassword: currentPassword,
          newPassword: newPassword || undefined,
        },
      });
      setNameTouched(false);
      setEmailTouched(false);
      setName(data.user?.name || "");
      setEmail(data.user?.email || "");
      auth.updateSession({ token: data.token, user: data.user });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowSuccessModal(true);
    } catch (e) {
      toast.custom((t) => <CustomToast id={t} message={e?.message || "Failed to update details"} type="error" />);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white rounded-3xl h-full p-6 font-montserrat">
      {/* Heading */}
      <div className="border-b pb-3">
        <h2 className="text-black font-semibold text-[20px]">Account Details</h2>
      </div>

      {/* Name & Email Container */}
      <div
        className="bg-white rounded-[16px] p-6 flex flex-col gap-4 shadow-md"
        style={{ boxShadow: "0px 0px 4px 0px #00000040" }}
      >
        {/* Name */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="w-[175px] font-semibold text-grey">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setNameTouched(true);
              setName(e.target.value);
            }}
            placeholder="John Doe"
            autoComplete="off"
            className="flex-1 bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none text-black placeholder-gray-500"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="w-[175px] font-semibold text-grey">Email Address</label>
          <input
            type="email"
            value={email}
            disabled={!isDirector}
            onChange={(e) => {
              setEmailTouched(true);
              setEmail(e.target.value);
            }}
            placeholder="johndoe@gmail.com"
            autoComplete="off"
            className={`flex-1 bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none text-black placeholder-gray-500 ${!isDirector ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
      </div>

      {/* Password Container */}
      <div
        className="bg-white rounded-[16px] p-6 flex flex-col gap-4 shadow-md"
        style={{ boxShadow: "0px 0px 4px 0px #00000040" }}
      >
        {/* Current Password */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="w-[175px] font-semibold text-grey">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter Current Password"
            autoComplete="off"
            className="flex-1 bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none text-black placeholder-gray-500"
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="w-[175px] font-semibold text-grey">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter New Password"
            autoComplete="off"
            className="flex-1 bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none text-black placeholder-gray-500"
          />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <label className="w-[175px] font-semibold text-grey">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            autoComplete="off"
            className="flex-1 bg-[#F1F1F1] rounded-lg px-3 py-2 focus:outline-none text-black placeholder-gray-500"
          />
        </div>

        {/* Update Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleUpdate}
            className="bg-primary text-white font-semibold px-12 py-2 rounded-3xl"
          >
            Update Details
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <Imagemodal
          heading="Details Updated"
          subheading="Your details have been updated."
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
};
