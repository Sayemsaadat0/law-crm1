"use client";

import {
  Plus,
  Pencil,
  Trash2,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareDateWithToday, formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import type { Hearing } from "@/types/case.type";
import {
  normalizeHearingAttachments,
  type NormalizedHearingAttachment,
} from "@/lib/hearing-files";

interface CaseTimelineProps {
  hearings: Hearing[];
  courtName: string;
  onAddHearing: () => void;
  onEditHearing: (hearing: Hearing) => void;
  onDeleteHearing?: (hearing: Hearing) => void;
}

function KindIcon({ kind }: { kind: NormalizedHearingAttachment["kind"] }) {
  switch (kind) {
    case "image":
      return <ImageIcon className="w-3 h-3 shrink-0" aria-hidden />;
    case "video":
      return <Video className="w-3 h-3 shrink-0" aria-hidden />;
    case "pdf":
    case "document":
      return <FileText className="w-3 h-3 shrink-0" aria-hidden />;
    case "archive":
      return <FileArchive className="w-3 h-3 shrink-0" aria-hidden />;
    default:
      return <Paperclip className="w-3 h-3 shrink-0" aria-hidden />;
  }
}

export default function CaseTimeline({
  hearings,
  courtName,
  onAddHearing,
  onEditHearing,
  onDeleteHearing,
}: CaseTimelineProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Case Timeline</h2>
        <Button
          onClick={onAddHearing}
          variant="primarybtn"
          className="bg-primary-green text-black hover:bg-primary-green/90"
          size="sm"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {hearings.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hearings yet</p>
        ) : (
          hearings.map((hearing, index) => {
            const rowKey = hearing.id != null ? `hearing-${hearing.id}` : `hearing-idx-${index}`;
            const dateStatus = compareDateWithToday(hearing.hearing_date);

            const getBackgroundColor = () => {
              if (dateStatus === "today") {
                return "bg-blue-50";
              }
              if (dateStatus === "past") {
                return "bg-red-50";
              }
              return "bg-primary-green/20";
            };

            const attachments = normalizeHearingAttachments(hearing.file);

            return (
              <div
                key={rowKey}
                className={`relative pl-6 border-l-2 border-gray-200 last:border-l-0 rounded-lg p-4 ${getBackgroundColor()}`}
              >
                <div className="absolute -left-2 top-4 w-4 h-4 bg-primary-green rounded-full border-2 border-white"></div>
                <div className="pb-4 pr-20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {formatDisplayDateTime(hearing.hearing_date)}
                      </p>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold ">{hearing.serial_no}</p>
                        <p className="text-sm text-gray-900 font-medium">{hearing.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        Date: {formatDisplayDate(hearing.hearing_date)}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">{hearing.details}</p>
                      {attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {attachments.map((a) => (
                            <a
                              key={a.url}
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={a.label}
                              className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-full bg-white/70 border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs break-all"
                            >
                              <KindIcon kind={a.kind} />
                              <span className="truncate">{a.label}</span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-xs text-gray-600 mt-2">{courtName}</p>
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 shrink-0">
                      {onDeleteHearing && hearing.id != null ? (
                        <Button
                          type="button"
                          onClick={() => onDeleteHearing(hearing)}
                          size="sm"
                          variant="outlineBtn"
                          className="h-8 w-8 p-0 border-none text-red-600 hover:text-red-700 hover:bg-red-50"
                          aria-label="Delete hearing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        onClick={() => onEditHearing(hearing)}
                        size="sm"
                        variant="outlineBtn"
                        className="h-8 w-8 p-0 border-none"
                        aria-label="Edit hearing"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
