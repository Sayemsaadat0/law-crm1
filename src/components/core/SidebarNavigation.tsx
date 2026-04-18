import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  User,
  Scale,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Home",
    url: "/dashboard/home",
    icon: LayoutDashboard,
  },
  {
    title: "Cases",
    url: "/dashboard/cases",
    icon: Briefcase,
  },
  {
    title: "Members",
    url: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Courts",
    url: "/dashboard/courts",
    icon: Scale,
  },
];

export function SidebarNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    try {
      await logout();
      toast.success("Logged out successfully", { id: toastId });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to logout", { id: toastId });
    }
  };

  return (
    <Sidebar className="m-2 rounded-xl max-w-[250px] bg-[#1F2937] border border-gray-700/50 shadow-xl max-h-[calc(100vh-16px)] flex flex-col">
      <Link to="/" className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-green shadow-lg">
            <Scale className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">H &amp; H Company Court Diary</h1>
            <p className="text-xs text-gray-400">Case Management</p>
          </div>
        </div>
      </Link>
      <SidebarContent className="px-3 py-4 flex-1">
        <SidebarMenu className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Cases & Profile: match nested routes (e.g. /cases/:id, /profile/preview)
            const isActive =
              item.title === "Cases" || item.title === "Profile"
                ? location.pathname.startsWith(item.url)
                : location.pathname === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-11 px-3 rounded-lg group transition-all duration-200",
                    isActive
                      ? "bg-primary-green text-black shadow-md"
                      : "text-gray-300 hover:bg-primary-green hover:text-black"
                  )}
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <Icon
                      strokeWidth={2.5}
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-black" : "text-gray-500"
                      )}
                    />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      
      {/* User Info Card */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="w-full min-h-[40px] bg-gray-800/50 rounded-lg p-3 flex items-center gap-3">
          {/* User Thumbnail */}
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center flex-shrink-0">
              <span className="text-black font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          )}
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.email || ""}
            </p>
            <p className="text-xs text-primary-green font-medium mt-0.5 capitalize">
              {user?.role || ""}
            </p>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Sidebar>
  );
}
