"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";

export const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    title: "System Notification",
    message: "To get all MyGenie features complete your profile 100%!",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    title: "System Notification",
    message: "To get all MyGenie features complete your profile 100%!",
    timestamp: "30m ago",
    read: false,
  },
  {
    id: "3",
    title: "Urgent: Genie is on the way!",
    message: "Daniel is on the way to your location. Estimate time 2:22AM",
    timestamp: "2 hours ago",
    read: true,
  },
];

export default function NotificationDropdown() {
  const unreadCount = 50;
  const notifications = SAMPLE_NOTIFICATIONS;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative cursor-pointer">
          <Bell className="size-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-md
       border-border-gray p-0"
      >
        {/* Header */}
        <h3 className="text-2xl font-semibold text-rich-black p-6 border-b border-border-gray">
          Notifications
        </h3>

        {/* Tabs */}
        <div className="px-4 border-b border-border-gray flex gap-4 lg:gap-8 text-lg">
          <button className="font-medium text-rich-black border-b-2 cursor-pointer border-primary py-2">
            All
          </button>
          <button className="font-medium text-rich-black cursor-pointer border-primary py-2 flex-1">
            Unread ({unreadCount})
          </button>
          <button className="font-medium text-rich-black cursor-pointer border-primary py-2">
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-5 py-4 border-b border-border-gray cursor-pointer ${
                  !notification.read ? "bg-primary-foreground" : ""
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={"/placeholder.png"}
                    width={44}
                    height={44}
                    alt=""
                    className="rounded-full border border-border-gray shrink-0 size-11"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] text-lg">
                      {notification.title}
                    </p>
                    <p className="text-sm text-[#4a4a4a] font-normal mt-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[16px] text-[#908f90] font-medium mt-2">
                      {notification.timestamp}
                    </p>
                  </div>
                  {/* {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-2"></div>
                  )} */}
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
