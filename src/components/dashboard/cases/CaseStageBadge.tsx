import type { TCaseStage } from "@/types/case.type";

type CaseStageBadgeProps = {
  stage: TCaseStage;
};

const stageStyles: Record<TCaseStage, string> = {
  Active: "bg-primary/10 text-primary border-primary/20",
  Disposed: "bg-red-100 text-red-800 border-red-200",
  Left: "bg-orange-100 text-orange-800 border-orange-200",
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
