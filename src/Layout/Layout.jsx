import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      <div className="hidden lg:flex fixed top-0 left-0 w-[215px] h-screen">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen lg:ml-[215px]">
        <Header />
        <main className="flex-1 bg-bgcolor p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
