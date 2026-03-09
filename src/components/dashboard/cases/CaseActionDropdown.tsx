"use client";

import { MoreVertical, Eye, Pencil, DollarSign, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TCase } from "@/types/case.type";

interface CaseActionDropdownProps {
  caseData: TCase;
  onView: (caseData: TCase) => void;
  onEdit?: (caseData: TCase) => void;
  onReceivePayment?: (caseData: TCase) => void;
  onNewHearing?: (caseData: TCase) => void;
}

export function CaseActionDropdown({
  caseData,
  onView,
  onEdit,
  onReceivePayment,
  onNewHearing,
}: CaseActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onView(caseData)}
          className="cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>View</span>
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem
            onClick={() => onEdit(caseData)}
            className="cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit</span>
          </DropdownMenuItem>
        )}
        {onReceivePayment && (
          <DropdownMenuItem
            onClick={() => onReceivePayment(caseData)}
            className="cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Receive Payment</span>
          </DropdownMenuItem>
        )}
        {onNewHearing && (
          <DropdownMenuItem
            onClick={() => onNewHearing(caseData)}
            className="cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>New Hearings</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

