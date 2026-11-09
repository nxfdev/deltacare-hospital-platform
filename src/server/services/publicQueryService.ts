import { getDbState } from "@/server/db/store";
import {
  Branch,
  Department,
  DiseaseCondition,
  Doctor,
  HospitalConfiguration,
  HospitalNotice,
  Locale,
  MedicalProcedure,
  PublicationState,
  Service,
  Specialty,
} from "@/types/domain";

// ============================================================================
// DeltaCare Public Query & Search Service
// Enforces FR-WEB-08: Never expose DRAFT, PENDING_APPROVAL, ARCHIVED, or expired records
// ============================================================================

export function isRecordCurrentlyValid(
  publicationState: PublicationState,
  effectiveFrom?: string,
  effectiveTo?: string | null,
  referenceDate: Date = new Date()
): boolean {
  if (publicationState !== "PUBLISHED") {
    return false;
  }
  if (effectiveFrom) {
    const fromTime = new Date(effectiveFrom).getTime();
    if (!Number.isNaN(fromTime) && fromTime > referenceDate.getTime()) {
      return false;
    }
  }
  if (effectiveTo) {
    const toTime = new Date(effectiveTo).getTime();
    if (!Number.isNaN(toTime) && toTime < referenceDate.getTime()) {
      return false;
    }
  }
  return true;
}

export function getPublicHospitalConfig(): HospitalConfiguration {
  return getDbState().hospital;
}

export function getHospitalConfig(): HospitalConfiguration {
  return getDbState().hospital;
}

