"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { caseClientsApi } from "@/lib/api";

const caseClientSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_address: z.string().min(1, "Client address is required"),
  client_phone: z.string().min(1, "Client phone is required"),
  billing_bank_name: z.string().min(1, "Billing bank name is required"),
  referring_firm: z.string().min(1, "Referring firm is required"),
  client_reference_number: z.string().min(1, "Client reference number is required"),
  client_description: z.string().min(1, "Client description is required"),
  // Fee schedule files are optional and handled manually
  fee_schedule_files: z.any().optional(),
});

type CaseClientFormType = z.infer<typeof caseClientSchema>;

interface CaseClientFormProps {
  instance?: CaseClientFormType;
  isActive?: boolean;
  onStepComplete?: () => void;
}

const CaseClientForm = ({ 
  instance, 
  isActive = true,
  onStepComplete 
}: CaseClientFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeFilesPreview, setFeeFilesPreview] = useState<string | null>(null);
  const form = useForm<CaseClientFormType>({
    resolver: zodResolver(caseClientSchema),
    defaultValues: instance || {
      client_name: "",
      client_address: "",
      client_phone: "",
      billing_bank_name: "",
      referring_firm: "",
      client_reference_number: "",
      client_description: "",
      fee_schedule_files: undefined,
    },
  });

  useEffect(() => {
    if (instance) {
      form.reset(instance);
      setFeeFilesPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  const onSubmit = async (data: CaseClientFormType) => {
    let toastId: string | number | undefined;
    try {
      if (!isActive) return;

      const caseId = localStorage.getItem("current_case_id");
      if (!caseId) {
        toast.error("Case basic information not found. Please complete step 1 again.");
        return;
      }

      setIsSubmitting(true);
      toastId = toast.loading("Saving client information...");

      const formData = new FormData();
      formData.append("client_name", data.client_name);
      formData.append("client_phone", data.client_phone);
      formData.append("client_address", data.client_address);
      formData.append("billing_bank_name", data.billing_bank_name);
      formData.append("referring_firm", data.referring_firm);
      formData.append("client_reference_number", data.client_reference_number);
      formData.append("client_description", data.client_description);
      formData.append("case_id", caseId);

      if (data.fee_schedule_files) {
        const files = Array.isArray(data.fee_schedule_files)
          ? data.fee_schedule_files
          : [data.fee_schedule_files];
        files.forEach((file: File) => {
          if (file) {
            formData.append("fee_schedule_files[]", file);
          }
        });
      }

      await caseClientsApi.create(formData);

      if (toastId !== undefined) {
        toast.success("Client information saved!", { id: toastId });
      } else {
        toast.success("Client information saved!");
      }

      setFeeFilesPreview(null);
      
      // Move to next step
      if (onStepComplete) {
        onStepComplete();
      }
    } catch (err: any) {
      if (toastId !== undefined) {
        toast.error(err.message || "Failed to save client information", { id: toastId });
      } else {
        toast.error(err.message || "Failed to save client information");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      form.setValue("fee_schedule_files", files as any);
      setFeeFilesPreview(files.map((f) => f.name).join(", "));
    } else {
      form.setValue("fee_schedule_files", undefined as any);
      setFeeFilesPreview(null);
    }
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Client Name & Referring Firm in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        {/* Client Name */}
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
            Client Name
          </Label>
          <Input
            id="client_name"
            placeholder="Enter client name"
            className="w-full h-10"
            {...form.register("client_name")}
          />
          {form.formState.errors.client_name && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.client_name.message}
            </p>
          )}
        </div>
        {/* Referring Firm */}
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="referring_firm" className="text-sm font-medium text-gray-700">
            Referring Firm
          </Label>
          <Input
            id="referring_firm"
            placeholder="Enter referring firm"
            className="w-full h-10"
            {...form.register("referring_firm")}
          />
          {form.formState.errors.referring_firm && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.referring_firm.message}
            </p>
          )}
        </div>
      </div>

      {/* Client Phone & Address in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="client_phone" className="text-sm font-medium text-gray-700">
            Client Phone
          </Label>
          <Input
            id="client_phone"
            placeholder="Enter client phone"
            className="w-full h-10"
            {...form.register("client_phone")}
          />
          {form.formState.errors.client_phone && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.client_phone.message}
            </p>
          )}
        </div>

        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="client_address" className="text-sm font-medium text-gray-700">
            Client Address
          </Label>
          <Input
            id="client_address"
            placeholder="Enter client address"
            className="w-full h-10"
            {...form.register("client_address")}
          />
          {form.formState.errors.client_address && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.client_address.message}
            </p>
          )}
        </div>
      </div>

      {/* Billing Bank Name */}
      <div className="flex flex-col space-y-2">
        <Label htmlFor="billing_bank_name" className="text-sm font-medium text-gray-700">
          Billing Bank Name
        </Label>
        <Input
          id="billing_bank_name"
          placeholder="Enter billing bank name"
          className="w-full h-10"
          {...form.register("billing_bank_name")}
        />
        {form.formState.errors.billing_bank_name && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.billing_bank_name.message}
          </p>
        )}
      </div>

      {/* Client Reference Number */}
      <div className="space-y-2">
        <Label htmlFor="client_reference_number" className="text-sm font-medium text-gray-700">
          Client Reference Number
        </Label>
        <Input
          id="client_reference_number"
          placeholder="Enter client reference number"
          className="w-full h-10"
          {...form.register("client_reference_number")}
        />
        {form.formState.errors.client_reference_number && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.client_reference_number.message}
          </p>
        )}
      </div>

      {/* Client Description */}
      <div className="space-y-2">
        <Label htmlFor="client_description" className="text-sm font-medium text-gray-700">
          Client Description
        </Label>
        <Textarea
          id="client_description"
          placeholder="Enter client description"
          className="w-full min-h-24"
          {...form.register("client_description")}
        />
        {form.formState.errors.client_description && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.client_description.message}
          </p>
        )}
      </div>

      {/* Fee Schedule (Bills) */}
      <div className="space-y-2">
        <Label htmlFor="fee_schedule_files" className="text-sm font-medium text-gray-700">
          Fee Schedule (Bills)
        </Label>
        <div className="relative">
          <Input
            id="fee_schedule_files"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full h-10 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-green file:text-gray-900 hover:file:bg-primary-green/90"
            onChange={handleFeeFilesChange}
          />
          {feeFilesPreview && (
            <p className="text-xs text-gray-500 mt-1">{feeFilesPreview}</p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <Button 
          type="submit"
          disabled={!isActive || isSubmitting}
          className="w-full bg-primary-green hover:bg-primary-green/90 text-gray-900 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
};

export default CaseClientForm;

