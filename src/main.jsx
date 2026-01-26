import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/Index.jsx";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";

createRoot(document.getElementById("root")).render(
  <>
    <Toaster richColors position="top-right" />
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </>
);
