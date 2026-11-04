# Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| R-01 | Wrong schedule/fee published | Medium | High | Approval matrix, effective dates, audit, named approvers |
| R-02 | AI gives clinical/incorrect advice | Medium | Critical | Grounding, refusal, abstention, regression tests, escalation |
| R-03 | Hospital source data stale/incomplete | High | High | Onboarding checklist, data owners, freshness indicators |
| R-04 | Appointment double booking | Medium | High | Transactional capacity checks, constraints/locking, concurrency tests |
| R-05 | Patient data exposure | Medium | Critical | Minimize data, access controls, encryption, audit, security review |
| R-06 | Staff do not adopt dashboard | Medium | High | Workflow workshops, training, named champions, usage review |
| R-07 | Messaging approval delays launch | Medium | Medium | Website-first MVP, provider adapter, explicit dependencies |
| R-08 | AI/SMS costs exceed margin | Medium | High | Usage caps, metering, alerts, pass-through charges |
| R-09 | Dedicated installations increase maintenance | High | High | Shared codebase, automated deployment/migrations, patch cadence |
| R-10 | Scope expands into HIMS | High | High | Explicit exclusions, change control, separate discovery/proposal |
| R-11 | AI provider outage/model drift | Medium | Medium | Provider abstraction, fallback, evaluation suite |
| R-12 | Backup cannot be restored | Low/Med | Critical | Monitoring and scheduled restore drills |
| R-13 | Uncontrolled agency support access | Low/Med | High | Hospital authorization, MFA, time-bound access, audit/revocation |
| R-14 | Privacy/legal requirements misunderstood | Medium | High | Local legal review, privacy notice, retention and consent policy |
| R-15 | Bangla/Banglish retrieval quality poor | Medium | Medium | Curated bilingual sources, evaluation, human escalation |
| R-16 | Unpriced custom work expected | High | High | Signed scope, assumptions, exclusions, change orders |
| R-17 | Server failure causes outage | Medium | High | Managed hosting, monitoring, backups, tested recovery |
| R-18 | Analytics misleading | Medium | Medium | Metric dictionary, event QA, test traffic exclusion |

Before production define data classification/retention, incident response, RPO/RTO, access review, AI approval policy, subprocessors, patch cadence and customer exit/export/deletion procedure.
