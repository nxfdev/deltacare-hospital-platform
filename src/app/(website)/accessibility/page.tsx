import React from "react";

export default function AccessibilityPage() {
  return (
    <div className="bg-[#f2f2f2] min-h-screen py-12">
      <div className="mc-container max-w-4xl bg-white rounded-3xl border border-[#d6d6d6] p-8 md:p-12 space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0057b8]">
          DeltaCare Governance • WCAG 2.1 AA Accessibility
        </p>
        <h1 className="mc-serif text-3xl md:text-4xl text-[#080808]">
          Accessibility Statement / অ্যাক্সেসিবিলিটি বিবৃতি
        </h1>
        <div className="space-y-4 text-sm text-[#424242] leading-relaxed">
          <p>
            DeltaCare is committed to ensuring digital accessibility for
            patients, caregivers, and visitors across Bangladesh in both English
            and Bangla (বাংলা) in alignment with WCAG 2.1 Level AA standards.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Keyboard Navigation & Focus Visibility:</strong> Every
              interactive control features a high-visibility{" "}
              <code>2px dashed #0057b8</code> focus outline and a Skip-to-Content
              link at the top of every page.
            </li>
            <li>
              <strong>Motion Control:</strong> Ambient hero motion includes an
              explicit Pause/Play button and respects{" "}
              <code>prefers-reduced-motion: reduce</code>.
            </li>
            <li>
              <strong>Bilingual Readability:</strong> Full English and Bangla
              interface support with clear contrast ratios and labeled form
              controls.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

