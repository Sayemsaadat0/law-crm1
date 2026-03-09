"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Hearing } from "@/types/case.type";
import { casePaymentsApi } from "@/lib/api";

const paymentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  payment_for_hearing: z.string().optional(), // optional, backend allows nullable
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 0,
    "Amount must be a non-negative number"
  ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentInstance {
  date: string;
  payment_for_hearing: string;
  amount: number;
}

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance?: PaymentInstance;
  hearings: Hearing[];
  caseId?: string;
  caseNumber?: string;
  fileNumber?: string;
  onCreated?: () => void;
}

const PaymentForm = ({
  open,
  onOpenChange,
  instance,
  hearings,
  caseId,
  caseNumber,
  fileNumber,
  onCreated,
}: PaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: instance
      ? {
          date: instance.date,
          payment_for_hearing: instance.payment_for_hearing,
          amount: instance.amount.toString(),
        }
      : {
          date: "",
          payment_for_hearing: "",
          amount: "",
        },
  });

  const onSubmit = async (data: PaymentFormData) => {
    let toastId: string | number | undefined;
    try {
      if (!caseId) {
        toast.error("Case information not found.");
        return;
      }

      setIsSubmitting(true);
      toastId = toast.loading("Saving payment...");

      // Map selected hearing option back to case_hearing_id (we use index-based id in value)
      let caseHearingId: number | undefined;
      if (data.payment_for_hearing) {
        const index = parseInt(data.payment_for_hearing.replace("hearing-", ""), 10);
        const hearing = hearings[index];
        if (hearing) {
          // In our TCase.hearings we don't store id, only serial_no; backend expects case_hearing_id (id)
          // If you extend Hearing type with `id`, you can map it directly here.
          // For now we'll send undefined, and backend will still accept it because case_hearing_id is nullable.
          caseHearingId = (hearing as any).id ? Number((hearing as any).id) : undefined;
        }
      }

      await casePaymentsApi.create({
        date: data.date,
        amount: Number(data.amount),
        case_id: Number(caseId),
        case_hearing_id: caseHearingId,
      });

      if (toastId !== undefined) {
        toast.success("Payment created successfully!", { id: toastId });
      } else {
        toast.success("Payment created successfully!");
      }

      form.reset();
      onOpenChange(false);
      if (onCreated) {
        onCreated();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save payment";
      if (toastId !== undefined) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format hearing for display in select
  const formatHearingOption = (hearing: Hearing) => {
    const date = new Date(hearing.hearing_date).toLocaleDateString();
    // Format: Serial No - Title - Date
    return `${hearing.serial_no} - ${hearing.title} - ${date}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {instance ? "Edit Payment" : "Add Payment"}
          </DialogTitle>
          {(caseNumber || fileNumber) && (
            <div className="text-sm text-gray-500 mt-1">
              {caseNumber && <span className="mr-2">Case: {caseNumber}</span>}
              {fileNumber && <span>File: {fileNumber}</span>}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="payment-date" className="text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              id="payment-date"
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

          {/* Payment for Hearing */}
          <div className="space-y-2">
            <Label
              htmlFor="payment-hearing"
              className="text-sm font-medium text-gray-700"
            >
              Payment for Hearing
            </Label>
            <Select
              value={form.watch("payment_for_hearing")}
              onValueChange={(value: string) => form.setValue("payment_for_hearing", value)}
            >
              <SelectTrigger id="payment-hearing" className="w-full h-10">
                <SelectValue placeholder="Select a hearing" />
              </SelectTrigger>
              <SelectContent>
                {hearings.length === 0 ? (
                  <SelectItem value="no-hearings" disabled>
                    No hearings available
                  </SelectItem>
                ) : (
                  hearings.map((hearing, index) => {
                    const hearingId = `hearing-${index}`;
                    const displayText = formatHearingOption(hearing);
                    return (
                      <SelectItem key={hearingId} value={hearingId}>
                        {displayText}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.payment_for_hearing && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.payment_for_hearing.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount" className="text-sm font-medium text-gray-700">
              Amount
            </Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              className="w-full h-10"
              {...form.register("amount")}
            />
            {form.formState.errors.amount && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.amount.message}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outlineBtn"
              onClick={() => {
                form.reset();
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
              {isSubmitting ? "Saving..." : instance ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentForm;
