import type { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  percentage: string;
  percentageColor?: string;
  description: string;
}

export function StatsCard({
  icon,
  title,
  value,
  percentage,
  percentageColor = "text-green-500",
  description,
}: StatsCardProps) {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex flex-col">
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        {icon}
      </div>
      <hr className="my-2" />
      <p className="p-4 text-sm text-gray-500">
        <span className={`${percentageColor} font-semibold`}>{percentage}</span>{" "}
        {description}
      </p>
    </div>
  );
}
