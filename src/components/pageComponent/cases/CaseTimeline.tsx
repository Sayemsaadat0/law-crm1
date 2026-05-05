"use client";

import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Pencil, FileText, Download, ImageIcon, FileIcon, ChevronDown, ChevronUp, Eye, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareDateWithToday, formatDisplayDate, formatDisplayDateTime } from "@/lib/utils";
import type { Hearing, HearingFile } from "@/types/case.type";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import type { NormalizedHearingAttachment } from "@/lib/hearing-files";
// import { X } from "lucide-react";

interface CaseTimelineProps {
  hearings: Hearing[];
  courtName: string;
  onAddHearing: () => void;
  onEditHearing: (hearing: Hearing) => void;
  onDeleteHearing?: (hearing: Hearing) => void;
}

// function KindIcon({ kind }: { kind: NormalizedHearingAttachment["kind"] }) {
//   switch (kind) {
//     case "image":
//       return <ImageIcon className="w-3 h-3 shrink-0" aria-hidden />;
//     case "video":
//       return <Video className="w-3 h-3 shrink-0" aria-hidden />;
//     case "pdf":
//     case "document":
//       return <FileText className="w-3 h-3 shrink-0" aria-hidden />;
//     case "archive":
//       return <FileArchive className="w-3 h-3 shrink-0" aria-hidden />;
//     default:
//       return <Paperclip className="w-3 h-3 shrink-0" aria-hidden />;
//   }
// }

