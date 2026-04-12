"use client";

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Scale,
  Eye,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { TCase, TCaseStage } from "@/types/case.type";
import {
  casesApi,
  caseClientsApi,
  courtsApi,
  usersApi,
  type CaseListItem,
  type Court,
  type UserListItem,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDisplayDate, formatIsoDateInput } from "@/lib/utils";
import { CaseStageBadge } from "@/components/dashboard/cases/CaseStageBadge";
import PaymentPanel from "@/components/pageComponent/cases/PaymentPanel";
import CaseTimeline from "@/components/pageComponent/cases/CaseTimeline";
import PaymentForm from "@/components/pageComponent/cases/PaymentForm";
import HearingForm from "@/components/pageComponent/cases/HearingForm";
import { toast } from "sonner";

// ---------- helpers ----------

const stageMapFromApi: Record<string, TCaseStage> = {
  active: "Active",
  disposed: "Disposed",
  resolve: "Resolve",
  archive: "Archive",
  // legacy value
  left: "Archive",
};

const mapApiCaseToTCase = (apiCase: CaseListItem): TCase => {
  const raw: any = apiCase as any;

  const firstClient = (raw.caseClients ?? raw.case_clients)?.[0];
  const hearingsArr = raw.caseHearings ?? raw.case_hearings;
  const paymentsArr = raw.casePayments ?? raw.case_payments;

  const hearings =
    Array.isArray(hearingsArr)
      ? hearingsArr.map((h: any) => ({
          title: h.title,
          serial_no: h.serial_number,
          hearing_date: h.date,
          details: h.note || "",
          file: h.file,
        }))
      : [];

  const payments =
    Array.isArray(paymentsArr)
      ? paymentsArr.map((p: any) => ({
          paid_amount: p.amount,
          paid_date: p.date,
        }))
      : [];

  return {
    id: String(apiCase.id),
    // Ensure numeric fields from backend are coerced to strings for the UI/forms
    case_number: apiCase.number_of_case !== undefined && apiCase.number_of_case !== null
      ? String(apiCase.number_of_case)
      : "",
    file_number:
      (apiCase as any).file_number !== undefined && (apiCase as any).file_number !== null
        ? String((apiCase as any).file_number)
        : "",
    case_stage: stageMapFromApi[apiCase.stages?.toLowerCase() || "active"] || "Active",
    case_description: apiCase.description || "",
    case_date: apiCase.date || "",
    court_id: String(apiCase.court_id),
    court_details: apiCase.court
      ? {
          id: String(apiCase.court.id),
          name: apiCase.court.name,
          address: apiCase.court.address,
        }
      : { id: "", name: "", address: "" },
    lawyer_id: String(apiCase.lawyer_id),
    lawyer_details: apiCase.lawyer
      ? {
          id: String(apiCase.lawyer.id),
          name: apiCase.lawyer.name,
          email: apiCase.lawyer.email || "",
          phone: apiCase.lawyer.mobile || "",
          address: "",
          details: "",
          thumbnail: apiCase.lawyer.image || "",
        }
      : {
          id: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          details: "",
          thumbnail: "",
        },
    client_id: firstClient ? String(firstClient.id) : "",
    client_details: firstClient
      ? {
          id: String(firstClient.id),
          name: firstClient.client_name,
          email: firstClient.client_email || "",
          phone: firstClient.client_phone || "",
          address: firstClient.client_address || "",
          details: "",
          thumbnail: "",
          // Legacy billing fields
          account_number: firstClient.billing_account_number || "",
          account_name: firstClient.billing_account_name || "",
          account_id: firstClient.billing_bank_name || "",
          description: firstClient.client_description || "",
          branch: firstClient.billing_branch_name || "",
          // New fields
          referring_firm: firstClient.referring_firm || "",
          client_reference_number: firstClient.client_reference_number || "",
          billing_bank_name: firstClient.billing_bank_name || "",
          fee_schedule_files: (() => {
            const rawFee = (firstClient as any).fee_schedule;
            if (!rawFee) return [];
            if (Array.isArray(rawFee)) return rawFee;
            try {
              const parsed = JSON.parse(rawFee);
              return Array.isArray(parsed) ? parsed : [rawFee];
            } catch {
              return [rawFee];
            }
          })(),
        }
      : {
          id: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          details: "",
          thumbnail: "",
          account_number: "",
          account_name: "",
          account_id: "",
          description: "",
          branch: "",
          referring_firm: "",
          client_reference_number: "",
          billing_bank_name: "",
          fee_schedule_files: [],
        },
    // Parties are no longer used for core editing, keep empty structure to satisfy TCase
    party_id: "",
    party_details: {
      id: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      details: "",
      thumbnail: "",
      reference: "",
    },
    // New case side information from API
    appellant: {
      name: apiCase.appellant_name || "",
      relation: apiCase.appellant_relation || "",
    },
    respondent: {
      name: apiCase.respondent_name || "",
      relation: apiCase.respondent_relation || "",
    },
    hearings,
    payments,
  };
};

