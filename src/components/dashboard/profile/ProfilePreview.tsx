"use client";

import { Link } from "react-router-dom";
import { User2, Calendar, Eye } from "lucide-react";
import type { User } from "@/types/user.types";
import { formatDisplayDate } from "@/lib/utils";

interface ProfilePreviewProps {
  user: User;
}

export default function ProfilePreview({ user }: ProfilePreviewProps) {
  return (
    <div className="space-y-6">
      {/* Profile Picture with Online Badge - Fiverr Style */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User2 className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Name with Edit Icon - Fiverr Style */}
      <div className="text-center space-y-2">
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
            {user.role}
          </span>
        </div>
        
        {/* Username/Email - Fiverr Style */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      </div>

      <Link
        to="/dashboard/profile/preview"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-green px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-primary-green/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-green"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        Preview profile
      </Link>

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
                ? formatDisplayDate(user.joining_date)
                : user.created_at 
                ? formatDisplayDate(user.created_at)
                : "N/A"}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

