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
import { casePartiesApi, casesApi } from "@/lib/api";

const casePartySchema = z.object({
  party_name: z.string().min(1, "Party name is required"),
  party_address: z.string().min(1, "Party address is required"),
  party_email: z.string().email("Invalid email address"),
  party_phone: z.string().min(1, "Party phone is required"),
  reference: z.string().min(1, "Reference is required"),
  party_description: z.string().min(1, "Party description is required"),
});

type CasePartyFormType = z.infer<typeof casePartySchema>;

interface CasePartyFormProps {
  instance?: CasePartyFormType;
  isActive?: boolean;
  onStepComplete?: () => void;
}

const CasePartyForm = ({ 
  instance, 
  isActive = true,
  onStepComplete 
}: CasePartyFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<CasePartyFormType>({
    resolver: zodResolver(casePartySchema),
    defaultValues: instance || {
      party_name: "",
      party_address: "",
      party_email: "",
      party_phone: "",
      reference: "",
      party_description: "",
    },
  });

  useEffect(() => {
    if (instance) {
      form.reset(instance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  const onSubmit = async (data: CasePartyFormType) => {
    let toastId: string | number | undefined;
    try {
      if (!isActive) return;

      const caseId = localStorage.getItem("current_case_id");
      if (!caseId) {
        toast.error("Case basic information not found. Please complete step 1 again.");
        return;
      }

      setIsSubmitting(true);
      toastId = toast.loading("Saving party information...");

      await casePartiesApi.create({
        party_name: data.party_name,
        party_email: data.party_email,
        party_phone: data.party_phone,
        party_address: data.party_address,
        reference: data.reference,
        party_description: data.party_description,
        case_id: Number(caseId),
      });

      // After saving party, verify that both client and party exist for this case
      const caseResponse = await casesApi.getById(Number(caseId));
      const caseData: any = caseResponse.data && (caseResponse.data as any).data
        ? (caseResponse.data as any).data
        : caseResponse.data;

      // Laravel serializes relations as snake_case keys by default (case_clients, case_parties)
      // so we support both camelCase and snake_case just in case.
      const caseClients = caseData?.caseClients ?? caseData?.case_clients;
      const caseParties = caseData?.caseParties ?? caseData?.case_parties;

      const hasClient = Array.isArray(caseClients) && caseClients.length > 0;
      const hasParty = Array.isArray(caseParties) && caseParties.length > 0;

      if (!hasClient || !hasParty) {
        // Incomplete case: delete it so that a case must always have client & party
        await casesApi.delete(Number(caseId));
        localStorage.removeItem("current_case_id");

        if (toastId !== undefined) {
          toast.error("Case deleted because client and party information are required.", { id: toastId });
        } else {
          toast.error("Case deleted because client and party information are required.");
        }
        return;
      }

      // Case is complete
      localStorage.removeItem("current_case_id");

      if (toastId !== undefined) {
        toast.success("Case created successfully!", { id: toastId });
      } else {
        toast.success("Case created successfully!");
      }
      
      // Final step complete
      if (onStepComplete) {
        onStepComplete();
      }

      // Redirect to cases main page
      navigate("/dashboard/cases");
    } catch (err: any) {
      if (toastId !== undefined) {
        toast.error(err.message || "Failed to save party information", { id: toastId });
      } else {
        toast.error(err.message || "Failed to save party information");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Party Name & Email in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        {/* Party Name */}
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="party_name" className="text-sm font-medium text-gray-700">
            Party Name
          </Label>
          <Input
            id="party_name"
            placeholder="Enter party name"
            className="w-full h-10"
            {...form.register("party_name")}
          />
          {form.formState.errors.party_name && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.party_name.message}
            </p>
          )}
        </div>
        {/* Party Email */}
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="party_email" className="text-sm font-medium text-gray-700">
            Party Email
          </Label>
          <Input
            id="party_email"
            type="email"
            placeholder="Enter party email"
            className="w-full h-10"
            {...form.register("party_email")}
          />
          {form.formState.errors.party_email && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.party_email.message}
            </p>
          )}
        </div>
      </div>

      {/* Party Phone & Address in a flex row */}
      <div className="flex flex-row items-center space-x-6">
        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="party_phone" className="text-sm font-medium text-gray-700">
            Party Phone
          </Label>
          <Input
            id="party_phone"
            placeholder="Enter party phone"
            className="w-full h-10"
            {...form.register("party_phone")}
          />
          {form.formState.errors.party_phone && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.party_phone.message}
            </p>
          )}
        </div>

        <div className="flex flex-col flex-1 space-y-2">
          <Label htmlFor="party_address" className="text-sm font-medium text-gray-700">
            Party Address
          </Label>
          <Input
            id="party_address"
            placeholder="Enter party address"
            className="w-full h-10"
            {...form.register("party_address")}
          />
          {form.formState.errors.party_address && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.party_address.message}
            </p>
          )}
        </div>
      </div>

      {/* Reference */}
      <div className="space-y-2">
        <Label htmlFor="reference" className="text-sm font-medium text-gray-700">
          Reference
        </Label>
        <Input
          id="reference"
          placeholder="Enter reference"
          className="w-full h-10"
          {...form.register("reference")}
        />
        {form.formState.errors.reference && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.reference.message}
          </p>
        )}
      </div>

      {/* Party Description */}
      <div className="space-y-2">
        <Label htmlFor="party_description" className="text-sm font-medium text-gray-700">
          Party Description
        </Label>
        <Textarea
          id="party_description"
          placeholder="Enter party description"
          className="w-full min-h-24"
          {...form.register("party_description")}
        />
        {form.formState.errors.party_description && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.party_description.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
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

export default CasePartyForm;

