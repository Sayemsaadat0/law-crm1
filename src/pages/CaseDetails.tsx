"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Phone, Mail, User, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCasePdf } from "@/lib/casePdf";
import PaymentPanel from "@/components/pageComponent/cases/PaymentPanel";
import CaseTimeline from "@/components/pageComponent/cases/CaseTimeline";
import PaymentForm from "@/components/pageComponent/cases/PaymentForm";
import HearingForm from "@/components/pageComponent/cases/HearingForm";
import type { TCase, TCaseStage, Hearing } from "@/types/case.type";
import { casesApi, type CaseListItem } from "@/lib/api";
import { formatDisplayDate, formatPartyRelationLabel } from "@/lib/utils";
import { toast } from "sonner";

// Local helper to map API case shape to TCase (same as in Cases.tsx)
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

  const stageMap: Record<string, TCaseStage> = {
    active: "Active",
    disposed: "Disposed",
    resolve: "Resolve",
    archive: "Archive",
    // legacy
    left: "Archive",
  };

  return {
    id: String(apiCase.id),
    case_number: apiCase.number_of_case,
    file_number: apiCase.file_number || "",
    case_stage: stageMap[apiCase.stages?.toLowerCase() || "active"] || "Active",
    case_description: apiCase.description || "",
    case_date: apiCase.date || "",
    court_id: String(apiCase.court_id),
    court_details: apiCase.court
      ? {
          id: String(apiCase.court.id),
          name: apiCase.court.name,
          address: apiCase.court.address,
        }
      : {
          id: "",
          name: "",
          address: "",
        },
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
          // Legacy fields (may be empty now)
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
    // Parties no longer drive opposite-party display in the UI; keep fields but empty
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

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<
    { date: string; payment_for_hearing: string; amount: number } | undefined
  >(undefined);
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<
    | { title: string; serial_no: string; date: string; note: string; file?: string }
    | undefined
  >(undefined);
  const [caseData, setCaseData] = useState<TCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setCaseData(null);
        setError("Case not found");
        return;
      }

      const mapped = mapApiCaseToTCase(apiData as CaseListItem);
      setCaseData(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load case");
      setCaseData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleBack = () => {
    navigate("/dashboard/cases");
  };

  const handleHearingCreated = () => {
    fetchCase();
  };

  const handlePaymentCreated = () => {
    fetchCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary-green/30 border-t-primary-green rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData || error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Case Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {error || "Unable to load case details."}
          </p>
          <Button
            onClick={() => navigate("/dashboard/cases")}
            variant="outlineBtn"
          >
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  // Get stage badge style
  const getStageStyle = (stage: string) => {
    if (stage === "Active") {
      return "bg-primary-green text-black border-primary-green";
    } else if (stage === "Disposed") {
      return "bg-red-500 text-white border-red-500";
    } else {
      return "bg-orange-500 text-white border-orange-500";
    }
  };

  const formatDate = (dateString: string) => formatDisplayDate(dateString);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm flex items-center gap-2 text-gray-600">
        <div>
          <Button onClick={handleBack} variant="textBtn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
        <p className="hover:text-gray-900 cursor-pointer">Case</p>
        <div className="mx-2">/</div>
        <p className="text-gray-900 font-medium">
          {caseData.case_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Case Information Panel - Left and Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            {/* Case Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Case</h1>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-gray-700">
                    {caseData.case_number}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStageStyle(
                      caseData.case_stage
                    )}`}
                  >
                    {caseData.case_stage}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  downloadCasePdf(caseData);
                  toast.success("PDF downloaded");
                }}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-primary-green/50 bg-primary-green/10 text-gray-800 text-sm font-medium hover:bg-primary-green/20 hover:border-primary-green transition-colors shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>Download PDF</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Client Information (BILL TO) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  Client (BILL TO)
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">
                    {caseData.client_details.name}
                  </p>
                  <p className="text-gray-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    {caseData.client_details.address}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {caseData.client_details.phone}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {caseData.client_details.email}
                  </p>
                  {caseData.client_details.referring_firm && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Referring Firm: {caseData.client_details.referring_firm}
                    </p>
                  )}
                  {caseData.client_details.client_reference_number && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Reference No:{" "}
                      {caseData.client_details.client_reference_number}
                    </p>
                  )}
                  {caseData.client_details.billing_bank_name && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Billing Bank: {caseData.client_details.billing_bank_name}
                    </p>
                  )}
                  {caseData.client_details.details && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        Details
                      </p>
                      <p className="text-sm text-gray-700">
                        {caseData.client_details.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Party Information (OPPOSITE) - show appellant & respondent */}
              <div>
             
                <div className="space-y-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      Appellant
                    </p>
                    <p className="font-medium text-gray-900">
                      {caseData.appellant?.name || "N/A"}
                    </p>
                    {caseData.appellant?.relation && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {formatPartyRelationLabel(caseData.appellant.relation)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      Respondent
                    </p>
                    <p className="font-medium text-gray-900">
                      {caseData.respondent?.name || "N/A"}
                    </p>
                    {caseData.respondent?.relation && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {formatPartyRelationLabel(caseData.respondent.relation)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Case Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Case Date
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {caseData.case_date
                    ? formatDate(caseData.case_date)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Court
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {caseData.court_details.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
                  Lawyer
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {caseData.lawyer_details.name}
                </p>
              </div>
            </div>

            {/* Notes/Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                Case Description
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  {caseData.case_description}
                </p>
              </div>
            </div>

            {/* Client Fee Schedule Files */}
            {caseData.client_details.fee_schedule_files &&
              caseData.client_details.fee_schedule_files.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                    Fee Schedule (Bills)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {caseData.client_details.fee_schedule_files.map(
                      (url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-primary-green/40 text-sm text-primary-green hover:bg-primary-green/5"
                        >
                          <FileText className="w-4 h-4" />
                          Bill {idx + 1}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Right Sidebar - Payment and Timeline */}
        <div className="space-y-6">
          {/* Payment Panel Component */}
          <PaymentPanel
            payments={caseData.payments}
            onAddPayment={() => {
              setSelectedPayment(undefined);
              setPaymentDialogOpen(true);
            }}
            onEditPayment={(payment: {
              paid_date: string;
              paid_amount: number;
            }) => {
              setSelectedPayment({
                date: payment.paid_date,
                payment_for_hearing: "",
                amount: payment.paid_amount,
              });
              setPaymentDialogOpen(true);
            }}
          />

          {/* Case Timeline Component */}
          <CaseTimeline
            hearings={caseData.hearings}
            courtName={caseData.court_details.name}
            onAddHearing={() => {
              setSelectedHearing(undefined);
              setHearingDialogOpen(true);
            }}
            onEditHearing={(hearing: Hearing) => {
              const fileDisplay = Array.isArray(hearing.file)
                ? hearing.file.join(", ")
                : hearing.file;
              setSelectedHearing({
                title: hearing.title,
                serial_no: hearing.serial_no,
                date: hearing.hearing_date,
                note: hearing.details,
                file: fileDisplay,
              });
              setHearingDialogOpen(true);
            }}
          />
        </div>
      </div>

      {/* Payment Form Dialog */}
      <PaymentForm
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        instance={selectedPayment}
        hearings={caseData.hearings}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        fileNumber={caseData.file_number}
        onCreated={handlePaymentCreated}
      />

      {/* Hearing Form Dialog */}
      <HearingForm
        open={hearingDialogOpen}
        onOpenChange={setHearingDialogOpen}
        instance={selectedHearing}
        caseId={caseData.id}
        caseNumber={caseData.case_number}
        fileNumber={caseData.file_number}
        onCreated={handleHearingCreated}
      />
    </div>
  );
}
