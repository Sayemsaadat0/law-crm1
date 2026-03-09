/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authApi } from "@/lib/api";

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

type ChangePasswordFormType = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormType>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormType) => {
    setIsLoading(true);
    const toastId = toast.loading("Changing password...");
    
    try {
      await authApi.changePassword(data.current_password, data.password, data.password_confirmation);
      toast.success("Password changed successfully!", { id: toastId });
      form.reset();
    } catch (err: any) {
      toast.error(err.message || "Failed to change password", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="current-password" className="text-xs sm:text-sm font-medium text-gray-700">
          Current Password
        </Label>
        <Input
          id="current-password"
          type="password"
          placeholder="Enter current password"
          className="w-full h-9 sm:h-10 text-sm"
          {...form.register("current_password")}
        />
        {form.formState.errors.current_password && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.current_password.message}
          </p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password" className="text-xs sm:text-sm font-medium text-gray-700">
          New Password
        </Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter new password (min 8 characters)"
          className="w-full h-9 sm:h-10 text-sm"
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
        <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-medium text-gray-700">
          Confirm Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm new password"
          className="w-full h-9 sm:h-10 text-sm"
          {...form.register("password_confirmation")}
        />
        {form.formState.errors.password_confirmation && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.password_confirmation.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-9 sm:h-10 disabled:opacity-50"
        >
          {isLoading ? "Changing..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}

