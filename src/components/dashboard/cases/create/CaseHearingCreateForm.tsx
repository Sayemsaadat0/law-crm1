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

/** All fields optional at validation time; title + date required only when saving a hearing. */
const hearingCreateSchema = z.object({
  title: z.string().max(255),
  serial_no: z.string().max(255),
  date: z.string(),
  note: z.string(),
  file: z.any().optional(),
});

type HearingCreateFormType = z.infer<typeof hearingCreateSchema>;

function hasHearingFiles(data: HearingCreateFormType): boolean {
  if (!data.file) return false;
  const files = Array.isArray(data.file) ? data.file : [data.file];
  return files.some((f: File) => f instanceof File && f.size > 0);
}

function hasAnyHearingInput(data: HearingCreateFormType): boolean {
  const text = [data.title, data.serial_no, data.date, data.note];
  if (text.some((s) => String(s ?? "").trim() !== "")) return true;
  return hasHearingFiles(data);
}

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

  const finishWithoutHearing = async (caseId: string) => {
    setIsSubmitting(true);
    try {
      const caseResponse = await casesApi.getById(Number(caseId));
      const caseData: unknown =
        caseResponse.data && (caseResponse.data as { data?: unknown }).data
          ? (caseResponse.data as { data: unknown }).data
          : caseResponse.data;

      if (!caseData) {
        localStorage.removeItem("current_case_id");
        toast.error("Case information not found.");
        return;
      }

      localStorage.removeItem("current_case_id");
      setFilePreview(null);
      form.reset({
        title: "",
        serial_no: "",
        date: "",
        note: "",
        file: undefined,
      });

      toast.success(
        "Continuing without hearing details. You can add hearings later when editing the case."
      );

      if (onStepComplete) {
        onStepComplete();
      }

      navigate("/dashboard/cases");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: HearingCreateFormType, mode: "complete" | "addAnother") => {
    let toastId: string | number | undefined;
    try {
      if (!isActive) return;

      const caseId = localStorage.getItem("current_case_id");
      if (!caseId) {
        toast.error("Case basic information not found. Please complete step 1 again.");
        return;
      }

      if (!hasAnyHearingInput(data)) {
        if (mode === "addAnother") {
          toast.info(
            "Enter title and hearing date to save a hearing, or use Save & complete to finish without hearings."
          );
          return;
        }
        await finishWithoutHearing(caseId);
        return;
      }

      if (!data.title?.trim() || !data.date) {
        toast.error(
          "Enter title and hearing date to save a hearing, or clear the fields to finish without one."
        );
        return;
      }

      setIsSubmitting(true);
      toastId = toast.loading("Saving hearing information...");

      const formData = new FormData();
      formData.append("title", data.title.trim());
      formData.append("date", data.date);
      formData.append("case_id", caseId);

      const serial = data.serial_no?.trim();
      if (serial) {
        formData.append("serial_number", serial);
      }

      const note = data.note?.trim();
      if (note) {
        formData.append("note", note);
      }

      if (data.file) {
        const files = Array.isArray(data.file) ? data.file : [data.file];
        files.forEach((file: File) => {
          if (file && file.size > 0) {
            formData.append("files[]", file);
          }
        });
      }

      await caseHearingsApi.create(formData);

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

      const caseResponse = await casesApi.getById(Number(caseId));
      const caseData: unknown =
        caseResponse.data && (caseResponse.data as { data?: unknown }).data
          ? (caseResponse.data as { data: unknown }).data
          : caseResponse.data;

      if (!caseData) {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save hearing information";
      if (toastId !== undefined) {
        toast.error(message, { id: toastId });
      } else {
        toast.error(message);
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
      form.setValue("file", undefined as unknown as File[]);
      setFilePreview(null);
    }
  };

  const handleSubmitComplete = form.handleSubmit((data) => onSubmit(data, "complete"));

  const handleSubmitAddAnother = form.handleSubmit((data) => onSubmit(data, "addAnother"));

  return (
    <form className="space-y-5" onSubmit={handleSubmitComplete}>
      <p className="text-sm text-gray-500 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
        Hearing details are optional. To save a hearing here, enter <strong>title</strong> and{" "}
        <strong>hearing date</strong>. Leave everything blank and use{" "}
        <strong>Save &amp; complete</strong> to finish without adding a hearing.
      </p>

      {/* Title & Serial Number in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Title <span className="text-gray-400 font-normal">(if saving a hearing)</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter hearing title"
            className="w-full h-10"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="serial_no" className="text-sm font-medium text-gray-700">
            Serial Number <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="serial_no"
            placeholder="Enter serial number"
            className="w-full h-10"
            {...form.register("serial_no")}
          />
          {form.formState.errors.serial_no && (
            <p className="text-xs text-red-500 mt-1">{form.formState.errors.serial_no.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file" className="text-sm font-medium text-gray-700">
          File Upload <span className="text-gray-400 font-normal">(optional)</span>
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
          {filePreview && <p className="text-xs text-gray-500 mt-1">{filePreview}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-gray-700">
          Hearing Date <span className="text-gray-400 font-normal">(if saving a hearing)</span>
        </Label>
        <Input id="date" type="date" className="w-full h-10" {...form.register("date")} />
        {form.formState.errors.date && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note" className="text-sm font-medium text-gray-700">
          Note <span className="text-gray-400 font-normal">(optional)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="Enter hearing note"
          className="w-full min-h-24"
          {...form.register("note")}
        />
        {form.formState.errors.note && (
          <p className="text-xs text-red-500 mt-1">{form.formState.errors.note.message}</p>
        )}
      </div>

      <div className="pt-2 flex flex-col space-y-3">
        <Button
          type="button"
          disabled={!isActive || isSubmitting}
          onClick={handleSubmitAddAnother}
          className="w-full bg-black text-white hover:bg-black/90 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save & add another hearing"}
        </Button>
        <Button
          type="submit"
          disabled={!isActive || isSubmitting}
          className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save & complete"}
        </Button>
      </div>
    </form>
  );
};

export default CaseHearingCreateForm;
