"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const clients = [
  { id: "1", name: "Client One" },
  { id: "2", name: "Client Two" },
];

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  case_id: string | null;
};

// =====================
// ZOD VALIDATION SCHEMA
// =====================
const accountSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  paid_amount: z
    .string()
    .min(1, "Paid amount is required")
    .regex(/^[0-9]+$/, "Amount must be a number"),
  date: z.string().min(1, "Date is required"),
});

type AccountForm = z.infer<typeof accountSchema>;

export default function AddAccountModal({ open, setOpen, case_id }: Props) {
  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      client_id: "",
      paid_amount: "",
      date: "",
    },
    mode: "onChange",
  });

  const onSubmit = (data: AccountForm) => {
    console.log("case_id:", case_id);
    console.log("Account added:", data);
    toast.success("Account added!");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-semibold">Add Account</h2>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Client */}
          <div>
            <Label className="mb-2 block">Client</Label>
            <Select
              onValueChange={(v: string) => {
                form.setValue("client_id", v);
                form.trigger();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.formState.errors.client_id && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.client_id.message}
              </p>
            )}
          </div>

          {/* Paid Amount */}
          <div>
            <Label className="mb-2 block">Paid Amount</Label>
            <Input
              placeholder="Enter paid amount"
              {...form.register("paid_amount")}
            />

            {form.formState.errors.paid_amount && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.paid_amount.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <Label className="mb-2 block">Date</Label>
            <Input type="date" {...form.register("date")} className="w-full" />

            {form.formState.errors.date && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
