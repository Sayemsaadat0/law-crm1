"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CaseStageBadge } from "@/components/dashboard/cases/CaseStageBadge";
import { CaseActionDropdown } from "@/components/dashboard/cases/CaseActionDropdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HearingForm from "@/components/pageComponent/cases/HearingForm";
import PaymentForm from "@/components/pageComponent/cases/PaymentForm";
import type { TCase } from "@/types/case.type";
import { casesApi, type CaseListItem } from "@/lib/api";
import { toast } from "sonner";

// Tab array with title and value
const caseTabs = [
  { title: "All", value: "" },
  { title: "Active", value: "active" },
  { title: "Disposed", value: "disposed" },
  { title: "Archive", value: "archive" },
];

// Helper function to map API case to TCase
const mapApiCaseToTCase = (apiCase: CaseListItem): TCase => {
  const raw: any = apiCase as any;

  // Support both camelCase and snake_case relation keys from Laravel
  const clients = raw.caseClients ?? raw.case_clients;
  const hearingsRaw = raw.caseHearings ?? raw.case_hearings;
  const paymentsRaw = raw.casePayments ?? raw.case_payments;

  // Get first client, party, hearing, payment
  const firstClient = Array.isArray(clients) ? clients[0] : undefined;
  const hearings = Array.isArray(hearingsRaw)
    ? hearingsRaw.map((h: any) => ({
        title: h.title,
        serial_no: h.serial_number,
        hearing_date: h.date,
        details: h.note || "",
        file: h.file,
      }))
    : [];
  const payments = Array.isArray(paymentsRaw)
    ? paymentsRaw.map((p: any) => ({
    paid_amount: p.amount,
    paid_date: p.date,
    }))
    : [];

  // Map stages/status to UI case stage
  const stageMap: Record<string, "Active" | "Disposed" | "Resolve" | "Archive"> = {
    active: "Active",
    disposed: "Disposed",
    resolve: "Resolve",
    archive: "Archive",
    // Backwards compatibility for legacy 'left' status
    left: "Archive",
  };

  return {
    id: String(apiCase.id),
    case_number: apiCase.number_of_case,
    file_number: apiCase.file_number || "",
    case_stage: stageMap[apiCase.stages?.toLowerCase() || "active"] || "Active",
    case_description: apiCase.description || "",
    case_date: apiCase.date || "",
    court_id: apiCase.court_id ? String(apiCase.court_id) : "",
    court_details: apiCase.court ? {
      id: String(apiCase.court.id),
      name: apiCase.court.name,
      address: apiCase.court.address,
    } : {
      id: "",
      name: "",
      address: "",
    },
    lawyer_id: apiCase.lawyer_id ? String(apiCase.lawyer_id) : "",
    lawyer_details: apiCase.lawyer ? {
      id: String(apiCase.lawyer.id),
      name: apiCase.lawyer.name,
      email: apiCase.lawyer.email || "",
      phone: apiCase.lawyer.mobile || "",
      address: "",
      details: "",
      thumbnail: apiCase.lawyer.image || "",
    } : {
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
          // Legacy billing fields (may be empty with new API)
          account_number: firstClient.billing_account_number || "",
          account_name: firstClient.billing_account_name || "",
          account_id: firstClient.billing_bank_name || "",
          description: firstClient.client_description || "",
          branch: firstClient.billing_branch_name || "",
          // New client structure fields
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
    // Parties are no longer used on the list view; keep fields but leave empty
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

export default function CasesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [cases, setCases] = useState<TCase[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [hearingDialogOpen, setHearingDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TCase | null>(null);

  // Fetch cases
  const fetchCases = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const stages = activeTab || undefined;
      
      const response = await casesApi.getAll({
        search: searchQuery || undefined,
        stages,
        with_clients: true,
        with_hearings: true,
        with_payments: true,
        per_page: 15,
        page,
      });

      if (response.data) {
        // Map all cases returned from API (no filtering)
        const mappedCases = response.data.data.map(mapApiCaseToTCase);
        setCases(mappedCases);
        setPagination({
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || 15,
          total: response.data.total || 0,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch cases");
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  // Effects
  useEffect(() => {
    fetchCases(currentPage);
  }, [currentPage, fetchCases]);

  // Debounce search and reset filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleNewHearing = (caseData: TCase) => {
    setSelectedCase(caseData);
    setHearingDialogOpen(true);
  };

  const handleReceivePayment = (caseData: TCase) => {
    setSelectedCase(caseData);
    setPaymentDialogOpen(true);
  };

  const handleViewCase = (caseData: TCase) => {
    navigate(`/dashboard/cases/${caseData.id}`);
  };

  const handleEditCase = (caseData: TCase) => {
    navigate(`/dashboard/cases/edit/${caseData.id}`);
  };

  const handleHearingCreated = () => {
    // Refresh cases so that new hearing is reflected in previous/next date & payment status
    fetchCases(currentPage);
  };

  const handlePaymentCreated = () => {
    // Refresh cases so that payment status is updated
    fetchCases(currentPage);
  };

  // Get previous and next hearing dates
  const getPreviousDate = (caseItem: TCase): string => {
    if (!caseItem.hearings || caseItem.hearings.length === 0) return "N/A";
    const sortedHearings = [...caseItem.hearings].sort((a, b) => 
      new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime()
    );
    const pastHearings = sortedHearings.filter(h => 
      new Date(h.hearing_date) < new Date()
    );
    if (pastHearings.length === 0) return "N/A";
    return new Date(pastHearings[pastHearings.length - 1].hearing_date).toLocaleDateString();
  };

  const getNextDate = (caseItem: TCase): string => {
    if (!caseItem.hearings || caseItem.hearings.length === 0) return "N/A";
    const sortedHearings = [...caseItem.hearings].sort((a, b) => 
      new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime()
    );
    const futureHearings = sortedHearings.filter(h => 
      new Date(h.hearing_date) >= new Date()
    );
    if (futureHearings.length === 0) return "N/A";
    return new Date(futureHearings[0].hearing_date).toLocaleDateString();
  };

  // Calculate payment status
  const getPaymentStatus = (caseItem: TCase): string => {
    if (!caseItem.payments || caseItem.payments.length === 0) return "No Payment";
    const totalPaid = caseItem.payments.reduce((sum, p) => sum + p.paid_amount, 0);
    return totalPaid > 0 ? `Paid: ${totalPaid}` : "No Payment";
  };

  return (
    <div className="space-y-6">
      {/* Title and Add Case Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
        <Link to="/dashboard/cases/create">
          <Button className="h-8 px-3 text-xs text-black bg-primary-green hover:bg-primary-green/90 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Case</span>
          </Button>
        </Link>
      </div>

      {/* Tabs and Filters Section */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-10 bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 gap-1.5">
            {caseTabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="h-8 px-4 rounded-lg font-medium text-sm transition-all bg-transparent text-gray-700 hover:bg-gray-50 data-[state=active]:bg-primary-green data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              >
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Right Side - Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 lg:w-96 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg border border-border shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary-green" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-green border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    SL
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Case Id
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Number of Case
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Appellant
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Respondent
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Previous Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Next Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Case Stage
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Payment Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Client
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    Lawyer
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-8 text-center text-sm text-muted-foreground"
                    >
                      No cases found
                    </td>
                  </tr>
                ) : (
                  cases.map((caseItem, index) => {
                    const previousDate = getPreviousDate(caseItem);
                    const nextDate = getNextDate(caseItem);
                    const paymentStatus = getPaymentStatus(caseItem);

                    return (
                      <tr
                        key={caseItem.id}
                        className="hover:bg-muted/10 transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(pagination.current_page - 1) * pagination.per_page + index + 1}
                          </span>
                        </td>

                        <td className="px-3 py-2.5">
                          <Link
                            to={`/dashboard/cases/${caseItem.id}`}
                            className="flex items-center gap-1.5 hover:text-primary-green transition-colors cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-medium">
                                {caseItem.case_number}
                              </p>
                              {caseItem.file_number && (
                                <p className="text-xs text-muted-foreground">
                                  {caseItem.file_number}
                                </p>
                              )}
                            </div>
                          </Link>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium">{caseItem.case_number}</p>
                        </td>

                        <td className="px-3 py-2.5">
                          {caseItem.appellant?.name ? (
                            <>
                              <p className="text-xs font-medium">
                                {caseItem.appellant.name}
                              </p>
                              {caseItem.appellant.relation && (
                                <p className="text-xs text-muted-foreground">
                                  {caseItem.appellant.relation}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">N/A</p>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          {caseItem.respondent?.name ? (
                            <>
                              <p className="text-xs font-medium">
                                {caseItem.respondent.name}
                              </p>
                              {caseItem.respondent.relation && (
                                <p className="text-xs text-muted-foreground">
                                  {caseItem.respondent.relation}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">N/A</p>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="text-xs text-muted-foreground">{previousDate}</p>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="text-xs text-muted-foreground">{nextDate}</p>
                        </td>

                        <td className="px-3 py-2.5">
                          <CaseStageBadge stage={caseItem.case_stage} />
                        </td>

                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {paymentStatus}
                          </span>
                        </td>

                        <td className="px-3 py-2.5">
                          {caseItem.client_details.name ? (
                            <>
                              <p className="text-xs font-medium">
                                {caseItem.client_details.name}
                              </p>
                              {caseItem.client_details.account_id && (
                                <p className="text-xs text-muted-foreground">
                                  {caseItem.client_details.account_id}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">N/A</p>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          {caseItem.lawyer_details.name ? (
                            <p className="text-xs font-medium">
                              {caseItem.lawyer_details.name}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">N/A</p>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center">
                            <CaseActionDropdown
                              caseData={caseItem}
                              onView={handleViewCase}
                              onEdit={handleEditCase}
                              onReceivePayment={handleReceivePayment}
                              onNewHearing={handleNewHearing}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
              {pagination.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outlineBtn"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="outlineBtn"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                disabled={pagination.current_page === pagination.last_page || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hearing Form Dialog */}
      {selectedCase && (
        <HearingForm
          open={hearingDialogOpen}
          onOpenChange={setHearingDialogOpen}
          caseId={selectedCase.id}
          caseNumber={selectedCase.case_number}
          fileNumber={selectedCase.file_number}
          onCreated={handleHearingCreated}
        />
      )}

      {/* Payment Form Dialog */}
      {selectedCase && (
        <PaymentForm
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          hearings={selectedCase.hearings}
          caseId={selectedCase.id}
          caseNumber={selectedCase.case_number}
          fileNumber={selectedCase.file_number}
          onCreated={handlePaymentCreated}
        />
      )}
    </div>
  );
}
