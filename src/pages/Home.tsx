"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, CheckCircle2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addDays, compareAsc, format, startOfDay } from "date-fns";
import { casesApi, dashboardApi, type CaseListItem, type DashboardStats } from "@/lib/api";
import { formatDisplayDate } from "@/lib/utils";
import type { TCase, TCaseStage } from "@/types/case.type";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper function to map API case item to TCase for dashboard
const mapApiCaseToTCase = (apiCase: CaseListItem): TCase => {
  const raw: any = apiCase as any;

  // Support both camelCase and snake_case relation keys from Laravel
  const clients = raw.caseClients ?? raw.case_clients;
  const parties = raw.caseParties ?? raw.case_parties;
  const hearingsRaw = raw.caseHearings ?? raw.case_hearings;
  const paymentsRaw = raw.casePayments ?? raw.case_payments;

  const firstClient = Array.isArray(clients) ? clients[0] : undefined;
  const firstParty = Array.isArray(parties) ? parties[0] : undefined;

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

  // Map backend status to UI case stage
  const statusMap: Record<string, TCaseStage> = {
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
    file_number: apiCase.file_number ?? apiCase.number_of_file ?? "",
    case_stage: statusMap[(apiCase as any).status?.toLowerCase() || "active"] || "Active",
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
          account_number: firstClient.billing_account_number || "",
          account_name: firstClient.billing_account_name || "",
          account_id: firstClient.billing_bank_name || "",
          description: firstClient.client_description || "",
          branch: firstClient.billing_branch_name || "",
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
        },
    party_id: firstParty ? String(firstParty.id) : "",
    party_details: firstParty
      ? {
          id: String(firstParty.id),
          name: firstParty.party_name,
          email: firstParty.party_email || "",
          phone: firstParty.party_phone || "",
          address: firstParty.party_address || "",
          details: firstParty.party_description || "",
          thumbnail: "",
          reference: firstParty.reference || "",
        }
      : {
          id: "",
          name: "",
          email: "",
          phone: "",
          address: "",
          details: "",
          thumbnail: "",
          reference: "",
        },
    hearings,
    payments,
  };
};

/** Hearings scheduled from today (inclusive) through the next 7 days (exclusive end). */
function isHearingInNext7Days(hearingDateStr: string, todayStart: Date): boolean {
  const d = startOfDay(new Date(hearingDateStr));
  const end = addDays(todayStart, 7);
  return d >= todayStart && d < end;
}

function getEarliestHearingInWindow(caseItem: TCase, todayStart: Date): string | null {
  const end = addDays(todayStart, 7);
  const inWindow = (caseItem.hearings || [])
    .map((h) => ({ d: startOfDay(new Date(h.hearing_date)), raw: h.hearing_date }))
    .filter(({ d }) => d >= todayStart && d < end)
    .sort((a, b) => compareAsc(a.d, b.d));
  return inWindow[0]?.raw ?? null;
}

