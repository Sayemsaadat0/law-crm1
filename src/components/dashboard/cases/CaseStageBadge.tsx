import type { TCaseStage } from "@/types/case.type";

type CaseStageBadgeProps = {
  stage: TCaseStage;
};

const stageStyles: Record<TCaseStage, string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Disposed: "bg-red-100 text-red-800 border-red-200",
  Resolve: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Archive: "bg-gray-200 text-gray-800 border-gray-300",
};

export function CaseStageBadge({ stage }: CaseStageBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${stageStyles[stage]}`}
    >
      {stage}
    </span>
  );
}
