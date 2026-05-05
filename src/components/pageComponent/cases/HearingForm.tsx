"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { parseISO } from "date-fns";
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
import { cn, formatDisplayDateHyphen, formatIsoDateInput } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarDays,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { caseHearingsApi, waitForCaseHearingAttachmentsReady } from "@/lib/api";
import type { NormalizedHearingAttachment } from "@/lib/hearing-files";

function AttachmentKindIcon({ kind }: { kind: NormalizedHearingAttachment["kind"] }) {
  switch (kind) {
    case "image":
      return <ImageIcon className="w-3.5 h-3.5 shrink-0" aria-hidden />;
    case "video":
      return <Video className="w-3.5 h-3.5 shrink-0" aria-hidden />;
    case "pdf":
    case "document":
      return <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />;
    case "archive":
      return <FileArchive className="w-3.5 h-3.5 shrink-0" aria-hidden />;
    default:
      return <Paperclip className="w-3.5 h-3.5 shrink-0" aria-hidden />;
  }
}

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
  /** Current attachments when editing (not re-posted unless user selects new files). */
  existingAttachments?: NormalizedHearingAttachment[];
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
  /** idle | upload = bytes to server | finalize = queue job finishing */
  const [submitPhase, setSubmitPhase] = useState<"idle" | "upload" | "finalize">("idle");
  /** 0–100 while uploading; -1 when browser does not report total */
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

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
    setSubmitPhase("idle");
    setUploadPercent(null);
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
      setSubmitPhase("upload");
      setUploadPercent(0);
      const isUpdate = hearingId != null && hearingId > 0;
      toastId = toast.loading(isUpdate ? "Updating hearing…" : "Saving hearing…");

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

      let lastToastAt = 0;
      const onUploadProgress = (p: { percent: number }) => {
        if (p.percent >= 0) {
          setUploadPercent(p.percent);
          const now = Date.now();
          if (now - lastToastAt > 200 && toastId !== undefined) {
            lastToastAt = now;
            toast.loading(`Uploading… ${p.percent}%`, { id: toastId });
          }
        } else {
          setUploadPercent(-1);
          if (toastId !== undefined) {
            toast.loading("Uploading…", { id: toastId });
          }
        }
      };

      const res = isUpdate
        ? await caseHearingsApi.updateWithProgress(hearingId, formData, onUploadProgress)
        : await caseHearingsApi.createWithProgress(formData, onUploadProgress);
      const hearing = res.data;
      if (hearing?.id && hearing.attachments_status === "pending") {
        setSubmitPhase("finalize");
        setUploadPercent(null);
        if (toastId !== undefined) {
          toast.loading("Processing files on server…", { id: toastId });
        }
        await waitForCaseHearingAttachmentsReady(hearing.id, ({ attempt }) => {
          if (toastId !== undefined) {
            toast.loading(`Processing files on server… (${attempt})`, { id: toastId });
          }
        });
      }
      setSubmitPhase("idle");
      setUploadPercent(null);

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
      setSubmitPhase("idle");
      setUploadPercent(null);
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
      <DialogContent className="max-w-md max-h-[90dvh] overflow-auto">
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
            <Label htmlFor="hearing-date-picker" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="hearing-date-picker"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-10 px-3 text-sm rounded-md border border-gray-300 bg-white",
                    "flex items-center justify-start text-left font-normal",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "hover:bg-gray-50/80 transition-colors",
                    form.watch("date") ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-blue-600" />
                  <span className="flex-1 text-left">
                    {form.watch("date")
                      ? formatDisplayDateHyphen(form.watch("date")!)
                      : "Pick a date"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto min-w-[min(100vw-2rem,20rem)] p-0 bg-white border border-gray-200 shadow-xl z-50 rounded-lg"
                align="start"
              >
                <Calendar
                  mode="single"
                  className="w-full min-w-[18rem]"
                  selected={
                    form.watch("date") && /^\d{4}-\d{2}-\d{2}$/.test(form.watch("date")!)
                      ? parseISO(form.watch("date")!)
                      : undefined
                  }
                  onSelect={(d) => {
                    form.setValue("date", d ? formatIsoDateInput(d) : "");
                  }}
                  initialFocus
                  captionLayout="dropdown"
                  navLayout="around"
                  startMonth={new Date(1900, 0)}
                  endMonth={new Date(new Date().getFullYear() + 10, 11)}
                />
              </PopoverContent>
            </Popover>
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
                className="w-full h-10 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-green file:text-gray-900 hover:file:bg-primary-green/90"
                onChange={handleFileChange}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Each file (including video): max 100 MB. Larger uploads are rejected by the server.
              </p>
              {filePreview && (
                <p className="text-xs text-gray-500 mt-1">New: {filePreview}</p>
              )}
              {hearingId != null &&
                hearingId > 0 &&
                (instance?.existingAttachments?.length ?? 0) > 0 &&
                !filePreview && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-600">Current attachments</p>
                    <ul className="text-xs space-y-1">
                      {instance!.existingAttachments!.map((a) => (
                        <li key={a.url}>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={a.label}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 break-all"
                          >
                            <AttachmentKindIcon kind={a.kind} />
                            <span>{a.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground">
                      Choosing new files and saving replaces all current attachments.
                    </p>
                  </div>
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

          {(submitPhase === "upload" || submitPhase === "finalize") && (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 space-y-2">
              <p className="text-xs font-medium text-foreground">
                {submitPhase === "finalize"
                  ? "Processing files on server…"
                  : uploadPercent != null && uploadPercent >= 0
                    ? `Uploading… ${uploadPercent}%`
                    : "Uploading…"}
              </p>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                {submitPhase === "finalize" ? (
                  <div
                    className="h-full w-full bg-primary-green/70 animate-pulse"
                    aria-hidden
                  />
                ) : (
                  <div
                    className={cn(
                      "h-full bg-primary-green transition-[width] duration-150 ease-out",
                      uploadPercent === -1 && "w-1/3 animate-pulse"
                    )}
                    style={
                      uploadPercent != null && uploadPercent >= 0
                        ? { width: `${uploadPercent}%` }
                        : undefined
                    }
                    aria-valuenow={uploadPercent != null && uploadPercent >= 0 ? uploadPercent : undefined}
                    role="progressbar"
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outlineBtn"
              onClick={() => {
                form.reset();
                setFilePreview(null);
                setSubmitPhase("idle");
                setUploadPercent(null);
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
              {isSubmitting
                ? submitPhase === "finalize"
                  ? "Processing…"
                  : submitPhase === "upload"
                    ? "Uploading…"
                    : "Saving…"
                : hearingId
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HearingForm;
