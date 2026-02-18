import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Index.jsx";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";

function NetworkGuard({ children }) {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    const handleError = () => setOffline(true);
    const handleOk = () => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setOffline(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("unionhub_network_error", handleError);
      window.addEventListener("unionhub_network_ok", handleOk);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("unionhub_network_error", handleError);
        window.removeEventListener("unionhub_network_ok", handleOk);
      }
    };
  }, []);

  return (
    <>
      {children}
      {offline && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-lg px-8 py-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#1E6B78] animate-spin" />
            <h2 className="font-montserrat font-semibold text-[18px] text-black">No Internet</h2>
            <p className="font-montserrat text-[14px] text-grey text-center">
              Please check your connection...
            </p>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <>
    <Toaster richColors position="top-right" />
    <AuthProvider>
      <NetworkGuard>
        <RouterProvider router={router} />
      </NetworkGuard>
    </AuthProvider>
  </>
);
