"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { authApi, api } from "@/lib/api";
import type { User } from "@/types/user.types";
import { User2, CalendarIcon } from "lucide-react";
import { cn, formatDisplayDate, formatIsoDateInput } from "@/lib/utils";

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  joining_date: z.date().optional().nullable(),
});

type EditProfileFormType = z.infer<typeof editProfileSchema>;

interface EditProfileFormProps {
  user: User;
  onUpdate?: () => void;
}

export default function EditProfileForm({ user, onUpdate }: EditProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EditProfileFormType>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      joining_date: user.joining_date ? new Date(user.joining_date) : null,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        e.target.value = ''; // Reset input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EditProfileFormType) => {
    setIsLoading(true);
    const toastId = toast.loading("Updating profile...");
    
    try {
      const file = fileInputRef.current?.files?.[0];
      
      const updateData: any = {
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
      };

      if (data.joining_date) {
        updateData.joining_date = formatIsoDateInput(data.joining_date);
      }

      if (file) {
        // Validate file before upload
        if (!file.type.startsWith('image/')) {
          throw new Error("Please select a valid image file");
        }
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("Image size must be less than 2MB");
        }

        // Update with image
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        if (data.mobile) {
          formData.append("mobile", data.mobile);
        }
        if (data.joining_date) {
          formData.append("joining_date", formatIsoDateInput(data.joining_date));
        }
        // Append file with proper name
        formData.append("image", file, file.name);
        
        await api.putFormData<any>("/user", formData);
        
        // Reset file input after successful upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Update without image
        await authApi.updateUser(updateData);
      }

      toast.success("Profile updated successfully!", { id: toastId });
      if (onUpdate) {
        onUpdate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Image Upload */}
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={user.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
              <User2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          id="image-upload"
        />
        <Label
          htmlFor="image-upload"
          className="text-xs sm:text-sm text-primary-green cursor-pointer hover:underline"
        >
          Change Photo
        </Label>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="edit-name" className="text-xs sm:text-sm font-medium text-gray-700">
          Name
        </Label>
        <Input
          id="edit-name"
          placeholder="Enter your name"
          className="w-full h-9 sm:h-10 text-sm"
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
        <Label htmlFor="edit-email" className="text-xs sm:text-sm font-medium text-gray-700">
          Email
        </Label>
        <Input
          id="edit-email"
          type="email"
          placeholder="Enter email address"
          className="w-full h-9 sm:h-10 text-sm"
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
        <Label htmlFor="edit-mobile" className="text-xs sm:text-sm font-medium text-gray-700">
          Mobile
        </Label>
        <Input
          id="edit-mobile"
          placeholder="Enter mobile number (optional)"
          className="w-full h-9 sm:h-10 text-sm"
          {...form.register("mobile")}
        />
        {form.formState.errors.mobile && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.mobile.message}
          </p>
        )}
      </div>

      {/* Joining Date */}
      <div className="space-y-2">
        <Label htmlFor="edit-joining-date" className="text-xs sm:text-sm font-medium text-gray-700">
          Joining Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              id="edit-joining-date"
              className={cn(
                "w-full h-9 sm:h-10 px-3 text-sm rounded-md border border-gray-300 bg-transparent",
                "flex items-center justify-start text-left font-normal",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "hover:bg-gray-50 transition-colors",
                form.watch("joining_date") ? "text-gray-900" : "text-gray-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">
                {form.watch("joining_date") ? (
                  formatDisplayDate(form.watch("joining_date")!)
                ) : (
                  "Pick a date (optional)"
                )}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 bg-white border border-gray-200 shadow-xl z-50 rounded-lg" 
            align="start"
          >
            <Calendar
              mode="single"
              selected={form.watch("joining_date") || undefined}
              onSelect={(date) => form.setValue("joining_date", date || null)}
              initialFocus
              captionLayout="dropdown"
              fromYear={1900}
              toYear={new Date().getFullYear() + 10}
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.joining_date && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.joining_date.message}
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
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </form>
  );
}

