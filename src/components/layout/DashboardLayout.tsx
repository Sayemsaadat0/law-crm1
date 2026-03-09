import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarNavigation } from "@/components/core/SidebarNavigation";
import { DashboardNavbar } from "@/components/core/DashboardNavbar";
import TopLoader from "../shared/TopLoader";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <TopLoader />
      <SidebarNavigation />
      <SidebarInset className="bg-linear-to-br py-5  pr-7 from-gray-50 to-gray-100">
        <DashboardNavbar />
        <div className="flex flex-1 flex-col py-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
