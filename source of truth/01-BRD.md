# Business Requirements Document

## Business context
Hospital information is often fragmented across websites, social media, phone calls, printed schedules and staff knowledge. This platform centralizes approved public information and controlled workflows.

## Business objectives
1. Deliver a credible bilingual patient-facing presence.
2. Reduce repetitive administrative enquiries.
3. Improve freshness and accuracy of doctor, schedule, service and fee information.
4. Capture and manage appointment requests.
5. Improve patient communication and feedback handling.
6. Provide basic management visibility.
7. Create a repeatable product deployable for multiple hospitals.

## Stakeholders
Owners/directors (sponsor), administrators (operational owner), department managers, front desk, marketing, IT, patients and agency delivery/support.

## Business requirements
| ID | Requirement | Priority |
|---|---|---|
| BR-01 | Dedicated deployment and isolated database per hospital | Must |
| BR-02 | Bangla and English public website | Must |
| BR-03 | Staff management of doctors, departments, services, fees and schedules | Must |
| BR-04 | Configurable content approval and publishing | Must |
| BR-05 | Audit trail for important changes | Must |
| BR-06 | Patient doctor discovery and appointment requests | Must |
| BR-07 | Staff appointment management | Must |
| BR-08 | Website AI answers from hospital-approved information only | Must |
| BR-09 | Unknown/out-of-scope AI questions safely escalated | Must |
| BR-10 | Contact and private feedback forms | Should |
| BR-11 | Basic operational analytics | Should |
| BR-12 | Architecture supports later SMS, WhatsApp and Messenger adapters | Should |
| BR-13 | AI staff update drafting and complaint routing | Could / Release 2 |
| BR-14 | Advanced analytics and scheduled reports | Could / Release 2 |
| BR-15 | Existing hospital system integrations | Excluded from MVP |

## Business rules
- Hospital owns its operational and patient-submitted data, subject to applicable law and contract.
- Hosting, access, retention and support duties must be defined contractually.
- Hospital appoints authorized users and approvers.
- Doctor schedules and fees require effective dates and publication state.
- AI-generated changes are drafts until approved.
- AI must not invent fees, credentials, availability or clinical instructions.
- AI does not diagnose, prescribe, triage or recommend treatment.
- Appointment requests are not confirmed until the configured workflow confirms them.
- Messaging depends on provider approval, consent, policy and fees.

## Assumptions and constraints
Bangladesh is the initial market; Bangla/English are initial locales; no HIMS or diagnostic integration in MVP; no patient report repository; each hospital has an independent installation; third-party provider costs are customer-specific unless contracted otherwise.

## Business risks
Incomplete source data, staff non-adoption, varying appointment rules, messaging approvals/costs, stale AI knowledge, dedicated deployment maintenance burden and customer expectations of HIMS functionality.

## Launch acceptance
Signed scope; named product owner and approvers; verified content; staff UAT; approved privacy notice; restore test; monitoring/support contacts; training and go-live sign-off.
