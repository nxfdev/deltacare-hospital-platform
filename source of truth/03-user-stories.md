# User Stories and Acceptance Criteria

## Patient / visitor
**US-P01 Find a doctor.** As a visitor, I want to search/filter doctors to find a suitable doctor and current schedule.  
Acceptance: search by name; filters by specialty/department/branch where configured; only published valid information appears.

**US-P02 View services and fees.** As a visitor, I want to understand available services and published fees.  
Acceptance: currency and effective dates are clear; unknown fees show a contact instruction, never an invented value.

**US-P03 Contact hospital.** As a visitor, I want one-tap calling and a callback form.  
Acceptance: configured phone links; validated form; privacy notice; submission reference.

**US-P04 Request appointment.** As a patient, I want to request a doctor appointment.  
Acceptance: eligible slots shown; capacity rechecked at submission; unique reference; clear pending/confirmed state; duplicate requests handled safely.

**US-P05 Ask assistant.** As a visitor, I want to ask in Bangla or English.  
Acceptance: approved-source answer; abstain on unknown/stale information; refuse clinical advice; never claim unconfirmed booking.

## Front desk
**US-S01 View appointment queue.** Acceptance: filters/pagination; patient data permission-limited; status changes audited.

**US-S02 Confirm/reschedule.** Acceptance: capacity checked; patient notified via enabled channel; actor and reason recorded.

**US-S03 Block doctor availability.** Acceptance: blocked time removed from public availability; affected bookings surfaced for staff.

## Content editor / department manager
**US-C01 Edit doctor profile.** Acceptance: draft save; restricted fields require approval; change history retained.

**US-C02 Update schedule/fee.** Acceptance: effective dates; approval policy enforced; publication auditable.

## Hospital administrator
**US-A01 Manage permissions.** Acceptance: role changes audited; users cannot elevate themselves; deactivated users lose access.

**US-A02 Review changes.** Acceptance: reviewer sees proposed values and summary; approve/reject requires permission; rejection reason supported; publication atomic and audited.

**US-A03 View analytics.** Acceptance: date range/filter; metric definitions visible; test/internal traffic handled consistently.

## Agency operator
**US-O01 Deploy installation.** Acceptance: versioned repeatable deployment; secrets excluded from source; isolated DB/storage; health checks pass.

**US-O02 Support customer.** Acceptance: support access authorized, logged, limited and revocable; sensitive data masked where practical.

## Release 2
AI drafts structured changes but humans approve; WhatsApp/Messenger handover; SMS/WhatsApp reminders with consent/provider compliance; AI complaint categorization and routing.
