"use client";

import type { TCase } from "@/types/case.type";
import {
  X,
  Calendar,
  FileText,
  User,
  DollarSign,
  Scale,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CaseStageBadge } from "./CaseStageBadge";
import { formatDisplayDate } from "@/lib/utils";

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: TCase | null;
}

function getFirstFileUrl(file?: string | string[]) {
  if (!file) return undefined;
  return Array.isArray(file) ? file[0] : file;
}

export function CaseDetailsModal({
  isOpen,
  onClose,
  caseData,
}: CaseDetailsModalProps) {
  if (!caseData) return null;

  const totalPayments = caseData.payments.reduce(
    (sum, p) => sum + p.paid_amount,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* HEADER */}
        <DialogHeader className="bg-primary text-primary-foreground px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 p-2 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {caseData.case_number}
                </DialogTitle>
                <p className="text-sm opacity-90">{caseData.file_number}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="p-8 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 border bg-primary/5 border-primary/20">
              <p className="text-sm font-semibold text-primary mb-2">
                Case Stage
              </p>
              <CaseStageBadge stage={caseData.case_stage} />
            </div>

            <div className="rounded-lg p-4 border bg-orange-50 border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-2">
                Total Payments
              </p>
              <p className="text-2xl font-bold text-orange-900">
                ${totalPayments.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg p-4 border bg-green-50 border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">
                Hearings
              </p>
              <p className="text-2xl font-bold text-green-900">
                {caseData.hearings.length}
              </p>
            </div>
          </div>

          {/* CASE INFO */}
          <Section
            title="Case Information"
            icon={<Scale className="w-5 h-5 text-primary" />}
          >
            <Item label="Description" value={caseData.case_description} />
            <Item label="Court ID" value={caseData.court_id} mono />
          </Section>

          {/* CLIENT */}
          <Section
            title="Client Details"
            icon={<User className="w-5 h-5 text-orange-600" />}
          >
            <Item label="Client Name" value={caseData.client_details.name} />
            <Item
              label="Referring Firm"
              value={caseData.client_details.referring_firm || "N/A"}
            />
            <Item
              label="Client Reference Number"
              value={caseData.client_details.client_reference_number || "N/A"}
            />
            <Item
              label="Billing Bank"
              value={
                caseData.client_details.billing_bank_name ||
                caseData.client_details.account_id ||
                "N/A"
              }
            />
            <Item
              label="Description"
              value={caseData.client_details.description}
              full
            />

            {/* Fee Schedule files */}
            {caseData.client_details.fee_schedule_files &&
              caseData.client_details.fee_schedule_files.length > 0 && (
                <div className="md:col-span-2 mt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Fee Schedule Files
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {caseData.client_details.fee_schedule_files.map(
                      (url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-primary/30 text-primary text-xs hover:bg-primary/5"
                        >
                          <FileText className="w-3 h-3" />
                          Bill {idx + 1}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
          </Section>

          {/* HEARINGS */}
          <Section
            title={`Hearings (${caseData.hearings.length})`}
            icon={<Calendar className="w-5 h-5 text-primary" />}
          >
            {caseData.hearings.length === 0 ? (
              <EmptyState
                icon={<Calendar className="w-8 h-8" />}
                text="No hearings scheduled"
              />
            ) : (
              caseData.hearings.map((h, i) => {
                const fileUrl = getFirstFileUrl(h.file);
                return (
                  <div
                    key={i}
                    className="border rounded-lg p-4 bg-primary/5 border-primary/20"
                  >
                    <p className="font-semibold text-sm text-primary">
                      {formatDisplayDate(h.hearing_date)}
                    </p>
                    <p className="text-muted-foreground mt-1">{h.details}</p>

                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <FileText className="w-4 h-4" /> View File
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </Section>

          {/* PAYMENTS */}
          <Section
            title={`Payments (${caseData.payments.length})`}
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
          >
            {caseData.payments.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-8 h-8" />}
                text="No payments recorded"
              />
            ) : (
              <>
                {caseData.payments.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border rounded-lg p-4 bg-green-50 border-green-200"
                  >
                    <p className="text-sm font-semibold text-green-800">
                      {formatDisplayDate(p.paid_date)}
                    </p>
                    <p className="text-lg font-bold">
                      ${p.paid_amount.toLocaleString()}
                    </p>
                  </div>
                ))}

                <div className="mt-3 p-4 border rounded-lg bg-green-100 border-green-300 flex justify-between">
                  <span className="font-semibold">Total Paid</span>
                  <span className="text-xl font-bold">
                    ${totalPayments.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </Section>
        </div>

        {/* FOOTER */}
        <div className="border-t bg-muted px-8 py-4 flex justify-end sticky bottom-0">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------- helper components -------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        {icon}
        {title}
      </h3>
      <div className="grid gap-4 bg-muted/30 border rounded-lg p-6">
        {children}
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="text-sm font-semibold text-muted-foreground mb-1">
        {label}
      </p>
      <p className={mono ? "font-mono" : ""}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="md:col-span-2 text-center py-6">
      <div className="mx-auto mb-2 text-muted-foreground">{icon}</div>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
