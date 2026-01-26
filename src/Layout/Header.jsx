import React, { useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { mediaData } from "../utils/mediaData";
import { useAuth } from "../auth/AuthContext";
export const Header = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // <-- add this
  const auth = useAuth();
  const nameLabel = auth.user?.name || auth.user?.email || "User";
  const roleTitle = auth.user?.role
    ? `${String(auth.user.role).slice(0, 1).toUpperCase()}${String(auth.user.role).slice(1)}`
    : "Admin";
  const canOpenAdmin = true;

  const routeTitles = {
    "/layout/dashboard": "Dashboard",
    "/layout/meetings": "Meetings",
    "/layout/benefits": "Benefits",
    "/layout/employees": "Employees",
    "/layout/contracts": "Contracts",
    "/layout/news": "News and Updates",
    "/layout/vote": "Vote",
    "/layout/notifications": "Notifications",
    "/layout/officials": "Officials",
    "/layout/faq": "Manage FAQ's",
    "/layout/bell": "Notifications",
    "/layout/admin":"Admin"
  };

  const title = location.pathname === "/layout/admin" ? roleTitle : routeTitles[location.pathname] || "";

  return (
    <>
      <div className="flex flex-col bg-white w-full shadow-md">
        <div className="flex justify-between items-center h-[80px] px-5">
          <div className="flex items-center gap-3">
            {auth.isAuthenticated ? (
            <button
              className="lg:hidden flex items-center justify-center text-grey"
              onClick={canOpenAdmin ? () => navigate("/layout/admin") : undefined}
              style={{
                height: "40px",
                borderWidth: "1px",
                borderRadius: "8px",
                paddingTop: "8px",
                paddingRight: "16px",
                paddingBottom: "8px",
                paddingLeft: "16px",
                gap: "4px",
                transform: "rotate(0deg)",
                borderStyle: "solid",
                borderColor: "grey",
                fontFamily: "Rubik",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                letterSpacing: "0.25px",
                minWidth: "78px",
                cursor: canOpenAdmin ? "pointer" : "default",
                opacity: canOpenAdmin ? 1 : 0.8,
              }}
            >
              {nameLabel}
            </button>
          ) : null}
            <h1 className="hidden lg:block text-black font-montserrat font-semibold text-[24px]">{title}</h1>
          </div>

          <div className="flex items-center gap-8">
          <img
        src={mediaData.Notifications}
        alt="Notifications"
        className="hidden lg:block w-6 h-6 cursor-pointer"
        onClick={() => navigate("/layout/bell")}
      />
          {auth.isAuthenticated ? (
            <button
              className="hidden lg:flex items-center justify-center text-grey"
              onClick={canOpenAdmin ? () => navigate("/layout/admin") : undefined}
              style={{
                height: "40px",
                borderWidth: "1px",
                borderRadius: "8px",
                paddingTop: "8px",
                paddingRight: "16px",
                paddingBottom: "8px",
                paddingLeft: "16px",
                gap: "4px",
                transform: "rotate(0deg)",
                borderStyle: "solid",
                borderColor: "grey",
                fontFamily: "Rubik",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                letterSpacing: "0.25px",
                minWidth: "78px",
                cursor: canOpenAdmin ? "pointer" : "default",
                opacity: canOpenAdmin ? 1 : 0.8,
              }}
            >
              {nameLabel}
            </button>
          ) : null}

        </div>
      </div>

      <div className="lg:hidden px-5 pb-3 flex items-center justify-between">
        <h1 className="text-black font-montserrat font-semibold text-[24px]">{title}</h1>
        <div className="flex items-center gap-4">
          <img
            src={mediaData.Notifications}
            alt="Notifications"
            className="w-6 h-6 cursor-pointer"
            onClick={() => navigate("/layout/bell")}
          />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={28} />
          </button>
        </div>
      </div>
    </div>

      {isSidebarOpen && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
    </>
  );
};
