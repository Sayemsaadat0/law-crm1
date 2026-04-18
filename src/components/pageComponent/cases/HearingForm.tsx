"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { caseHearingsApi } from "@/lib/api";

const hearingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  serial_no: z.string().min(1, "Serial number is required"),
  date: z.string().min(1, "Date is required"),
  note: z.string().min(1, "Note is required"),
  // Allow multiple files; we'll handle validation manually
  file: z.any().optional(),
});

type HearingFormData = z.infer<typeof hearingSchema>;

interface HearingInstance {
  title: string;
  serial_no: string;
  date: string;
  note: string;
  file?: string;
}

interface HearingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, submit updates this hearing instead of creating a new one */
  hearingId?: number;
  instance?: HearingInstance;
  caseId?: string;
  caseNumber?: string;
  fileNumber?: string;
  onCreated?: () => void;
}

const HearingForm = ({
  open,
  onOpenChange,
  hearingId,
  instance,
  caseId,
  caseNumber,
  fileNumber,
  onCreated,
}: HearingFormProps) => {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HearingFormData>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      title: "",
      serial_no: "",
      date: "",
      note: "",
      file: undefined,
    },
  });

  // When editing, populate form with existing hearing data
  useEffect(() => {
    if (instance) {
      form.reset({
        title: instance.title,
        serial_no: instance.serial_no,
        date: instance.date,
        note: instance.note,
        file: undefined,
      });
      setFilePreview(null);
    } else {
      form.reset({
        title: "",
        serial_no: "",
        date: "",
        note: "",
        file: undefined,
      });
      setFilePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, open]);

  const onSubmit = async (data: HearingFormData) => {
    let toastId: string | number | undefined;
    try {
      if (!caseId) {
        toast.error("Case information not found.");
        return;
      }

      setIsSubmitting(true);
      const isUpdate = hearingId != null && hearingId > 0;
      toastId = toast.loading(isUpdate ? "Updating hearing..." : "Saving hearing...");

      const formData = new FormData();
      formData.append("title", data.title);
      // Backend expects serial_number (snake_case)
      formData.append("serial_number", data.serial_no);
      formData.append("date", data.date);
      formData.append("note", data.note);
      formData.append("case_id", caseId);
      if (data.file) {
        const files = Array.isArray(data.file) ? data.file : [data.file];
        files.forEach((file: File) => {
          if (file) {
            formData.append("files[]", file);
          }
        });
      }

      if (isUpdate) {
        await caseHearingsApi.update(hearingId, formData);
      } else {
        await caseHearingsApi.create(formData);
      }

      if (toastId !== undefined) {
        toast.success(
          isUpdate ? "Hearing updated successfully!" : "Hearing created successfully!",
          { id: toastId }
        );
      } else {
        toast.success(isUpdate ? "Hearing updated successfully!" : "Hearing created successfully!");
      }

      form.reset();
      setFilePreview(null);
      onOpenChange(false);

      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save hearing";
      if (toastId !== undefined) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      form.setValue("file", files);
      setFilePreview(files.map((f) => f.name).join(", "));
    } else {
      form.setValue("file", undefined as any);
      setFilePreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hearingId ? "Edit Hearing" : "New Hearing"}
          </DialogTitle>
          {(caseNumber || fileNumber) && (
            <div className="text-sm text-gray-500 mt-1">
              {caseNumber && <span className="mr-2">Case: {caseNumber}</span>}
              {fileNumber && <span>File: {fileNumber}</span>}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="hearing-title" className="text-sm font-medium text-gray-700">
              Title
            </Label>
            <Input
              id="hearing-title"
              placeholder="Enter hearing title"
              className="w-full h-10"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label htmlFor="hearing-serial" className="text-sm font-medium text-gray-700">
              Serial Number
            </Label>
            <Input
              id="hearing-serial"
              placeholder="Enter serial number"
              className="w-full h-10"
              {...form.register("serial_no")}
            />
            {form.formState.errors.serial_no && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.serial_no.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="hearing-date" className="text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              id="hearing-date"
              type="date"
              className="w-full h-10"
              {...form.register("date")}
            />
            {form.formState.errors.date && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="hearing-file" className="text-sm font-medium text-gray-700">
              File Upload
            </Label>
            <div className="relative">
              <Input
                id="hearing-file"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full h-10 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-green file:text-gray-900 hover:file:bg-primary-green/90"
                onChange={handleFileChange}
              />
              {filePreview && (
                <p className="text-xs text-gray-500 mt-1">{filePreview}</p>
              )}
              {instance?.file && !filePreview && (
                <p className="text-xs text-gray-500 mt-1">Current file: {instance.file}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="hearing-note" className="text-sm font-medium text-gray-700">
              Note
            </Label>
            <Textarea
              id="hearing-note"
              placeholder="Enter hearing notes"
              className="w-full min-h-[100px]"
              {...form.register("note")}
            />
            {form.formState.errors.note && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.note.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outlineBtn"
              onClick={() => {
                form.reset();
                setFilePreview(null);
                onOpenChange(false);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-green hover:bg-primary-green/90 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : hearingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HearingForm;
