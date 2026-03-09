import { Link, useLocation } from "react-router-dom";
import { Scale, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserProfileDropdown from "@/components/shared/UserProfileDropdown";
import { useAuthStore } from "@/store/authStore";

export function DashboardNavbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const paths = pathname.split("/").filter(Boolean); // ["dashboard", "home"]

  const page = paths[1] || "home";

  return (
    <header className="top-0 z-40 w-full">
      <div className="flex flex-col gap-2 sm:gap-3 py-2 sm:py-3 md:py-4 px-2 sm:px-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <SidebarTrigger className="-ml-1 text-slate-900 md:hidden h-8 w-8" />
            <Link
              to="/"
              className="md:hidden flex items-center gap-1.5 sm:gap-2 text-slate-900"
            >
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm font-semibold truncate">Law Firm</span>
            </Link>
            <nav className="hidden md:flex flex-col text-sm text-slate-500 capitalize">
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard/home"
                  className="hover:text-slate-900 transition-colors"
                >
                  Dashboard
                </Link>
                <span>/</span>
                <span className="font-medium text-slate-800">
                  {page}
                </span>
              </div>
              <span className="text-xs text-slate-400">{page}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 sm:h-9 sm:w-9 text-slate-600 hover:bg-slate-100"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 text-slate-600 hover:bg-slate-100"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <UserProfileDropdown userName={user?.name || "User"} />
          </div>
        </div>

        <nav className="flex md:hidden items-center text-xs sm:text-sm text-slate-500 capitalize gap-1">
          <Link
            to="/dashboard/home"
            className="hover:text-slate-900 transition-colors truncate"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800 truncate">
            {page}
          </span>
        </nav>
      </div>
    </header>
  );
}
