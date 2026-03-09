"use client";

import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/types/case.type";

interface PaymentPanelProps {
  payments: Payment[];
  onAddPayment: () => void;
  onEditPayment: (payment: Payment) => void;
}

export default function PaymentPanel({ payments, onAddPayment, onEditPayment }: PaymentPanelProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Payment</h2>
        <Button
          onClick={onAddPayment}
          size="sm"
          className="bg-primary-green text-black hover:bg-primary-green/90"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Payment History */}
      <div className="space-y-2">
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No payments yet</p>
        ) : (
          payments.map((payment, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="text-xs text-gray-600 mb-1">{formatDate(payment.paid_date)}</p>
                <p className="text-sm font-semibold text-gray-900">
                  ${payment.paid_amount.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => onEditPayment(payment)}
                size="sm"
                variant="outlineBtn"
                className="h-8 w-8 p-0 border-none "
                // className="h-8 w-8 p-0 border-gray-300"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

