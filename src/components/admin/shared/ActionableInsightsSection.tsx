"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info, ArrowRight, Sparkles } from "lucide-react";
import { OperationalInsight } from "@/types/domain";

interface ActionableInsightsSectionProps {
  insights: OperationalInsight[];
  onActionClick?: (tab: string) => void;
  title?: string;
  subtitle?: string;
}

export function ActionableInsightsSection({
  insights,
  onActionClick,
  title = "Operational Intelligence & Actionable Insights",
  subtitle = "Evidence-grounded observations generated in real time from live hospital data",
}: ActionableInsightsSectionProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity: OperationalInsight["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return {
          icon: <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />,
          cardBorder: "border-[#fca5a5] bg-[#fef2f2]",
          badge: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
          badgeText: "High Attention",
        };
      case "WARNING":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />,
          cardBorder: "border-[#fde68a] bg-[#fffbeb]",
          badge: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
          badgeText: "Operational Alert",
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-[#0284c7] shrink-0" />,
          cardBorder: "border-[#bae6fd] bg-[#f0f9ff]",
          badge: "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]",
          badgeText: "Advisory",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#d6d6d6] p-5 md:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ededed] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0057b8]/10 text-[#0057b8] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base text-[#080808] flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0057b8] text-white text-[11px] font-bold">
                {insights.length}
              </span>
            </h3>
            <p className="text-xs text-[#686868] mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="text-[11px] text-[#595959] font-medium bg-[#f8fafc] px-3 py-1 rounded-full border border-[#e2e8f0] self-start sm:self-auto">
          Updated: {insights[0]?.freshness || "Just now"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.map((insight) => {
          const style = getSeverityBadge(insight.severity);
          return (
            <div
              key={insight.id}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-xs ${style.cardBorder}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${style.badge}`}
                  >
                    {style.icon}
                    <span>{style.badgeText}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#080808] bg-white/80 px-2 py-0.5 rounded-md border border-black/5 shadow-2xs">
                    {insight.metric}
                  </span>
                </div>

                <h4 className="font-bold text-xs md:text-sm text-[#080808] leading-snug">
                  {insight.title}
                </h4>

                <p className="text-xs text-[#484848] leading-relaxed">
                  {insight.description}
                </p>

                <div className="p-2.5 rounded-lg bg-white/70 border border-black/5 text-[11px] text-[#595959] space-y-1">
                  <p>
                    <strong className="text-[#080808]">Evidence:</strong> {insight.evidence}
                  </p>
                  <p>
                    <strong className="text-[#080808]">Recommendation:</strong>{" "}
                    {insight.recommendedAction}
                  </p>
                </div>
              </div>

              {insight.actionTab && onActionClick && (
                <button
                  type="button"
                  onClick={() => onActionClick(insight.actionTab!)}
                  className="inline-flex items-center justify-between w-full text-xs font-bold text-[#0057b8] hover:text-[#004181] pt-2 border-t border-black/5 group"
                >
                  <span>Resolve in {insight.actionTab.toUpperCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

