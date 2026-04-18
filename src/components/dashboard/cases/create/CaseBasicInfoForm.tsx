"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { parseISO } from "date-fns";
import { usersApi, casesApi, courtsApi, type UserListItem, type Court } from "@/lib/api";
import { cn, formatDisplayDateHyphen, formatIsoDateInput } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarDays,
  User,
  FileText,
  Scale,
  CheckCircle2,
  UserCircle,
  Gavel,
  MessageSquare,
} from "lucide-react";

const caseBasicInfoSchema = z.object({
  number_of_file: z.string().min(1, "Number of file is required"),
  number_of_case: z.string().min(1, "Number of case is required"),
  date: z.string().optional(),
  court_id: z.string().optional(),
  status: z.enum(["active", "disposed", "resolve", "archive"]).optional(),
  // Optional textual stage description
  stage: z.string().optional(),
  // New appellant/respondent fields
  appellant_name: z.string().optional(),
  appellant_relation: z.enum(["plaintiff", "Petitioner", "Appellant"]).optional(),
  respondent_name: z.string().optional(),
  respondent_relation: z.enum(["defendant", "opposite_party", "respondent"]).optional(),
  breakdowns: z.string().optional(),
  lawyer_id: z.string().optional(),
});

type CaseBasicInfoFormType = z.infer<typeof caseBasicInfoSchema>;

interface CaseBasicInfoFormProps {
  instance?: CaseBasicInfoFormType;
  isActive?: boolean;
  onStepComplete?: () => void;
}