const Home = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [cases, setCases] = useState<TCase[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch dashboard stats and cases in parallel
        const [statsResponse, casesResponse] = await Promise.all([
          dashboardApi.getStats(),
          casesApi.getAll({
            with_clients: true,
            with_parties: true,
            with_hearings: true,
            with_payments: true,
            per_page: 100,
          }),
        ]);

        // Set dashboard stats
        if (statsResponse.data) {
          setDashboardStats(statsResponse.data.data);
        }

        // Process cases
        if (casesResponse.data) {
          const items = casesResponse.data.data || [];
          const mapped = items.map(mapApiCaseToTCase);
          setCases(mapped);
        }
      } catch (err: any) {
        const message = err?.message || "Failed to load dashboard data";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Get stage badge style
  const getStageStyle = (stage: string) => {
    if (stage === "Active") {
      return "bg-primary/10 text-primary border-primary/20";
    } else if (stage === "Disposed") {
      return "bg-red-100 text-red-800 border-red-200";
    } else {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  // Process data for Case Stage Pie Chart
  const caseStageData = cases.reduce((acc, caseItem) => {
    const stage = caseItem.case_stage;
    const existing = acc.find((item) => item.name === stage);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: stage, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const PIE_COLORS = ["#3b82f6", "#ef4444", "#f97316", "#10b981"];

  // Process data for Cases by Court Bar Chart
  const casesByCourt = cases.reduce((acc, caseItem) => {
    const courtName = caseItem.court_details.name;
    const existing = acc.find((item) => item.name === courtName);
    if (existing) {
      existing.cases += 1;
    } else {
      acc.push({ name: courtName, cases: 1 });
    }
    return acc;
  }, [] as { name: string; cases: number }[]);

  // Process data for Cases by Lawyer Bar Chart
  const casesByLawyer = cases.reduce((acc, caseItem) => {
    const lawyerName = caseItem.lawyer_details.name;
    const existing = acc.find((item) => item.name === lawyerName);
    if (existing) {
      existing.cases += 1;
    } else {
      acc.push({ name: lawyerName, cases: 1 });
    }
    return acc;
  }, [] as { name: string; cases: number }[]);

  // Process data for Monthly Revenue Line Chart
  const monthlyRevenue = cases.reduce((acc, caseItem) => {
    caseItem.payments.forEach((payment) => {
      const date = new Date(payment.paid_date);
      const month = format(date, "MMM yyyy");
      const existing = acc.find((item) => item.month === month);
      if (existing) {
        existing.revenue += payment.paid_amount;
      } else {
        acc.push({ month, revenue: payment.paid_amount, date: date.getTime() });
      }
    });
    return acc;
  }, [] as { month: string; revenue: number; date: number }[]);

  // Sort monthly revenue by date
  monthlyRevenue.sort((a, b) => {
    return a.date - b.date;
  });

  const todayStart = startOfDay(new Date());

  // Upcoming cases: at least one hearing in the next 7 days
  const upcomingCases = cases
    .filter((caseItem) => {
      if (!caseItem.hearings || caseItem.hearings.length === 0) return false;
      return caseItem.hearings.some((h) => isHearingInNext7Days(h.hearing_date, todayStart));
    })
    .sort((a, b) => {
      const rawA = getEarliestHearingInWindow(a, todayStart);
      const rawB = getEarliestHearingInWindow(b, todayStart);
      if (!rawA && !rawB) return 0;
      if (!rawA) return 1;
      if (!rawB) return -1;
      return compareAsc(new Date(rawA), new Date(rawB));
    })
    .slice(0, 10);

  // Calculate completed cases (disposed cases)
  const completedCasesCount = dashboardStats?.cases.disposed || 0;
  
  const upcomingCasesCount = cases.filter((caseItem) => {
    if (!caseItem.hearings || caseItem.hearings.length === 0) return false;
    return caseItem.hearings.some((h) => isHearingInNext7Days(h.hearing_date, todayStart));
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary-green/30 border-t-primary-green rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-gray-900">
            Failed to load dashboard
          </p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Welcome Section */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Welcome back 👋</h1>
        <Link
          to="/dashboard/cases/create"
          className="inline-flex justify-end sm:justify-start shrink-0 max-w-full"
        >
          <Button
            type="button"
            className="inline-flex h-9 min-h-9 max-w-full items-center justify-center gap-2 px-3 sm:px-4 py-0 text-sm leading-none bg-primary-green text-black hover:bg-primary-green/90 whitespace-nowrap md:py-0 [&_svg]:shrink-0"
          >
            <Plus className="size-4" aria-hidden />
            Add Case
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Cases Card - Light Blue */}
        <Link to="/dashboard/cases" className="bg-linear-to-br from-blue-400 via-blue-50 to-blue-100 rounded-xl sm:rounded-2xl border-2 border-blue-300/40 shadow-lg sm:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-500 p-4 sm:p-7 relative overflow-hidden group cursor-pointer block">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-blue-300/40 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 group-hover:scale-150 group-hover:bg-blue-400/50 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200/30 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16 group-hover:scale-125 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Cases</p>
                </div>
                <h3 className="text-3xl sm:text-5xl font-extrabold mb-1 sm:mb-2 bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {dashboardStats?.cases.total || cases.length}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-blue-600/80 flex items-center gap-1">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"></span>
                  All registered cases
                </p>
              </div>
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 shadow-md sm:shadow-lg group-hover:shadow-blue-500/50 group-hover:rotate-6 transition-all duration-500 border-2 border-blue-400/50">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Link>

        {/* Upcoming Cases Card - Light Pink */}
        <Link to="/dashboard/cases" className="bg-linear-to-br from-pink-400 via-pink-50 to-pink-100 rounded-xl sm:rounded-2xl border-2 border-pink-300/40 shadow-lg sm:shadow-2xl hover:shadow-pink-500/20 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-500 p-4 sm:p-7 relative overflow-hidden group cursor-pointer block">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-pink-300/40 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 group-hover:scale-150 group-hover:bg-pink-400/50 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-pink-200/30 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16 group-hover:scale-125 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-pink-500 animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-pink-700 uppercase tracking-wide">Upcoming Cases</p>
                </div>
                <h3 className="text-3xl sm:text-5xl font-extrabold mb-1 sm:mb-2 bg-linear-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                  {upcomingCasesCount}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-pink-600/80 flex items-center gap-1">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-pink-500"></span>
                  Scheduled hearings
                </p>
              </div>
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-linear-to-br from-pink-500 to-pink-600 shadow-md sm:shadow-lg group-hover:shadow-pink-500/50 group-hover:rotate-6 transition-all duration-500 border-2 border-pink-400/50">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Link>

        {/* Completed Cases Card - Light Green */}
        <Link to="/dashboard/cases" className="bg-linear-to-br from-green-400 via-green-50 to-green-100 rounded-xl sm:rounded-2xl border-2 border-green-300/40 shadow-lg sm:shadow-2xl hover:shadow-green-500/20 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-500 p-4 sm:p-7 relative overflow-hidden group cursor-pointer block">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-green-300/40 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20 group-hover:scale-150 group-hover:bg-green-400/50 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200/30 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16 group-hover:scale-125 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-xs sm:text-sm font-semibold text-green-700 uppercase tracking-wide">Completed Cases</p>
                </div>
                <h3 className="text-3xl sm:text-5xl font-extrabold mb-1 sm:mb-2 bg-linear-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {completedCasesCount}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-green-600/80 flex items-center gap-1">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></span>
                  Resolved cases
                </p>
              </div>
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-linear-to-br from-green-500 to-green-600 shadow-md sm:shadow-lg group-hover:shadow-green-500/50 group-hover:rotate-6 transition-all duration-500 border-2 border-green-400/50">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </Link>
      </div>

      {/* Upcoming Cases — next 7 days (above charts) */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">Upcoming Cases</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Hearings scheduled in the next 7 days
          </p>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-primary-green border-b border-gray-200">
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      SL
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      Case Id
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black hidden sm:table-cell">
                      Number of Case
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      Next hearing
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      Case Stage
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black hidden md:table-cell">
                      Payment Status
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      Client
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black hidden lg:table-cell">
                      Party
                    </th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-black">
                      Lawyer
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                      No upcoming cases in the next 7 days
                    </td>
                  </tr>
                ) : (
                  upcomingCases.map((caseItem, index) => {
                    const nextHearingRaw = getEarliestHearingInWindow(caseItem, todayStart);
                  return (
                    <tr
                      key={caseItem.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {index + 1}
                        </span>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xs sm:text-sm font-medium">
                              {caseItem.case_number}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500">
                              {caseItem.file_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        <p className="text-xs sm:text-sm font-medium">
                          {caseItem.case_number}
                        </p>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <span className="text-xs sm:text-sm font-medium text-gray-800">
                          {nextHearingRaw ? formatDisplayDate(nextHearingRaw) : "—"}
                        </span>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span
                          className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${getStageStyle(
                            caseItem.case_stage
                          )}`}
                        >
                          {caseItem.case_stage}
                        </span>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700">
                          N/A
                        </span>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <p className="text-xs sm:text-sm font-medium">
                          {caseItem.client_details.name}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          {caseItem.client_details.account_id}
                        </p>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3 hidden lg:table-cell">
                        <p className="text-xs sm:text-sm font-medium">
                          {caseItem.party_details.name}
                        </p>
                      </td>

                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <p className="text-xs sm:text-sm font-medium">
                          {caseItem.lawyer_details.name}
                        </p>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Case Stage Distribution - Pie Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Case Stage Distribution</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <PieChart>
              <Pie
                data={caseStageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name
                }
                outerRadius={isMobile ? 70 : 100}
                fill="#8884d8"
                dataKey="value"
              >
                {caseStageData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Court - Bar Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Cases by Court</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <BarChart data={casesByCourt}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={isMobile ? -90 : -45}
                textAnchor="end"
                height={isMobile ? 120 : 100}
                fontSize={isMobile ? 10 : 12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cases" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue - Line Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `৳${Number(value ?? 0).toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Lawyer - Bar Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Cases by Lawyer</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <BarChart data={casesByLawyer}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 80 : 0}
                fontSize={isMobile ? 10 : 12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cases" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Home;
