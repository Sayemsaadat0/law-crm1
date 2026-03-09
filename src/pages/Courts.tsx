"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit2, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { courtsApi, type Court } from "@/lib/api";

// --------------------------
// FORM SCHEMA
// --------------------------
const courtSchema = z.object({
  name: z.string().min(1, "Court name is required"),
  address: z.string().min(1, "Court address is required"),
  status: z.boolean(),
});

type CourtFormType = z.infer<typeof courtSchema>;

// --------------------------
// COMPONENT
// --------------------------
export default function CourtCrud() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });


  const form = useForm<CourtFormType>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      name: "",
      address: "",
      status: true, // Default to Active
    },
  });

  // --------------------------
  // FETCH COURTS
  // --------------------------
  const fetchCourts = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await courtsApi.getAll({
        search: searchQuery || undefined,
        status: statusFilter !== null ? statusFilter : undefined,
        per_page: 15,
        page,
      });

      if (response.data) {
        setCourts(response.data.data || []);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 15,
          total: response.data.total || 0,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch courts");
      setCourts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // --------------------------
  // EFFECTS
  // --------------------------
  useEffect(() => {
    fetchCourts(currentPage);
  }, [currentPage, fetchCourts]);

  // Debounce search - reset to page 1 when search/filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  // --------------------------
  // SUBMIT HANDLER (Create/Update)
  // --------------------------
  const onSubmit = async (data: CourtFormType) => {
    try {
      setIsSubmitting(true);
      const toastId = toast.loading(editingCourt ? "Updating court..." : "Creating court...");

      if (editingCourt) {
        // Update existing court
        await courtsApi.update(editingCourt.id, {
          name: data.name,
          address: data.address,
          status: data.status,
        });
        toast.success("Court updated successfully!", { id: toastId });
      } else {
        // Create new court
        await courtsApi.create({
          name: data.name,
          address: data.address,
          status: data.status,
        });
        toast.success("Court created successfully!", { id: toastId });
      }

      form.reset();
      setEditingCourt(null);
      await fetchCourts(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------
  // DELETE HANDLER
  // --------------------------
  const handleDelete = async (court: Court) => {
    if (!confirm(`Are you sure you want to delete "${court.name}"?`)) {
      return;
    }

    try {
      const toastId = toast.loading("Deleting court...");
      await courtsApi.delete(court.id);
      toast.success("Court deleted successfully!", { id: toastId });
      await fetchCourts(currentPage);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete court");
    }
  };

  // --------------------------
  // EDIT HANDLER
  // --------------------------
  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    form.reset({
      name: court.name,
      address: court.address,
      status: court.status,
    });
  };

  // --------------------------
  // CANCEL EDIT
  // --------------------------
  const handleCancelEdit = () => {
    setEditingCourt(null);
    form.reset({
      name: "",
      address: "",
      status: true,
    });
  };

  // Get status badge style
  const getStatusStyle = (status: boolean) => {
    if (status) {
      return "bg-primary/10 text-primary border-primary/20";
    } else {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: boolean) => {
    return status ? "Active" : "Inactive";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Court Management</h1>
      </div>

      <div className="grid grid-cols-8 gap-5">
        {/* Form Section */}
        <div className="col-span-2 bg-white p-6 shadow-sm rounded-xl border border-gray-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCourt ? "Edit Court" : "Add New Court"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editingCourt ? "Update the court details" : "Fill in the details below"}
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="court-name" className="text-sm font-medium text-gray-700">
                Court Name
              </Label>
              <Input
                id="court-name"
                placeholder="Enter court name"
                className="w-full h-10"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="court-address" className="text-sm font-medium text-gray-700">
                Court Address
              </Label>
              <Input
                id="court-address"
                placeholder="Enter court address"
                className="w-full h-10"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.address.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div className="flex items-center space-x-3 pt-1">
                <Checkbox
                  id="court-status"
                  checked={form.watch("status")}
                  onCheckedChange={(checked: boolean) => {
                    form.setValue("status", checked === true);
                  }}
                  className="w-5 h-5 data-[state=checked]:bg-primary-green data-[state=checked]:border-primary-green data-[state=checked]:text-gray-900"
                />
                <Label
                  htmlFor="court-status"
                  className="text-sm font-normal cursor-pointer text-gray-700"
                >
                  Active
                </Label>
              </div>
              {form.formState.errors.status && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-2">
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingCourt ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingCourt ? "Update Court" : "Create Court"
                )}
              </Button>
              {editingCourt && (
                <Button
                  type="button"
                  variant="outlineBtn"
                  onClick={handleCancelEdit}
                  className="w-full h-10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Court Table */}
        <div className="col-span-6 space-y-4">
          {/* Search and Filter */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search courts by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === null ? "primarybtn" : "outlineBtn"}
                  onClick={() => setStatusFilter(null)}
                  className="h-10"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === true ? "primarybtn" : "outlineBtn"}
                  onClick={() => setStatusFilter(true)}
                  className="h-10"
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === false ? "primarybtn" : "outlineBtn"}
                  onClick={() => setStatusFilter(false)}
                  className="h-10"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
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
                        SL
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Court Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Address
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-black">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courts.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          No courts found
                        </td>
                      </tr>
                    ) : (
                      courts.map((court, index) => (
                        <tr
                          key={court.id}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              {(pagination.current_page - 1) * pagination.per_page + index + 1}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-medium">{court.name}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-xs text-muted-foreground">
                              {court.address}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(
                                court.status
                              )}`}
                            >
                              {getStatusText(court.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(court)}
                                className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                title="Edit court"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(court)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                title="Delete court"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
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
