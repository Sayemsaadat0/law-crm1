"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { caseHearingsApi, casesApi } from "@/lib/api";

const hearingCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  serial_no: z.string().min(1, "Serial number is required"),
  date: z.string().min(1, "Date is required"),
  note: z.string().min(1, "Note is required"),
  // Allow multiple files; we'll validate manually
  file: z.any().optional(),
});

type HearingCreateFormType = z.infer<typeof hearingCreateSchema>;

interface CaseHearingCreateFormProps {
  isActive?: boolean;
  onStepComplete?: () => void;
}

const CaseHearingCreateForm = ({
  isActive = true,
  onStepComplete,
}: CaseHearingCreateFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const form = useForm<HearingCreateFormType>({
    resolver: zodResolver(hearingCreateSchema),
    defaultValues: {
      title: "",
      serial_no: "",
      date: "",
      note: "",
      file: undefined,
    },
  });

  useEffect(() => {
    if (!isActive) {
      form.reset();
      setFilePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const onSubmit = async (data: HearingCreateFormType, mode: "complete" | "addAnother") => {
    let toastId: string | number | undefined;
    try {
      if (!isActive) return;

      const caseId = localStorage.getItem("current_case_id");
      if (!caseId) {
        toast.error("Case basic information not found. Please complete step 1 again.");
        return;
      }

      setIsSubmitting(true);
      toastId = toast.loading("Saving hearing information...");

      const formData = new FormData();
      formData.append("title", data.title);
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

      await caseHearingsApi.create(formData);

      // If user wants to add another hearing, just reset form and stay on this tab
      if (mode === "addAnother") {
        if (toastId !== undefined) {
          toast.success("Hearing added successfully!", { id: toastId });
        } else {
          toast.success("Hearing added successfully!");
        }

        form.reset({
          title: "",
          serial_no: "",
          date: "",
          note: "",
          file: undefined,
        });
        setFilePreview(null);
        return;
      }

      // After saving hearing, we can optionally validate that case exists
      const caseResponse = await casesApi.getById(Number(caseId));
      const caseData: any =
        caseResponse.data && (caseResponse.data as any).data
          ? (caseResponse.data as any).data
          : caseResponse.data;

      if (!caseData) {
        // If somehow case is missing, clean up
        localStorage.removeItem("current_case_id");
        if (toastId !== undefined) {
          toast.error("Case information not found after saving hearing.", { id: toastId });
        } else {
          toast.error("Case information not found after saving hearing.");
        }
        return;
      }

      localStorage.removeItem("current_case_id");
      setFilePreview(null);

      if (toastId !== undefined) {
        toast.success("Case and hearing created successfully!", { id: toastId });
      } else {
        toast.success("Case and hearing created successfully!");
      }

      if (onStepComplete) {
        onStepComplete();
      }

      navigate("/dashboard/cases");
    } catch (err: any) {
      if (toastId !== undefined) {
        toast.error(err.message || "Failed to save hearing information", { id: toastId });
      } else {
        toast.error(err.message || "Failed to save hearing information");
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

  const handleSubmitComplete = form.handleSubmit((data) =>
    onSubmit(data, "complete")
  );

  const handleSubmitAddAnother = form.handleSubmit((data) =>
    onSubmit(data, "addAnother")
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmitComplete}>
      {/* Title & Serial Number in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        {/* Title */}
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title
          </Label>
          <Input
            id="title"
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
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="serial_no" className="text-sm font-medium text-gray-700">
            Serial Number
          </Label>
          <Input
            id="serial_no"
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
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="file" className="text-sm font-medium text-gray-700">
          File Upload
        </Label>
        <div className="relative">
          <Input
            id="file"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full h-10 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-green file:text-gray-900 hover:file:bg-primary-green/90"
            onChange={handleFileChange}
          />
          {filePreview && (
            <p className="text-xs text-gray-500 mt-1">{filePreview}</p>
          )}
        </div>
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-gray-700">
          Hearing Date
        </Label>
        <Input
          id="date"
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

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm font-medium text-gray-700">
          Note
        </Label>
        <Textarea
          id="note"
          placeholder="Enter hearing note"
          className="w-full min-h-24"
          {...form.register("note")}
        />
        {form.formState.errors.note && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.note.message}
          </p>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="pt-2 flex flex-col space-y-3">
        <Button
          type="button"
          disabled={!isActive || isSubmitting}
          onClick={handleSubmitAddAnother}
          className="w-full bg-black text-white hover:bg-black/90 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save & Add Another Hearing"}
        </Button>
        <Button
          type="submit"
          disabled={!isActive || isSubmitting}
          className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save & Complete"}
        </Button>
      </div>
    </form>
  );
};

export default CaseHearingCreateForm;


