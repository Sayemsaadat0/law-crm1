"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Search, Loader2, User2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usersApi, type UserListItem } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// --------------------------
// FORM SCHEMA
// --------------------------
const memberSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    mobile: z.string().optional(),
    role: z.enum(["admin", "owner", "lawyer"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type MemberFormType = z.infer<typeof memberSchema>;

// --------------------------
// COMPONENT
// --------------------------
function MembersContent() {
  const { user: currentUser } = useAuthStore();
  const [members, setMembers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const canManageMembers =
    currentUser?.role === "admin" || currentUser?.role === "owner";

  const form = useForm<MemberFormType>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      mobile: "",
      role: "lawyer", // Default role
    },
  });

  // --------------------------
  // FETCH MEMBERS
  // --------------------------
  const fetchMembers = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll({
        search: searchQuery || undefined,
        per_page: 15,
        page,
      });

      if (response.data) {
        setMembers(response.data.data || []);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 15,
          total: response.data.total || 0,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch members");
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // --------------------------
  // EFFECTS
  // --------------------------
  useEffect(() => {
    fetchMembers(currentPage);
  }, [currentPage, fetchMembers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --------------------------
  // SUBMIT HANDLER (Create Member)
  // --------------------------
  const onSubmit = async (data: MemberFormType) => {
    let toastId: string | number | undefined;
    try {
      setIsSubmitting(true);
      toastId = toast.loading("Creating member...");

      await usersApi.create({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.confirmPassword,
        mobile: data.mobile || undefined,
        role: data.role || "lawyer",
      });

      if (toastId !== undefined) {
        toast.success("Member created successfully!", { id: toastId });
      } else {
        toast.success("Member created successfully!");
      }
      form.reset();
      await fetchMembers(currentPage);
    } catch (error: any) {
      if (toastId !== undefined) {
        toast.error(error.message || "Failed to create member", { id: toastId });
      } else {
        toast.error(error.message || "Failed to create member");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------
  // DELETE HANDLER
  // --------------------------
  const handleDelete = async (member: UserListItem) => {
    if (!confirm(`Are you sure you want to delete "${member.name}"?`)) {
      return;
    }

    // Prevent deleting own account
    if (currentUser?.id === member.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    try {
      const toastId = toast.loading("Deleting member...");
      await usersApi.delete(member.id);
      toast.success("Member deleted successfully!", { id: toastId });
      await fetchMembers(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete member");
    }
  };

  // Get role badge style
  const getRoleStyle = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "lawyer" || roleLower === "lawyers") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    } else if (roleLower === "admin") {
      return "bg-purple-100 text-purple-800 border-purple-200";
    } else if (roleLower === "owner") {
      return "bg-green-100 text-green-800 border-green-200";
    } else {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "lawyer") return "Lawyer";
    if (roleLower === "admin") return "Admin";
    if (roleLower === "owner") return "Owner";
    return role;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
        {currentUser?.role === "admin" && (
          <p className="text-sm text-gray-500">Showing all team members</p>
        )}
        {currentUser?.role === "owner" && (
          <p className="text-sm text-gray-500">Showing lawyers and owners</p>
        )}
        {currentUser?.role === "lawyer" && (
          <p className="text-sm text-gray-500">Showing lawyers only</p>
        )}
      </div>

      <div className={`grid grid-cols-8 gap-5`}>
        {canManageMembers && (
          <div className="col-span-2 bg-white p-6 shadow-sm rounded-xl border border-gray-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Add New Member</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
            </div>
            
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="member-name" className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <Input
                  id="member-name"
                  placeholder="Enter member name"
                  className="w-full h-10"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="member-email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="Enter email address"
                  className="w-full h-10"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <Label htmlFor="member-mobile" className="text-sm font-medium text-gray-700">
                  Mobile (Optional)
                </Label>
                <Input
                  id="member-mobile"
                  placeholder="Enter mobile number"
                  className="w-full h-10"
                  {...form.register("mobile")}
                />
                {form.formState.errors.mobile && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.mobile.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="member-password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="member-password"
                  type="password"
                  placeholder="Enter password"
                  className="w-full h-10"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="member-confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <Input
                  id="member-confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  className="w-full h-10"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="member-role" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <select
                  id="member-role"
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  {...form.register("role")}
                >
                  <option value="lawyer">Lawyer</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
                {form.formState.errors.role && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Member"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Member Table */}
        <div className={canManageMembers ? "col-span-6" : "col-span-8"}>
          {!canManageMembers && (
            <div className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              View-only access: you see other lawyers in the directory. Adding or removing members is
              limited to admins and owners.
            </div>
          )}
          {/* Search */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search members by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border shadow-sm">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-green" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary-green border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Email & Phone
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Role
                      </th>
                      {canManageMembers && (
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-black">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {members.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canManageMembers ? 4 : 3}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          No members found
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User2 className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                              <p className="text-xs font-medium">{member.name}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-medium">{member.email}</p>
                            {member.mobile && (
                              <p className="text-xs text-muted-foreground">{member.mobile}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleStyle(
                                member.role
                              )}`}
                            >
                              {getRoleDisplayName(member.role)}
                            </span>
                          </td>
                          {canManageMembers && (
                            <td className="px-3 py-2.5">
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(member)}
                                  disabled={currentUser?.id === member.id}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={currentUser?.id === member.id ? "Cannot delete your own account" : "Delete member"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outlineBtn"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlineBtn"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={pagination.current_page === pagination.last_page || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Members() {
  return <MembersContent />;
}
