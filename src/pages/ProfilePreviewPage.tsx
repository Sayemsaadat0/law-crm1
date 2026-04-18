"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { formatDisplayDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePreviewPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) await fetchUser();
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, fetchUser]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-green/20 border-t-primary-green" />
      </div>
    );
  }

  const memberSince = user.joining_date
    ? formatDisplayDate(user.joining_date)
    : user.created_at
      ? formatDisplayDate(user.created_at)
      : "—";

  const updatedLabel = user.updated_at
    ? formatDisplayDate(user.updated_at)
    : "—";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/dashboard/profile"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to profile settings
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-br from-primary-green/12 via-white to-emerald-50/40 px-6 pb-10 pt-8 sm:px-10 sm:pt-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left">
              <div className="relative shrink-0">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-md sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gray-100 shadow-md sm:h-32 sm:w-32">
                    <User2 className="h-14 w-14 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="mt-6 w-full sm:ml-8 sm:mt-0 sm:flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-green">
                  Public profile
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {user.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium capitalize text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                    <Briefcase className="h-3.5 w-3.5 text-primary-green" />
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-500">
                    User ID #{user.id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-green/10">
                  <Mail className="h-5 w-5 text-primary-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </p>
                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-green/10">
                  <Phone className="h-5 w-5 text-primary-green" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {user.mobile?.trim() || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-green/10">
                  <Calendar className="h-5 w-5 text-primary-green" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Member since
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {memberSince}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Last updated
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {updatedLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-5 sm:px-10">
            <p className="text-center text-xs text-gray-500">
              This is how your name, role, and contact details appear across the
              workspace. Update them anytime from{" "}
              <Link
                to="/dashboard/profile"
                className="font-medium text-primary-green underline-offset-2 hover:underline"
              >
                profile settings
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outlineBtn"
            onClick={() => navigate("/dashboard/profile")}
          >
            Edit profile
          </Button>
        </div>
      </div>
    </div>
  );
}
