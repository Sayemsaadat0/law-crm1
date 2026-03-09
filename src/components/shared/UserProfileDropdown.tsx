import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, LogOut, Settings, Shield, User, User2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface UserProfileDropdownProps {
  userName: string;
}

export default function UserProfileDropdown({
  userName,
}: UserProfileDropdownProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const profileImg = user?.image || "";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded-full p-0 flex items-center justify-center border overflow-hidden flex-shrink-0">
          {profileImg ? (
            <img src={profileImg} alt="user" className="w-full h-full object-cover" />
          ) : (
            <User2 className="h-4 w-4 sm:h-6 sm:w-6" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 py-4 sm:py-7 px-4 sm:px-6 border-border-gray rounded-xl max-w-[calc(100vw-2rem)]"
      >
        {/* User Info */}
        <DropdownMenuLabel className="flex items-center justify-between gap-2 sm:gap-3 p-0">
          <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full border border-border-gray overflow-hidden flex-shrink-0">
              {profileImg ? (
                <img src={profileImg} alt="user" className="w-full h-full object-cover" />
              ) : (
                <User2 className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
              <p className="text-lg sm:text-2xl font-semibold text-black truncate">{userName}</p>
              <p className="text-xs sm:text-base text-light-muted truncate">{user?.email || "@username"}</p>
              <p className="text-xs sm:text-sm text-primary-green font-medium capitalize">{user?.role || ""}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/dashboard/profile")}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="border border-border-gray my-3 sm:my-6" />

        {/* Menu Items */}
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer py-1.5 sm:py-2 text-sm sm:text-base"
          onClick={() => navigate("/dashboard/profile")}
        >
          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer py-1.5 sm:py-2 text-sm sm:text-base"
          onClick={() => navigate("/dashboard/profile")}
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>User Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer py-1.5 sm:py-2 text-sm sm:text-base"
          onClick={() => navigate("/dashboard/profile")}
        >
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">Security & Protection</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="border border-border-gray my-3 sm:my-6" />

        {/* Logout */}
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer py-1.5 sm:py-2 text-sm sm:text-base text-destructive focus:text-destructive focus:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
