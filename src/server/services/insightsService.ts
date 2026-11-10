import { getDbState } from "@/server/db/store";
import { OperationalInsight, RoleCode } from "@/types/domain";

// ============================================================================
// Evercare Operational Insights & Actionable Intelligence Engine
// Dynamically extracts evidence-grounded insights from live database state.
// Strictly NO fabricated trends or fake numbers.
// ============================================================================

export function getOperationalInsights(
  role: RoleCode,
  scopedBranchId?: string
): OperationalInsight[] {
  const db = getDbState();
  const now = new Date();
  const nowIso = now.toISOString();

  const scopedAppointments =
    role === "RECEPTIONIST" && scopedBranchId
      ? db.appointments.filter((a) => a.branchId === scopedBranchId)
      : db.appointments;

  const insights: OperationalInsight[] = [];

  // 1. Pending Appointment Verification Backlog
  const pendingRequests = scopedAppointments.filter(
    (a) => a.status === "REQUESTED" || a.status === "PENDING_CONFIRMATION"
  );
  if (pendingRequests.length > 0) {
    const isCritical = pendingRequests.length >= 4;
    insights.push({
      id: "ins-pending-apt-backlog",
      title: "Appointment Requests Awaiting Front-Desk Verification",
      description: `${pendingRequests.length} patient appointment request(s) require phone verification or slot confirmation.`,
      severity: isCritical ? "CRITICAL" : "WARNING",
      category: "APPOINTMENTS",
      metric: `${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? "s" : ""}`,
      evidence: `Earliest unverified booking reference: ${pendingRequests[0]?.reference} (${pendingRequests[0]?.patientName})`,
      recommendedAction: "Review contact info, call patient if needed, and confirm slot allocation.",
      actionTab: role === "RECEPTIONIST" ? "requests" : "appointments",
      freshness: "Live Database State",
    });
  }

  // 2. Department Demand Concentration
  if (scopedAppointments.length >= 2) {
    const deptCounts: Record<string, number> = {};
    for (const a of scopedAppointments) {
      deptCounts[a.departmentId] = (deptCounts[a.departmentId] || 0) + 1;
    }
    let topDeptId = "";
    let topCount = 0;
    for (const [deptId, count] of Object.entries(deptCounts)) {
      if (count > topCount) {
        topCount = count;
        topDeptId = deptId;
      }
    }
    const topDept = db.departments.find((d) => d.id === topDeptId);
    const concentration = Math.round((topCount / scopedAppointments.length) * 100);

    if (topDept && concentration >= 30) {
      insights.push({
        id: "ins-dept-demand-surge",
        title: `High Outpatient Demand Concentration: ${topDept.nameEn}`,
        description: `${topDept.nameEn} accounts for ${concentration}% of all current booking volume.`,
        severity: concentration > 50 ? "WARNING" : "INFO",
        category: "CAPACITY",
        metric: `${concentration}% Booking Share (${topCount} Bookings)`,
        evidence: `Out of ${scopedAppointments.length} total appointments recorded across the facility.`,
        recommendedAction: "Consider opening additional weekly slots or scheduling supplementary chamber hours.",
        actionTab: "departments",
        freshness: "Real-time Aggregation",
      });
    }
  }

  // 3. Specialists Missing Active Schedules
  const doctorsWithoutSchedules = db.doctors.filter(
    (d) =>
      d.publicationState === "PUBLISHED" &&
      (!d.branches || d.branches.every((b) => !b.scheduleRules || b.scheduleRules.length === 0))
  );
  if (doctorsWithoutSchedules.length > 0 && role !== "PATIENT") {
    insights.push({
      id: "ins-missing-schedules",
      title: "Active Specialists Lacking Configured Weekly Schedule Rules",
      description: `${doctorsWithoutSchedules.length} published specialist(s) have no weekly chamber rules configured and cannot receive online bookings.`,
      severity: "WARNING",
      category: "SCHEDULE",
      metric: `${doctorsWithoutSchedules.length} Unscheduled Specialist${doctorsWithoutSchedules.length > 1 ? "s" : ""}`,
      evidence: `Affected: ${doctorsWithoutSchedules.map((d) => d.nameEn).slice(0, 2).join(", ")}${doctorsWithoutSchedules.length > 2 ? ` and ${doctorsWithoutSchedules.length - 2} more` : ""}`,
      recommendedAction: "Configure weekday schedule rules, consultation hours, and slot minutes.",
      actionTab: "specialists",
      freshness: "Verified from Domain Store",
    });
  }

  // 4. Leave & Chamber Exceptions Active
  const allExceptions = db.doctors.flatMap((d) =>
    d.branches.flatMap((b) =>
      (b.scheduleExceptions || []).map((ex) => ({
        ...ex,
        doctorName: d.nameEn,
        branchId: b.branchId,
      }))
    )
  );
  if (allExceptions.length > 0 && (role === "HOSPITAL_ADMIN" || role === "RECEPTIONIST" || role === "SUPER_ADMIN")) {
    insights.push({
      id: "ins-active-exceptions",
      title: "Scheduled Doctor Leaves & Chamber Blocked Dates",
      description: `${allExceptions.length} upcoming chamber block/leave exception(s) are logged in the system.`,
      severity: "INFO",
      category: "SCHEDULE",
      metric: `${allExceptions.length} Logged Exception${allExceptions.length > 1 ? "s" : ""}`,
      evidence: `Latest leave: ${allExceptions[0]?.doctorName} on ${allExceptions[0]?.dateStr} (${allExceptions[0]?.reasonEn})`,
      recommendedAction: "Ensure reception desk is briefed for patient walk-in inquiries.",
      actionTab: role === "RECEPTIONIST" ? "schedules" : "leave",
      freshness: "Active Exception Log",
    });
  }

  // 5. Incomplete Doctor Public Profiles (CMS / Admin)
  const incompleteProfiles = db.doctors.filter(
    (d) =>
      !d.imageUrl ||
      d.imageUrl.includes("placeholder") ||
      d.bioEn.length < 50 ||
      !d.publicTaglineEn
  );
  if (incompleteProfiles.length > 0 && (role === "CONTENT_EDITOR" || role === "HOSPITAL_ADMIN" || role === "SUPER_ADMIN")) {
    insights.push({
      id: "ins-incomplete-doctor-profiles",
      title: "Doctor Public Profiles Requiring Editorial Enhancement",
      description: `${incompleteProfiles.length} specialist profile(s) lack high-resolution photography, tagline, or comprehensive public biographies.`,
      severity: "INFO",
      category: "CONTENT",
      metric: `${incompleteProfiles.length} Profile${incompleteProfiles.length > 1 ? "s" : ""} Incomplete`,
      evidence: `Profiles needing attention: ${incompleteProfiles.map((d) => d.nameEn).slice(0, 2).join(", ")}`,
      recommendedAction: "Use CMS Doctor Profile manager to upload cropped photos and add engaging patient copywriting.",
      actionTab: role === "CONTENT_EDITOR" ? "doctors" : "specialists",
      freshness: "Editorial Health Check",
    });
  }

  // 6. Pending Governance Approvals
  const pendingApprovals = db.approvalRequests.filter(
    (a) => a.status === "PENDING_APPROVAL"
  );
  if (pendingApprovals.length > 0 && (role === "HOSPITAL_ADMIN" || role === "SUPER_ADMIN" || role === "CONTENT_EDITOR")) {
    insights.push({
      id: "ins-pending-approvals",
      title: "Editorial & Operational Changes Awaiting Hospital Admin Sign-Off",
      description: `${pendingApprovals.length} proposed change(s) are queued in the approval workflow.`,
      severity: "WARNING",
      category: "COMPLIANCE",
      metric: `${pendingApprovals.length} Pending Approval${pendingApprovals.length > 1 ? "s" : ""}`,
      evidence: `Top queued item: ${pendingApprovals[0]?.entityTitle} (${pendingApprovals[0]?.changeSummary})`,
      recommendedAction: "Review diffs, verify credentials/copy, and authorize or reject publication.",
      actionTab: role === "CONTENT_EDITOR" ? "publishing" : "approvals",
      freshness: "Governance Workflow",
    });
  }

  // 7. Cancellation & No-Show Monitoring
  const cancelledCount = scopedAppointments.filter(
    (a) => a.status === "CANCELLED" || a.status === "NO_SHOW"
  ).length;
  if (scopedAppointments.length >= 4) {
    const cancelRate = Math.round((cancelledCount / scopedAppointments.length) * 100);
    if (cancelRate >= 15) {
      insights.push({
        id: "ins-cancellation-rate",
        title: "Elevated Appointment Cancellation & No-Show Rate",
        description: `Current cancellation/no-show rate is ${cancelRate}% across ${scopedAppointments.length} bookings.`,
        severity: "WARNING",
        category: "APPOINTMENTS",
        metric: `${cancelRate}% Cancellation Rate (${cancelledCount} Cancelled)`,
        evidence: `${cancelledCount} cancelled or no-show bookings recorded.`,
        recommendedAction: "Front desk should send proactive SMS appointment confirmations 4 hours in advance.",
        actionTab: role === "RECEPTIONIST" ? "today" : "appointments",
        freshness: "Calculated Ratio",
      });
    }
  }

  // 8. Integration & Notification Delivery
  const failedNotifications = db.notifications.filter((n) => n.status === "FAILED");
  if (failedNotifications.length > 0 && (role === "SUPER_ADMIN" || role === "HOSPITAL_ADMIN")) {
    insights.push({
      id: "ins-failed-notifications",
      title: "Outbound Patient Notification Delivery Failures",
      description: `${failedNotifications.length} SMS/Email alert(s) failed delivery to recipients.`,
      severity: "CRITICAL",
      category: "SYSTEM",
      metric: `${failedNotifications.length} Delivery Failure${failedNotifications.length > 1 ? "s" : ""}`,
      evidence: `Failed recipient: ${failedNotifications[0]?.recipient} (${failedNotifications[0]?.templateCode})`,
      recommendedAction: "Inspect integration gateway credentials and phone number formatting.",
      actionTab: role === "SUPER_ADMIN" ? "integrations" : "notifications",
      freshness: "Gateway Log",
    });
  }

  return insights;
}

