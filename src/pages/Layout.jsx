import { Navbar, Sidebar } from "../components";
import { Outlet } from "react-router";
const Layout = () => {
  return (
    <div className="w-full">
      <div className="fixed top-0 z-50 w-full">
        <Navbar />
      </div>

      <div className="flex w-full pt-6">
        {/* Sidebar */}
        <div className="bg-[#0b1018] hidden md:block md:w-[20%] lg:w-[15%] fixed left-0 top-14 h-[calc(100vh-56px)] pt-8">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="w-full md:ml-[20%] lg:ml-[15%] py-4 min-h-screen bg-background text-white mt-8">
          <div className="w-[95%] mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
