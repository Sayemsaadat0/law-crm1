"use client";

import { FileArchive, FileText, Image as ImageIcon, Paperclip, Video } from "lucide-react";
import type { Hearing } from "@/types/case.type";
import { formatDisplayDate } from "@/lib/utils";
import {
  normalizeHearingAttachments,
  type NormalizedHearingAttachment,
} from "@/lib/hearing-files";

interface HearingsListProps {
  hearings: Hearing[];
}

function KindIcon({ kind }: { kind: NormalizedHearingAttachment["kind"] }) {
  switch (kind) {
    case "image":
      return <ImageIcon className="w-4 h-4 shrink-0" aria-hidden />;
    case "video":
      return <Video className="w-4 h-4 shrink-0" aria-hidden />;
    case "pdf":
    case "document":
      return <FileText className="w-4 h-4 shrink-0" aria-hidden />;
    case "archive":
      return <FileArchive className="w-4 h-4 shrink-0" aria-hidden />;
    default:
      return <Paperclip className="w-4 h-4 shrink-0" aria-hidden />;
  }
}

export default function HearingsList({ hearings }: HearingsListProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Hearings</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Serial No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Hearing Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                Files
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hearings.map((hearing, index) => {
              const attachments = normalizeHearingAttachments(hearing.file);
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {hearing.serial_no}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {hearing.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatDisplayDate(hearing.hearing_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{hearing.details}</td>
                  <td className="px-4 py-3 text-sm">
                    {attachments.length > 0 ? (
                      <ul className="space-y-1.5">
                        {attachments.map((a) => (
                          <li key={a.url}>
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={a.label}
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 break-all"
                            >
                              <KindIcon kind={a.kind} />
                              <span>{a.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No file</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