export function getPublishedBranches(): Branch[] {
  const db = getDbState();
  return db.branches
    .filter((b) => b.publicationState === "PUBLISHED")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPublishedBranchBySlug(slug: string): Branch | null {
  return (
    getPublishedBranches().find(
      (b) => b.slug.toLowerCase() === slug.toLowerCase() || b.id === slug
    ) ?? null
  );
}

export function getPublishedDepartments(branchId?: string): Department[] {
  const db = getDbState();
  return db.departments.filter(
    (d) =>
      d.publicationState === "PUBLISHED" &&
      (!branchId || d.branchId === branchId)
  );
}

export function getPublishedDepartmentBySlug(slug: string): Department | null {
  return (
    getPublishedDepartments().find(
      (d) => d.slug.toLowerCase() === slug.toLowerCase() || d.id === slug
    ) ?? null
  );
}

export function getAllSpecialties(): Specialty[] {
  return getDbState().specialties;
}

export function getSpecialties(): Specialty[] {
  return getDbState().specialties;
}

export interface DoctorFilterParams {
  query?: string;
  departmentId?: string;
  specialtyId?: string;
  branchId?: string;
  language?: string;
  availableDay?: number;
}

export function getPublishedDoctors(filters?: DoctorFilterParams): Doctor[] {
  const db = getDbState();
  const now = new Date();

  let list = db.doctors
    .filter((doc) => doc.publicationState === "PUBLISHED")
    .map((doc) => ({
      ...doc,
      branches: doc.branches
        .filter((b) => b.status === "ACTIVE")
        .map((b) => ({
          ...b,
          scheduleRules: b.scheduleRules.filter((sr) =>
            isRecordCurrentlyValid(
              sr.publicationState,
              sr.effectiveFrom,
              sr.effectiveTo,
              now
            )
          ),
        })),
    }));

  if (!filters) return list;

  if (filters.departmentId) {
    list = list.filter(
      (d) =>
        d.departmentId === filters.departmentId ||
        db.departments.find((dept) => dept.id === d.departmentId)?.slug ===
          filters.departmentId
    );
  }

  if (filters.specialtyId) {
    list = list.filter((d) => d.specialtyIds.includes(filters.specialtyId!));
  }

  if (filters.branchId) {
    list = list.filter((d) =>
      d.branches.some(
        (b) =>
          b.branchId === filters.branchId ||
          db.branches.find((br) => br.id === b.branchId)?.slug ===
            filters.branchId
      )
    );
  }

  if (filters.language) {
    const langLower = filters.language.toLowerCase();
    list = list.filter((d) =>
      d.languagesEn.some((l) => l.toLowerCase() === langLower)
    );
  }

  if (typeof filters.availableDay === "number") {
    list = list.filter((d) =>
      d.branches.some((b) => b.scheduleRules.length > 0)
    );
  }

  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim().toLowerCase();
    list = list.filter((d) => {
      const dept = db.departments.find((dep) => dep.id === d.departmentId);
      const branchNames = d.branches
        .map((b) => {
          const br = db.branches.find((item) => item.id === b.branchId);
          return br ? `${br.nameEn} ${br.nameBn}` : "";
        })
        .join(" ");
      const haystack = [
        d.nameEn,
        d.nameBn,
        d.designationEn,
        d.designationBn,
        d.qualificationsEn,
        d.qualificationsBn,
        d.workplaceEn ?? "",
        d.workplaceBn ?? "",
        d.bmdcRegistrationNo,
        ...(d.symptomTags ?? []),
        ...d.clinicalInterestsEn,
        ...d.clinicalInterestsBn,
        dept?.nameEn ?? "",
        dept?.nameBn ?? "",
        branchNames,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return list;
}

export function getPublishedDoctorBySlug(slug: string): Doctor | null {
  return (
    getPublishedDoctors().find(
      (d) => d.slug.toLowerCase() === slug.toLowerCase() || d.id === slug
    ) ?? null
  );
}

export function getPublishedServices(departmentId?: string): Service[] {
  const db = getDbState();
  const now = new Date();
  return db.services.filter(
    (s) =>
      isRecordCurrentlyValid(
        s.publicationState,
        s.effectiveFrom,
        s.effectiveTo,
        now
      ) && (!departmentId || s.departmentId === departmentId)
  );
}

export function getPublishedConditions(
  letterOrOptions?:
    | string
    | { letter?: string; query?: string; departmentId?: string },
  queryArg?: string
): DiseaseCondition[] {
  const db = getDbState();
  let list = db.conditions.filter((c) => c.publicationState === "PUBLISHED");

  const letter =
    typeof letterOrOptions === "string"
      ? letterOrOptions
      : letterOrOptions?.letter;
  const query =
    typeof letterOrOptions === "string" ? queryArg : letterOrOptions?.query;
  const departmentId =
    typeof letterOrOptions === "object" && letterOrOptions !== null
      ? letterOrOptions.departmentId
      : undefined;

  if (departmentId) {
    list = list.filter((c) => c.departmentId === departmentId);
  }

  if (letter && letter.trim().length > 0 && letter.toUpperCase() !== "ALL") {
    const target = letter.trim().toUpperCase();
    list = list.filter((c) => c.firstLetter.toUpperCase() === target);
  }

  if (query && query.trim().length > 0) {
    const q = query.trim().toLowerCase();
    list = list.filter((c) =>
      [
        c.nameEn,
        c.nameBn,
        c.summaryEn,
        c.summaryBn,
        ...c.symptomsEn,
        ...c.symptomsBn,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
}

export function getPublishedConditionBySlug(
  slug: string
): DiseaseCondition | null {
  return (
    getPublishedConditions().find(
      (c) => c.slug.toLowerCase() === slug.toLowerCase() || c.id === slug
    ) ?? null
  );
}

export function getPublishedProcedures(
  queryOrDepartmentId?: string
): MedicalProcedure[] {
  const db = getDbState();
  let list = db.procedures.filter((p) => p.publicationState === "PUBLISHED");
  if (queryOrDepartmentId && queryOrDepartmentId.trim().length > 0) {
    const val = queryOrDepartmentId.trim();
    if (val.startsWith("dept-")) {
      list = list.filter((p) => p.departmentId === val);
    } else {
      const q = val.toLowerCase();
      list = list.filter((p) =>
        [
          p.nameEn,
          p.nameBn,
          p.categoryEn,
          p.categoryBn,
          p.summaryEn,
          p.summaryBn,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
  }
  return list;
}

export function getPublishedProcedureBySlug(
  slug: string
): MedicalProcedure | null {
  return (
    getPublishedProcedures().find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase() || p.id === slug
    ) ?? null
  );
}

export interface GlobalSearchResultItem {
  id: string;
  type: "DOCTOR" | "DEPARTMENT" | "CONDITION" | "PROCEDURE" | "SERVICE" | "BRANCH";
  title: string;
  titleEn: string;
  titleBn: string;
  subtitle: string;
  subtitleEn: string;
  subtitleBn: string;
  category: "Doctor" | "Condition" | "Procedure" | "Department" | "Service";
  categoryLabel: string;
  href: string;
}

export function executeGlobalSearch(
  rawQuery: string,
  locale: Locale = "en",
  categoryFilter?: string
): GlobalSearchResultItem[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const results: GlobalSearchResultItem[] = [];

  // 1. Doctors
  if (
    !categoryFilter ||
    categoryFilter === "ALL" ||
    categoryFilter === "Doctor"
  ) {
    for (const doc of getPublishedDoctors({ query: q })) {
      results.push({
        id: doc.id,
        type: "DOCTOR",
        title: locale === "bn" ? doc.nameBn : doc.nameEn,
        titleEn: doc.nameEn,
        titleBn: doc.nameBn,
        subtitle: locale === "bn" ? doc.designationBn : doc.designationEn,
        subtitleEn: doc.designationEn,
        subtitleBn: doc.designationBn,
        category: "Doctor",
        categoryLabel:
          locale === "bn" ? "বিশেষজ্ঞ চিকিৎসক" : "Specialist Doctor",
        href: `/doctors/${doc.slug}`,
      });
    }
  }

  // 2. Diseases & Conditions
  if (
    !categoryFilter ||
    categoryFilter === "ALL" ||
    categoryFilter === "Condition"
  ) {
    for (const cond of getPublishedConditions({ query: q })) {
      results.push({
        id: cond.id,
        type: "CONDITION",
        title: locale === "bn" ? cond.nameBn : cond.nameEn,
        titleEn: cond.nameEn,
        titleBn: cond.nameBn,
        subtitle: locale === "bn" ? cond.summaryBn : cond.summaryEn,
        subtitleEn: cond.summaryEn,
        subtitleBn: cond.summaryBn,
        category: "Condition",
        categoryLabel:
          locale === "bn" ? "রোগ ও শারীরিক অবস্থা" : "Disease & Condition",
        href: `/diseases-conditions/${cond.slug}`,
      });
    }
  }

  // 3. Medical Tests & Procedures
  if (
    !categoryFilter ||
    categoryFilter === "ALL" ||
    categoryFilter === "Procedure"
  ) {
    for (const proc of getPublishedProcedures(q)) {
      results.push({
        id: proc.id,
        type: "PROCEDURE",
        title: locale === "bn" ? proc.nameBn : proc.nameEn,
        titleEn: proc.nameEn,
        titleBn: proc.nameBn,
        subtitle: locale === "bn" ? proc.summaryBn : proc.summaryEn,
        subtitleEn: proc.summaryEn,
        subtitleBn: proc.summaryBn,
        category: "Procedure",
        categoryLabel: locale === "bn" ? "পরীক্ষা ও প্রসিডিউর" : "Test & Procedure",
        href: `/tests-procedures/${proc.slug}`,
      });
    }
  }

  // 4. Departments
  if (
    !categoryFilter ||
    categoryFilter === "ALL" ||
    categoryFilter === "Department"
  ) {
    for (const dept of getPublishedDepartments()) {
      const hay = [
        dept.nameEn,
        dept.nameBn,
        dept.shortDescriptionEn,
        dept.shortDescriptionBn,
        ...(dept.servicesEn ?? []),
        ...(dept.servicesBn ?? []),
        ...(dept.commonConditionsEn ?? []),
        ...(dept.commonConditionsBn ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q)) {
        results.push({
          id: dept.id,
          type: "DEPARTMENT",
          title: locale === "bn" ? dept.nameBn : dept.nameEn,
          titleEn: dept.nameEn,
          titleBn: dept.nameBn,
          subtitle:
            locale === "bn"
              ? dept.shortDescriptionBn
              : dept.shortDescriptionEn,
          subtitleEn: dept.shortDescriptionEn,
          subtitleBn: dept.shortDescriptionBn,
          category: "Department",
          categoryLabel:
            locale === "bn" ? "বিভাগ ও স্পেশালিটি" : "Department & Specialty",
          href: `/departments/${dept.slug}`,
        });
      }
    }
  }

  // 5. Services
  if (
    !categoryFilter ||
    categoryFilter === "ALL" ||
    categoryFilter === "Service"
  ) {
    for (const srv of getPublishedServices()) {
      const hay = [srv.nameEn, srv.nameBn, srv.descriptionEn, srv.descriptionBn]
        .join(" ")
        .toLowerCase();
      if (hay.includes(q)) {
        results.push({
          id: srv.id,
          type: "SERVICE",
          title: locale === "bn" ? srv.nameBn : srv.nameEn,
          titleEn: srv.nameEn,
          titleBn: srv.nameBn,
          subtitle: `${srv.feeBdt} BDT — ${
            locale === "bn" ? srv.descriptionBn : srv.descriptionEn
          }`,
          subtitleEn: `${srv.feeBdt} BDT — ${srv.descriptionEn}`,
          subtitleBn: `${srv.feeBdt} টাকা — ${srv.descriptionBn}`,
          category: "Service",
          categoryLabel:
            locale === "bn" ? "হাসপাতাল সেবা ও ফি" : "Hospital Service & Fee",
          href: `/tests-procedures`,
        });
      }
    }
  }

  return results.slice(0, 20);
}

export function getPublishedHospitalNotices(): HospitalNotice[] {
  const db = getDbState();
  return (db.hospitalNotices || []).filter((n) => n.isActive);
}

