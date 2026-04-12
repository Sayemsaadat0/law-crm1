"use client";

import { FileText } from "lucide-react";
import type { Hearing } from "@/types/case.type";
import { formatDisplayDate } from "@/lib/utils";

interface HearingsListProps {
  hearings: Hearing[];
}

export default function HearingsList({ hearings }: HearingsListProps) {
  const getFirstFileUrl = (file?: string | string[]) => {
    if (!file) return undefined;
    return Array.isArray(file) ? file[0] : file;
  };

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
                File
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hearings.map((hearing, index) => {
              const fileUrl = getFirstFileUrl(hearing.file);
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
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {hearing.details}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        View File
                      </a>
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

