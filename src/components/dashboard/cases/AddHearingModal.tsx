"use client";

import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  case_id: string | null;
};

// ========= ZOD SCHEMA ==========
const hearingSchema = z.object({
  hearing_date: z.string().min(1, "Date is required"),
  details: z.string().min(20, "Details must be at least 20 characters"),
  file_pdf: z.any().optional(),
});

type HearingForm = z.infer<typeof hearingSchema>;

export default function AddHearingModal({ open, setOpen, case_id }: Props) {
  const form = useForm<HearingForm>({
    resolver: zodResolver(hearingSchema),
  });

  const onSubmit = (data: HearingForm) => {
    console.log("case_id:", case_id);
    console.log("Hearing submitted:", data);
    toast.success("Hearing added!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-semibold">Add Hearing</h2>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Date Input */}
          <div>
            <Label className="mb-2 block">Date</Label>
            <Input
              type="date"
              {...form.register("hearing_date")}
              className="w-full"
            />
            {form.formState.errors.hearing_date && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.hearing_date.message}
              </p>
            )}
          </div>

          {/* Details */}
          <div>
            <Label className="mb-2 block">Details</Label>
            <Textarea
              placeholder="Enter hearing details"
              {...form.register("details")}
            />
            {form.formState.errors.details && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.details.message}
              </p>
            )}
          </div>

          {/* File Upload (Optional) */}
          <div>
            <Label className="mb-2 block">Upload PDF (Optional)</Label>

            <label className="border border-dashed p-4 rounded-md text-center cursor-pointer block">
              <span className="text-gray-600">Choose PDF file</span>
              <Input
                type="file"
                accept="application/pdf"
                className="hidden"
                {...form.register("file_pdf")}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
