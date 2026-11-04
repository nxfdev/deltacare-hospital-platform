"use client";

import React, { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconBg?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
    label?: string;
  };
  onClick?: () => void;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-[#0057b8]/10 text-[#0057b8]",
  trend,
  onClick,
  badge,
  badgeColor = "bg-[#f1f5f9] text-[#475569]",
  highlight = false,
}: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-2xl border p-5 transition-all text-left flex flex-col justify-between ${
        highlight
          ? "border-[#0057b8] bg-[#f0f7ff] shadow-sm ring-1 ring-[#0057b8]/20"
          : "border-[#d6d6d6] bg-white hover:border-[#0057b8]/60 hover:shadow-xs"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#686868] uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-[#080808] tracking-tight">
              {value}
            </span>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#ededed] flex items-center justify-between text-xs">
        {trend ? (
          <div className="flex items-center gap-1.5 font-medium">
            <span
              className={`inline-flex items-center gap-0.5 font-bold ${
                trend.direction === "up"
                  ? "text-[#059669]"
                  : trend.direction === "down"
                  ? "text-[#dc2626]"
                  : "text-[#64748b]"
              }`}
            >
              {trend.direction === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend.direction === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend.direction === "neutral" && <Minus className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
            <span className="text-[#686868]">{trend.label || "vs last period"}</span>
          </div>
        ) : (
          <span className="text-[#686868] truncate">{subtitle || "Current live count"}</span>
        )}

        {onClick && (
          <span className="text-[11px] font-bold text-[#0057b8] hover:underline flex items-center gap-0.5 shrink-0">
            View Details
          </span>
        )}
      </div>
    </div>
  );
}