const AttachmentList = ({ files, onPreview }: { files: HearingFile[], onPreview: (file: HearingFile) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const isEditPage = location.pathname.includes("/dashboard/cases/edit/");
  
  // Show more threshold depends on view mode
  const threshold = isEditPage ? 2 : 5;
  const visibleFiles = isExpanded ? files : files.slice(0, threshold);
  const hasMore = files.length > threshold;

  const isImage = (mime?: string) => {
    const m = mime?.toLowerCase() || "";
    return m.startsWith('image/') || m.includes('jpg') || m.includes('jpeg') || m.includes('png') || m.includes('webp') || m.includes('gif');
  };

  const isPDF = (mime?: string) => {
    return mime?.toLowerCase().includes('pdf');
  };

  const getFileIcon = (mime?: string, sizeClass = "w-4 h-4") => {
    const m = mime?.toLowerCase() || "";
    if (m.startsWith('image/')) return <ImageIcon className={`${sizeClass} text-blue-500`} />;
    if (m.includes('pdf')) return <FileText className={`${sizeClass} text-red-500`} />;
    if (m.includes('word') || m.includes('officedocument.wordprocessingml') || m.includes('msword'))
      return <FileText className={`${sizeClass} text-blue-600`} />;
    if (m.includes('excel') || m.includes('officedocument.spreadsheetml') || m.includes('sheet'))
      return <FileIcon className={`${sizeClass} text-green-600`} />;
    if (m.includes('powerpoint') || m.includes('officedocument.presentationml'))
      return <FileIcon className={`${sizeClass} text-orange-600`} />;
    return <FileIcon className={`${sizeClass} text-gray-400`} />;
  };

  const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="mt-6 w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-[1px] flex-1 bg-gray-200/50"></div>
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
          Attachments ({files.length})
        </p>
        <div className="h-[1px] flex-1 bg-gray-200/50"></div>
      </div>

      {isEditPage ? (
        // List View for Edit Page
        <div className="space-y-2.5">
          {visibleFiles.map((file, idx) => {
            const previewable = isImage(file.mime) || isPDF(file.mime);
            const fileName = file.original_name || `file-${idx + 1}`;

            return (
              <div
                key={idx}
                className="group relative flex flex-row items-center p-3 rounded-xl bg-white border border-gray-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:border-primary-green/30 transition-all duration-300 w-full"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if (previewable) {
                      e.preventDefault();
                      onPreview(file);
                    } else {
                      handleDownload(e, file.url, fileName);
                    }
                  }}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50/80 group-hover:bg-primary-green/10 transition-all shrink-0 mr-3 overflow-hidden border border-gray-100 ${previewable ? 'cursor-zoom-in' : 'cursor-pointer'}`}
                >
                  {isImage(file.mime) ? (
                    <img
                      src={file.url}
                      alt={fileName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="relative">
                      {getFileIcon(file.mime, "w-6 h-6")}
                      {previewable && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-2.5 h-2.5 text-primary-green" />
                        </div>
                      )}
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (previewable) {
                        e.preventDefault();
                        onPreview(file);
                      }
                    }}
                    className={`block w-full text-left group/text ${previewable ? 'cursor-zoom-in' : 'cursor-default'}`}
                  >
                    <p className="text-[13px] font-bold text-gray-900 line-clamp-4 max-w-[150px] break-all leading-tight mb-0.5 group-hover/text:text-primary-green transition-colors" title={fileName}>
                      {fileName}
                    </p>
                  </button>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                    {file.mime ? (file.mime.split('/')[1]?.split('-')[0] || file.mime) : 'FILE'}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, file.url, fileName)}
                    className="p-2.5 text-gray-400 hover:bg-primary-green/90 hover:text-black rounded-xl transition-all shadow-sm border border-gray-50 bg-white"
                    title="Download directly"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Square Grid View for other pages (e.g. Case Details)
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleFiles.map((file, idx) => {
            const previewable = isImage(file.mime) || isPDF(file.mime);
            const fileName = file.original_name || `file-${idx + 1}`;

            return (
              <div
                key={idx}
                className="group relative flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-primary-green/30 transition-all duration-300 aspect-square overflow-hidden"
              >
                {/* Main Content Area (Thumbnail/Icon) */}
                <button
                  type="button"
                  onClick={(e) => {
                    if (previewable) {
                      e.preventDefault();
                      onPreview(file);
                    } else {
                      handleDownload(e, file.url, fileName);
                    }
                  }}
                  className="w-full h-full flex flex-col items-center justify-center p-2"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-primary-green/10 transition-colors mb-2 shrink-0 overflow-hidden relative">
                    {isImage(file.mime) ? (
                      <img
                        src={file.url}
                        alt={fileName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <>
                        {getFileIcon(file.mime, "w-6 h-6")}
                        {previewable && (
                          <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-2.5 h-2.5 text-primary-green" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 truncate w-full text-center px-1" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">
                    {file.mime ? (file.mime.split('/')[1]?.split('-')[0] || file.mime) : 'FILE'}
                  </p>
                </button>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
                  {previewable && (
                    <button
                      type="button"
                      onClick={() => onPreview(file)}
                      className="p-2.5 bg-white shadow-md border border-gray-100 rounded-xl text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, file.url, fileName)}
                    className="p-2.5 bg-black text-white shadow-md rounded-xl hover:bg-gray-800 hover:scale-110 transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-green transition-all border border-dashed border-gray-200 rounded-xl hover:border-primary-green/30 hover:bg-white/50"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Show {files.length - threshold} More Attachments <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default function CaseTimeline({
  hearings,
  courtName,
  onAddHearing,
  onEditHearing,
  // onDeleteHearing,
}: CaseTimelineProps) {
  const [previewFile, setPreviewFile] = useState<HearingFile | null>(null);

  const isImage = (mime?: string) => {
    const m = mime?.toLowerCase() || "";
    return m.startsWith('image/') || m.includes('jpg') || m.includes('jpeg') || m.includes('png') || m.includes('webp') || m.includes('gif');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 relative">
      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open: boolean) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-none flex flex-col">
          <DialogHeader className="p-4 border-b bg-white shrink-0">
            <DialogTitle className="text-sm font-bold truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-green" />
              {previewFile?.original_name || "File Preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-gray-50/50 flex items-center justify-center overflow-hidden p-4">
            {previewFile && (
              isImage(previewFile.mime) ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.original_name}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                />
              ) : (
                <iframe
                  src={previewFile.url}
                  className="w-full h-full border-none rounded-lg bg-white shadow-xl"
                  title="PDF Preview"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
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

            // Get background color based on date status
            const getBackgroundColor = () => {
              if (dateStatus === "today") {
                return "bg-blue-50";
              }
              if (dateStatus === "past") {
                return "bg-red-50";
              }
              return "bg-primary-green/20";
            };

            // const attachments = normalizeHearingAttachments(hearing.file);

            return (
              <div
                key={rowKey}
                className={`relative pl-6 border-l-2 border-gray-200 last:border-l-0 rounded-lg p-4 ${getBackgroundColor()}`}
              >
                {/* Standard Timeline Indicator */}
                <div className="absolute -left-2 top-4 w-4 h-4 bg-primary-green rounded-full border-2 border-white shadow-sm"></div>

                <div className="pb-4 pr-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {formatDisplayDateTime(hearing.hearing_date)}
                    </p>

                    {/* New Flex Edit Button - Big and Black */}
                    <button
                      onClick={() => onEditHearing(hearing)}
                      className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-md shrink-0 ml-4"
                      title="Edit Hearing"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-extrabold text-primary-green">
                        {hearing.serial_no}
                      </p>
                      <p className="text-sm text-gray-900 font-bold">
                        {hearing.title}
                      </p>
                    </div>

                    <p className="text-xs text-gray-400 font-medium mb-3">
                      Scheduled Date: {formatDisplayDate(hearing.hearing_date)}
                    </p>

                    <p className="text-[13px] text-gray-700 mb-4 leading-relaxed font-medium">
                      {hearing.details}
                    </p>

                    {/* Hearing files */}
                    {hearing.file && (() => {
                      const raw = hearing.file as any;
                      let files: HearingFile[] = [];

                      try {
                        if (Array.isArray(raw)) {
                          files = raw.map(f => typeof f === 'string' ? { url: f } : f);
                        } else if (typeof raw === "string") {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed)) {
                            files = parsed.map(f => typeof f === 'string' ? { url: f } : f);
                          } else {
                            files = [{ url: raw }];
                          }
                        }
                      } catch {
                        if (typeof raw === "string") {
                          files = [{ url: raw }];
                        }
                      }

                      return files.length > 0 ? <AttachmentList files={files} onPreview={setPreviewFile} /> : null;
                    })()}

                    {/* Actions Footer */}
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-green/60"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        {courtName}
                      </p>
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