const CaseBasicInfoForm = ({ 
  instance, 
  isActive = true,
  onStepComplete 
}: CaseBasicInfoFormProps) => {
  const [lawyers, setLawyers] = useState<UserListItem[]>([]);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(false);

  const form = useForm<CaseBasicInfoFormType>({
    resolver: zodResolver(caseBasicInfoSchema),
    defaultValues: instance || {
      number_of_file: "",
      number_of_case: "",
      date: "",
      court_id: "",
      status: undefined,
      stage: "",
      appellant_name: "",
      appellant_relation: undefined,
      respondent_name: "",
      respondent_relation: undefined,
      breakdowns: "",
      lawyer_id: "",
    },
  });

  useEffect(() => {
    if (instance) {
      form.reset(instance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  // Fetch lawyers (users with role = lawyer)
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setIsLoadingLawyers(true);
        const response = await usersApi.getAll({ role: "lawyer", per_page: 100 });
        if (response.data) {
          setLawyers(response.data.data || []);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load lawyers");
      } finally {
        setIsLoadingLawyers(false);
      }
    };

    fetchLawyers();
  }, []);

  // Fetch courts from API
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setIsLoadingCourts(true);
        const response = await courtsApi.getAll({ status: true, per_page: 100 });
        if (response.data) {
          setCourts(response.data.data || []);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load courts");
      } finally {
        setIsLoadingCourts(false);
      }
    };

    fetchCourts();
  }, []);

  const onSubmit = async (data: CaseBasicInfoFormType) => {
    let toastId: string | number | undefined;
    try {
      // Basic info should only submit when step is active
      if (!isActive) return;

      // Prepare payload for API (convert to backend field names/types)
      const payload: any = {
        number_of_file: Number(data.number_of_file),
        number_of_case: Number(data.number_of_case),
      };

      // Only include optional fields if they have values
      if (data.date) payload.date = data.date;
      if (data.lawyer_id) payload.lawyer_id = Number(data.lawyer_id);
      if (data.court_id) payload.court_id = Number(data.court_id);
      if (data.status) payload.status = data.status;
      if (data.stage) payload.stages = data.stage;
      if (data.appellant_name) payload.appellant_name = data.appellant_name;
      if (data.appellant_relation) payload.appellant_relation = data.appellant_relation;
      if (data.respondent_name) payload.respondent_name = data.respondent_name;
      if (data.respondent_relation) payload.respondent_relation = data.respondent_relation;
      if (data.breakdowns) payload.description = data.breakdowns;

      toastId = toast.loading("Creating case...");

      const response = await casesApi.create(payload);

      const createdCase: any = response.data && (response.data as any).data
        ? (response.data as any).data
        : response.data;

      const caseId = createdCase?.id;

      if (!caseId) {
        throw new Error("Case ID missing from server response");
      }

      // Store case ID for next steps (client & party)
      localStorage.setItem("current_case_id", String(caseId));

      if (toastId !== undefined) {
        toast.success("Case basic information saved!", { id: toastId });
      } else {
        toast.success("Case basic information saved!");
      }
      
      // Move to next step
      if (onStepComplete) {
        onStepComplete();
      }
    } catch (err: any) {
      if (toastId !== undefined) {
        toast.error(err.message || "Failed to save case basic info", { id: toastId });
      } else {
        toast.error(err.message || "Failed to save case basic info");
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Section 1: Basic Information */}
      <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl p-6 border border-blue-100/50 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Date — Calendar + date-fns (stored as yyyy-MM-dd for API) */}
          <div className="space-y-2">
            <Label htmlFor="case-date-picker" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              Case Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id="case-date-picker"
                  disabled={!isActive}
                  className={cn(
                    "w-full h-11 px-3 text-sm rounded-md border border-gray-300 bg-white",
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
                      : "Pick a date (optional)"}
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
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                {form.formState.errors.date.message}
              </p>
            )}
          </div>

          {/* Lawyer */}
          <div className="space-y-2">
            <Label htmlFor="lawyer_id" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Assigned Lawyer
            </Label>
            <Select
              value={form.watch("lawyer_id") || ""}
              onValueChange={(value: string) => {
                form.setValue("lawyer_id", value);
                form.trigger("lawyer_id");
              }}
            >
              <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select lawyer" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingLawyers ? (
                  <SelectItem value="_loading" disabled>
                    Loading lawyers...
                  </SelectItem>
                ) : lawyers.length === 0 ? (
                  <SelectItem value="_no_lawyers" disabled>
                    No lawyers found
                  </SelectItem>
                ) : (
                  lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={String(lawyer.id)}>
                      {lawyer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.lawyer_id && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.lawyer_id.message}
              </p>
            )}
          </div>

          {/* File Number */}
          <div className="space-y-2">
            <Label htmlFor="number_of_file" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              File Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="number_of_file"
              placeholder="Enter file number"
              className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              {...form.register("number_of_file")}
            />
            {form.formState.errors.number_of_file && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.number_of_file.message}
              </p>
            )}
          </div>

          {/* Case Number */}
          <div className="space-y-2">
            <Label htmlFor="number_of_case" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Case Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="number_of_case"
              placeholder="Enter case number"
              className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              {...form.register("number_of_case")}
            />
            {form.formState.errors.number_of_case && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.number_of_case.message}
              </p>
            )}
          </div>

          {/* Court */}
          <div className="space-y-2">
            <Label htmlFor="court_id" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              Court
            </Label>
            <Select
              value={form.watch("court_id") || ""}
              onValueChange={(value: string) => {
                form.setValue("court_id", value);
                form.trigger("court_id");
              }}
            >
              <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCourts ? (
                  <SelectItem value="_loading_courts" disabled>
                    Loading courts...
                  </SelectItem>
                ) : courts.length === 0 ? (
                  <SelectItem value="_no_courts" disabled>
                    No courts found
                  </SelectItem>
                ) : (
                  courts.map((court) => (
                    <SelectItem key={court.id} value={String(court.id)}>
                      {court.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.court_id && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.court_id.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Case Status
            </Label>
            <Select
              value={form.watch("status") || ""}
              onValueChange={(value: "active" | "disposed" | "resolve" | "archive") => {
                form.setValue("status", value);
                form.trigger("status");
              }}
            >
              <SelectTrigger className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disposed">Disposed</SelectItem>
                <SelectItem value="resolve">Resolve</SelectItem>
                <SelectItem value="archive">Archive</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Case Details */}
      <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-xl p-6 border border-purple-100/50 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Gavel className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Case Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Stage */}
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Stage
            </Label>
            <Input
              id="stage"
              placeholder="Enter stage details (optional)"
              className="w-full h-11 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              {...form.register("stage")}
            />
          </div>

          {/* Case Summary */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="breakdowns" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Case Summary
            </Label>
            <Textarea
              id="breakdowns"
              placeholder="Enter a detailed summary of the case..."
              className="w-full min-h-28 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
              {...form.register("breakdowns")}
            />
            {form.formState.errors.breakdowns && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.breakdowns.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Parties Information */}
      <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 rounded-xl p-6 border border-green-100/50 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 bg-green-100 rounded-lg">
            <UserCircle className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Parties Information</h3>
        </div>

        <div className="flex flex-col gap-6 md:gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 md:items-stretch">
            {/* Appellant */}
            <div className="rounded-xl border border-green-200/80 bg-white/60 p-4 space-y-4">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-green-800">
                Appellant
              </p>
              <div className="space-y-2">
                <Label htmlFor="appellant_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-green-600" />
                  Name
                </Label>
                <Input
                  id="appellant_name"
                  placeholder="Enter Name"
                  className="w-full h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  {...form.register("appellant_name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appellant_relation" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-green-600" />
                  Relation
                </Label>
                <Select
                  value={form.watch("appellant_relation") || ""}
                  onValueChange={(value: "plaintiff" | "Petitioner" | "Appellant") => {
                    form.setValue("appellant_relation", value);
                    form.trigger("appellant_relation");
                  }}
                >
                  <SelectTrigger className="w-full h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintiff">Plaintiff</SelectItem>
                    <SelectItem value="Petitioner">Petitioner</SelectItem>
                    <SelectItem value="Appellant">Appellant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className="flex items-center justify-center py-2 md:py-0 md:min-w-[3rem]"
              aria-hidden
            >
              <span className="inline-flex items-center justify-center rounded-lg border-2 border-green-600/30 bg-green-50 px-4 py-2 text-lg font-black tracking-[0.2em] text-green-800 shadow-sm">
                VS
              </span>
            </div>

            {/* Respondent */}
            <div className="rounded-xl border border-emerald-200/80 bg-white/60 p-4 space-y-4">
              <p className="text-center text-xs font-bold uppercase tracking-wider text-emerald-900">
                Respondent
              </p>
              <div className="space-y-2">
                <Label htmlFor="respondent_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-green-600" />
                  Name
                </Label>
                <Input
                  id="respondent_name"
                  placeholder="Enter Name"
                  className="w-full h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  {...form.register("respondent_name")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondent_relation" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-green-600" />
                  Relation
                </Label>
                <Select
                  value={form.watch("respondent_relation") || ""}
                  onValueChange={(value: "defendant" | "opposite_party" | "respondent") => {
                    form.setValue("respondent_relation", value);
                    form.trigger("respondent_relation");
                  }}
                >
                  <SelectTrigger className="w-full h-11 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defendant">Defendant</SelectItem>
                    <SelectItem value="opposite_party">Opposite Party</SelectItem>
                    <SelectItem value="respondent">Respondent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button 
          type="submit"
          disabled={!isActive}
          className="w-full bg-gradient-to-r from-primary-green to-emerald-500 hover:from-primary-green/90 hover:to-emerald-500/90 text-white font-semibold h-12 text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Create Case & Continue
          </span>
        </Button>
      </div>
    </form>
  );
};

export default CaseBasicInfoForm;