const caseSchema = z.object({
  date: z.string().optional(),
  number_of_file: z.string().min(1, "File number is required"),
  number_of_case: z.string().min(1, "Case number is required"),
  status: z.enum(["active", "disposed", "resolve", "archive"]).optional(),
  stage: z.string().optional(),
  court_id: z.string().min(1, "Court is required"),
  lawyer_id: z.string().min(1, "Lawyer is required"),
  description: z.string().optional(),
  // New optional fields for case sides
  appellant_name: z.string().optional(),
  appellant_relation: z.string().optional(),
  respondent_name: z.string().optional(),
  respondent_relation: z.string().optional(),
});

const clientSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_phone: z.string().optional(),
  client_address: z.string().optional(),
  billing_bank_name: z.string().optional(),
  referring_firm: z.string().optional(),
  client_reference_number: z.string().optional(),
  description: z.string().optional(),
});

type CaseFormValues = z.infer<typeof caseSchema>;
type ClientFormValues = z.infer<typeof clientSchema>;

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const iso = formatIsoDateInput(value);
  if (iso) return iso;
  if (typeof value === "string" && value.length >= 10) return value.slice(0, 10);
  return "";
};

// ---------- page ----------

export default function CaseEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [caseData, setCaseData] = useState<TCase | null>(null);
  const [rawCase, setRawCase] = useState<CaseListItem | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [lawyers, setLawyers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<
    | { title: string; serial_no: string; date: string; note: string; file?: string }
    | undefined
  >(undefined);

  const caseForm = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
  });
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  const canEdit = user?.role === "admin" || user?.role === "owner";

  const fetchCase = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const response = await casesApi.getById(Number(id));
      const apiData: any =
        response.data && (response.data as any).data
          ? (response.data as any).data
          : response.data;

      if (!apiData) {
        setError("Case not found");
        setCaseData(null);
        return;
      }

      setRawCase(apiData as CaseListItem);
      const mapped = mapApiCaseToTCase(apiData as CaseListItem);
      setCaseData(mapped);

      // Initialize forms with fetched data
      caseForm.reset({
        date: toInputDate((apiData as any).date || mapped.case_date),
        number_of_file:
          (apiData as any).number_of_file !== undefined && (apiData as any).number_of_file !== null
            ? String((apiData as any).number_of_file)
            : mapped.file_number || "",
        number_of_case: mapped.case_number,
        status: ((apiData as any).status || "active") as CaseFormValues["status"],
        stage: ((apiData as any).stages || "").toString(),
        court_id: mapped.court_id,
        lawyer_id: mapped.lawyer_id,
        description: mapped.case_description,
        appellant_name: mapped.appellant?.name || "",
        appellant_relation: mapped.appellant?.relation || "",
        respondent_name: mapped.respondent?.name || "",
        respondent_relation: mapped.respondent?.relation || "",
      });

      clientForm.reset({
        client_name: mapped.client_details.name,
        client_phone: mapped.client_details.phone || "",
        client_address: mapped.client_details.address || "",
        billing_bank_name:
          mapped.client_details.billing_bank_name ||
          mapped.client_details.account_id ||
          "",
        referring_firm: mapped.client_details.referring_firm || "",
        client_reference_number:
          mapped.client_details.client_reference_number || "",
        description: mapped.client_details.description || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load case");
      setCaseData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, caseForm, clientForm]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  // fetch courts & lawyers for selects
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [courtsRes, lawyersRes] = await Promise.all([
          courtsApi.getAll({ status: true, per_page: 100 }),
          usersApi.getAll({ role: "lawyer", per_page: 100 }),
        ]);
        if (courtsRes.data) setCourts(courtsRes.data.data || []);
        if (lawyersRes.data) setLawyers(lawyersRes.data.data || []);
      } catch (err: any) {
        console.error(err);
      }
    };
    loadOptions();
  }, []);

  const handleBack = () => {
    navigate("/dashboard/cases");
  };

  const formatDate = (dateString: string) => formatDisplayDate(dateString, "N/A");

  const onCaseSubmit = async (values: CaseFormValues) => {
    if (!rawCase || !id) return;
    try {
      const toastId = toast.loading("Updating case details...");
      await casesApi.update(Number(id), {
        date: values.date || null,
        number_of_file: Number(values.number_of_file),
        number_of_case: values.number_of_case,
        status: values.status || null,
        stages: values.stage || null,
        court_id: Number(values.court_id),
        lawyer_id: Number(values.lawyer_id),
        description: values.description || null,
        appellant_name: values.appellant_name,
        appellant_relation: values.appellant_relation,
        respondent_name: values.respondent_name,
        respondent_relation: values.respondent_relation,
      });
      toast.success("Case details updated successfully", { id: toastId });
      await fetchCase();
    } catch (err: any) {
      toast.error(err.message || "Failed to update case details");
    }
  };

  const onClientSubmit = async (values: ClientFormValues) => {
    if (!rawCase) return;
    const raw: any = rawCase as any;
    const firstClient = (raw.caseClients ?? raw.case_clients)?.[0];
    if (!firstClient) {
      toast.error("No client record found for this case.");
      return;
    }
    try {
      const toastId = toast.loading("Updating client details...");
      await caseClientsApi.update(firstClient.id, {
        client_name: values.client_name,
        client_phone: values.client_phone || null,
        client_address: values.client_address || null,
        billing_bank_name: values.billing_bank_name || null,
        referring_firm: values.referring_firm || null,
        client_reference_number: values.client_reference_number || null,
        client_description: values.description || null,
        case_id: Number(id),
      });
      toast.success("Client details updated successfully", { id: toastId });
      await fetchCase();
    } catch (err: any) {
      toast.error(err.message || "Failed to update client details");
    }
  };

  const handleHearingCreated = () => {
    fetchCase();
  };

  const handlePaymentCreated = () => {
    fetchCase();
  };

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
        <div className="bg-background rounded-lg border border-border shadow-sm p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access restricted</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Only administrators and owners can edit case details.
          </p>
          <Button variant="outlineBtn" onClick={handleBack}>
            Back to cases
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !caseData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
        <div className="bg-background rounded-lg border border-border shadow-sm p-12 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-green" />
          <p className="text-sm text-muted-foreground mt-3">Loading case...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title - consistent with Cases.tsx */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Case</h1>
        {caseData && (
          <Link to={`/dashboard/cases/${caseData.id}`}>
            <Button  className="">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>View case</span>
              </span>
            </Button>
          </Link>
        )}
      </div>

      {/* Breadcrumb - consistent with CaseDetails */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button onClick={handleBack} variant="textBtn" className="h-8 w-8 p-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Link to="/dashboard/cases" className="hover:text-foreground transition-colors">
          Cases
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Edit {caseData.case_number}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Case + Client forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case form card */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-green/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-primary-green" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {caseData.case_number}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Case ID #{caseData.id} · {caseData.case_date ? formatDate(caseData.case_date) : "No date"}
                  </p>
                </div>
              </div>
              <CaseStageBadge stage={caseData.case_stage} />
            </div>

            <form
              onSubmit={caseForm.handleSubmit(onCaseSubmit)}
              className="space-y-6"
            >
              {/* Basic info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Basic information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-date" className="text-sm">Case date</Label>
                    <Input
                      id="case-date"
                      type="date"
                      className="h-9 border-border"
                      {...caseForm.register("date")}
                    />
                    {caseForm.formState.errors.date && (
                      <p className="text-xs text-red-500">{caseForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-number" className="text-sm">File number</Label>
                    <Input
                      id="file-number"
                      placeholder="Enter file number"
                      className="h-9 border-border"
                      {...caseForm.register("number_of_file")}
                    />
                    {caseForm.formState.errors.number_of_file && (
                      <p className="text-xs text-red-500">{caseForm.formState.errors.number_of_file.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="case-number" className="text-sm">Case number</Label>
                    <Input
                      id="case-number"
                      placeholder="Enter case number"
                      className="h-9 border-border"
                      {...caseForm.register("number_of_case")}
                    />
                    {caseForm.formState.errors.number_of_case && (
                      <p className="text-xs text-red-500">{caseForm.formState.errors.number_of_case.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stage" className="text-sm">Stage</Label>
                    <Input
                      id="stage"
                      placeholder="Enter stage"
                      className="h-9 border-border"
                      {...caseForm.register("stage")}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="status" className="text-sm">Status</Label>
                    <Select
                      value={caseForm.watch("status")}
                      onValueChange={(v: "active" | "disposed" | "resolve" | "archive") =>
                        caseForm.setValue("status", v)
                      }
                    >
                      <SelectTrigger id="status" className="h-9 border-border">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="disposed">Disposed</SelectItem>
                        <SelectItem value="resolve">Resolve</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Parties
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-3 md:items-stretch">
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                    <p className="text-center text-xs font-bold uppercase tracking-wider text-foreground">
                      Appellant
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="appellant-name" className="text-sm">Name</Label>
                      <Input
                        id="appellant-name"
                        placeholder="Enter Name"
                        className="h-9 border-border"
                        {...caseForm.register("appellant_name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appellant-relation" className="text-sm">Relation</Label>
                      <Select
                        value={caseForm.watch("appellant_relation") || undefined}
                        onValueChange={(v: string) => caseForm.setValue("appellant_relation", v)}
                      >
                        <SelectTrigger id="appellant-relation" className="h-9 border-border">
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

                  <div className="flex items-center justify-center py-2 md:py-0 md:min-w-[3rem]" aria-hidden>
                    <span className="inline-flex items-center justify-center rounded-lg border-2 border-primary-green/40 bg-primary-green/10 px-4 py-2 text-lg font-black tracking-[0.2em] text-foreground">
                      VS
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                    <p className="text-center text-xs font-bold uppercase tracking-wider text-foreground">
                      Respondent
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="respondent-name" className="text-sm">Name</Label>
                      <Input
                        id="respondent-name"
                        placeholder="Enter Name"
                        className="h-9 border-border"
                        {...caseForm.register("respondent_name")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="respondent-relation" className="text-sm">Relation</Label>
                      <Select
                        value={caseForm.watch("respondent_relation") || undefined}
                        onValueChange={(v: string) => caseForm.setValue("respondent_relation", v)}
                      >
                        <SelectTrigger id="respondent-relation" className="h-9 border-border">
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

              {/* Court & lawyer */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Court & lawyer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="court" className="text-sm">Court</Label>
                    <Select
                      value={caseForm.watch("court_id")}
                      onValueChange={(v: string) => caseForm.setValue("court_id", v)}
                    >
                      <SelectTrigger id="court" className="h-9 border-border">
                        <SelectValue placeholder="Select court" />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {caseForm.formState.errors.court_id && (
                      <p className="text-xs text-red-500">{caseForm.formState.errors.court_id.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lawyer" className="text-sm">Lawyer</Label>
                    <Select
                      value={caseForm.watch("lawyer_id")}
                      onValueChange={(v: string) => caseForm.setValue("lawyer_id", v)}
                    >
                      <SelectTrigger id="lawyer" className="h-9 border-border">
                        <SelectValue placeholder="Select lawyer" />
                      </SelectTrigger>
                      <SelectContent>
                        {lawyers.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {caseForm.formState.errors.lawyer_id && (
                      <p className="text-xs text-red-500">{caseForm.formState.errors.lawyer_id.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm">Case description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  className="mt-2 min-h-[88px] border-border resize-none"
                  placeholder="Brief description of the case"
                  {...caseForm.register("description")}
                />
                {caseForm.formState.errors.description && (
                  <p className="text-xs text-red-500 mt-1">{caseForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end  border-border">
                <Button type="submit" className="">
                  Save case changes
                </Button>
              </div>
            </form>
          </div>

          {/* Client card - consistent with CaseDetails */}
          <div className="bg-white border border-border rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Client (Bill To)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Update client and billing information
            </p>

            <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Client name</Label>
                <Input
                  className="h-9 border-border"
                  placeholder="Client name"
                  {...clientForm.register("client_name")}
                />
                {clientForm.formState.errors.client_name && (
                  <p className="text-xs text-red-500">{clientForm.formState.errors.client_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Referring firm</Label>
                  <Input
                    className="h-9 border-border"
                    placeholder="Referring firm"
                    {...clientForm.register("referring_firm")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Client reference number</Label>
                  <Input
                    className="h-9 border-border"
                    placeholder="Reference number"
                    {...clientForm.register("client_reference_number")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Phone</Label>
                <Input
                  className="h-9 border-border"
                  placeholder="Phone number"
                  {...clientForm.register("client_phone")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Address</Label>
                <Textarea
                  rows={2}
                  className="min-h-[60px] border-border resize-none"
                  placeholder="Client address"
                  {...clientForm.register("client_address")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Billing bank name</Label>
                <Input
                  className="h-9 border-border"
                  placeholder="Billing bank name"
                  {...clientForm.register("billing_bank_name")}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea
                  rows={2}
                  className="min-h-[60px] border-border resize-none"
                  placeholder="Additional notes"
                  {...clientForm.register("description")}
                />
              </div>

              <div className="flex justify-end ">
                <Button type="submit">
                  Save client
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right sidebar: summary, payments, hearings */}
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Quick summary
            </p>
            <p className="text-sm font-medium text-gray-900 mb-3">
              {caseData.hearings.length} hearings · {caseData.payments.length} payments
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-green shrink-0" />
                <span>{caseData.case_date ? formatDate(caseData.case_date) : "No date"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-green shrink-0" />
                <span className="truncate">{caseData.court_details.name || "No court"}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-green shrink-0" />
                <span>
                  {caseData.payments.reduce((s, p) => s + p.paid_amount, 0).toLocaleString()} paid
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-green/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary-green" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
                <p className="text-xs text-muted-foreground">Manage payments for this case</p>
              </div>
            </div>
            <PaymentPanel
              payments={caseData.payments}
              onAddPayment={() => setPaymentDialogOpen(true)}
              onEditPayment={() => setPaymentDialogOpen(true)}
            />
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-green/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-green" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Hearings</h3>
                <p className="text-xs text-muted-foreground">Add or edit hearings</p>
              </div>
            </div>
            <CaseTimeline
              hearings={caseData.hearings}
              courtName={caseData.court_details.name}
              onAddHearing={() => {
                setSelectedHearing(undefined);
                setHearingDialogOpen(true);
              }}
              onEditHearing={(hearing) => {
                setSelectedHearing({
                  title: hearing.title,
                  serial_no: hearing.serial_no,
                  date: hearing.hearing_date,
                  note: hearing.details,
                  file: Array.isArray(hearing.file) ? hearing.file[0] : hearing.file,
                });
                setHearingDialogOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      <HearingForm
        open={hearingDialogOpen}
        onOpenChange={setHearingDialogOpen}
        instance={selectedHearing}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        fileNumber={caseData.file_number}
        onCreated={handleHearingCreated}
      />

      <PaymentForm
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        hearings={caseData.hearings}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        fileNumber={caseData.file_number}
        onCreated={handlePaymentCreated}
      />
    </div>
  );
}


