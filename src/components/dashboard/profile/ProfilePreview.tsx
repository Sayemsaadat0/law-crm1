"use client";

import { User2, Calendar } from "lucide-react";
import type { User } from "@/types/user.types";

interface ProfilePreviewProps {
  user: User;
}

export default function ProfilePreview({ user }: ProfilePreviewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture with Online Badge - Fiverr Style */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User2 className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {/* Online Badge - Fiverr Style */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#1dbf73] rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Name with Edit Icon - Fiverr Style */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
        </div>
        
        {/* Username/Email - Fiverr Style */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      </div>

      {/* Preview Profile Button - Fiverr Style */}
      <button className="w-full py-2.5 px-4 bg-[#d8f275] hover:bg-[#19a463] text-white text-sm font-medium rounded-md transition-colors">
        Preview Profile
      </button>

      {/* User Details - Fiverr Style */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* From/Location */}

        {/* Member Since */}
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Member since</div>
            <div className="text-sm text-gray-900">
              {user.joining_date 
                ? formatDate(user.joining_date)
                : user.created_at 
                ? formatDate(user.created_at)
                : "N/A"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

