// Node.js end-to-end verification script for Evercare 5 role-based dashboards & specialist CRUD
import http from "node:http";

const BASE_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const headers = { ...options.headers };
  let body = options.body;
  if (body && typeof body === "object") {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers,
    body,
    redirect: "manual",
  });

  const setCookie = res.headers.get("set-cookie");
  let cookie = "";
  if (setCookie) {
    cookie = setCookie.split(";")[0];
  }

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {}
  } else {
    try {
      data = await res.text();
    } catch {}
  }

  return {
    status: res.status,
    headers: res.headers,
    cookie,
    data,
  };
}

async function login(email, password) {
  const res = await request("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return {
    status: res.status,
    cookie: res.cookie,
    user: res.data?.user,
  };
}

async function runTests() {
  console.log("================================================================================");
  console.log("EVERCARE — FIVE DASHBOARDS & SPECIALIST CRUD VERIFICATION SUITE");
  console.log("================================================================================\n");

  const results = [];

  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const mark = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${mark}: ${testName}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // --------------------------------------------------------------------------
  // ROLE A: SUPER ADMIN
  // --------------------------------------------------------------------------
  console.log("\n[TESTING ROLE A: SUPER ADMIN (superadmin@evercare.bd)]");
  const superAuth = await login("superadmin@evercare.bd", "Evercare#2026");
  record("Super Admin Login", superAuth.status === 200 && superAuth.user?.role === "SUPER_ADMIN", `Status ${superAuth.status}, role=${superAuth.user?.role}`);

  const superAdminPage = await request("/admin", {
    headers: { Cookie: superAuth.cookie },
  });
  record("Super Admin Access /admin", superAdminPage.status === 200 && superAdminPage.data.includes("Super Admin"), `Status ${superAdminPage.status}`);

  const superUsersApi = await request("/api/v1/admin/users", {
    headers: { Cookie: superAuth.cookie },
  });
  record("Super Admin GET /api/v1/admin/users", superUsersApi.status === 200 && Array.isArray(superUsersApi.data?.users), `Count: ${superUsersApi.data?.users?.length} users`);

  const superAnalyticsApi = await request("/api/v1/admin/analytics", {
    headers: { Cookie: superAuth.cookie },
  });
  record("Super Admin GET /api/v1/admin/analytics", superAnalyticsApi.status === 200 && superAnalyticsApi.data?.ok, `Status ${superAnalyticsApi.status}`);

  // --------------------------------------------------------------------------
  // ROLE B: HOSPITAL ADMIN & SPECIALIST CRUD
  // --------------------------------------------------------------------------
  console.log("\n[TESTING ROLE B: HOSPITAL ADMIN & SPECIALIST CRUD (admin@evercare.bd)]");
  const hospAuth = await login("admin@evercare.bd", "Evercare#2026");
  record("Hospital Admin Login", hospAuth.status === 200 && hospAuth.user?.role === "HOSPITAL_ADMIN", `Role=${hospAuth.user?.role}`);

  const hospAdminPage = await request("/admin", {
    headers: { Cookie: hospAuth.cookie },
  });
  record("Hospital Admin Access /admin", hospAdminPage.status === 200 && hospAdminPage.data.includes("Hospital Admin"), `Status ${hospAdminPage.status}`);

  // SPECIALIST CRUD: CREATE
  const createDocRes = await request("/api/v1/admin/doctors", {
    method: "POST",
    headers: { Cookie: hospAuth.cookie },
    body: {
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "prof-dr-kamal-ahmed-e2e",
      nameEn: "Prof. Dr. Kamal Ahmed",
      nameBn: "অধ্যাপক ডা. কামাল আহমেদ",
      designationEn: "Chief Consultant Cardiologist",
      designationBn: "চিফ কনসালট্যান্ট কার্ডিওলজিস্ট",
      qualificationsEn: "MBBS, MD (Cardiology), FCPS",
      qualificationsBn: "এমবিবিএস, এমডি, এফসিপিএস",
      experienceYears: 22,
      bmdcRegistrationNo: "BMDC-A-91102",
      bioEn: "Renowned interventional cardiologist with extensive coronary stenting experience.",
      bioBn: "২২ বছরের অভিজ্ঞতাসম্পন্ন খ্যাতনামা হৃদরোগ বিশেষজ্ঞ।",
      consultationFeeBdt: 2200,
      followupFeeBdt: 1400,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Room 408 (4th Floor)",
      publicationState: "PUBLISHED",
    },
  });
  const createdDoc = createDocRes.data?.doctor;
  record("Specialist CRUD: CREATE (POST /api/v1/admin/doctors)", createDocRes.status === 200 && createdDoc?.nameEn === "Prof. Dr. Kamal Ahmed", `DocId=${createdDoc?.id}, BMDC=${createdDoc?.bmdcRegistrationNo}`);

  // SPECIALIST CRUD: UPDATE
  const updateDocRes = await request("/api/v1/admin/doctors", {
    method: "POST",
    headers: { Cookie: hospAuth.cookie },
    body: {
      id: createdDoc?.id,
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "prof-dr-kamal-ahmed-e2e",
      nameEn: "Prof. Dr. Kamal Ahmed",
      nameBn: "অধ্যাপক ডা. কামাল আহমেদ",
      designationEn: "Senior Director & Chief Cardiologist",
      designationBn: "সিনিয়র ডিরেক্টর ও চিফ কার্ডিওলজিস্ট",
      qualificationsEn: "MBBS, MD, FCPS, FACC",
      qualificationsBn: "এমবিবিএস, এমডি, এফসিপিএস, এফএসিসি",
      experienceYears: 24,
      bmdcRegistrationNo: "BMDC-A-91102",
      bioEn: "Senior Director and Chief Cardiologist leading cardiology innovations.",
      bioBn: "সিনিয়র ডিরেক্টর ও প্রধান কার্ডিওলজিস্ট।",
      consultationFeeBdt: 2600,
      followupFeeBdt: 1600,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Executive Suite 501",
      publicationState: "PUBLISHED",
    },
  });
  const updatedDoc = updateDocRes.data?.doctor;
  record("Specialist CRUD: UPDATE (POST /api/v1/admin/doctors with id)", updateDocRes.status === 200 && updatedDoc?.consultationFeeBdt === 2600 && updatedDoc?.branches?.[0]?.roomNumber === "Executive Suite 501", `Fee=${updatedDoc?.consultationFeeBdt}, Room=${updatedDoc?.branches?.[0]?.roomNumber}`);

  // SPECIALIST CRUD: DEACTIVATE
  const deactRes = await request("/api/v1/admin/doctors", {
    method: "PATCH",
    headers: { Cookie: hospAuth.cookie },
    body: {
      doctorId: createdDoc?.id,
      action: "DEACTIVATE",
    },
  });
  record("Specialist CRUD: DEACTIVATE (PATCH action: DEACTIVATE)", deactRes.status === 200 && deactRes.data?.doctor?.publicationState === "ARCHIVED", `State=${deactRes.data?.doctor?.publicationState}`);

  // Verify excluded from public directory
  const pubDocs = await request("/api/v1/public/doctors");
  const foundInPublic = pubDocs.data?.doctors?.some((d) => d.id === createdDoc?.id);
  record("Specialist Excluded from Public Directory when ARCHIVED", foundInPublic === false, `Found in public: ${foundInPublic}`);

  // SPECIALIST CRUD: RE-ACTIVATE
  const reactRes = await request("/api/v1/admin/doctors", {
    method: "PATCH",
    headers: { Cookie: hospAuth.cookie },
    body: {
      doctorId: createdDoc?.id,
      action: "ACTIVATE",
    },
  });
  record("Specialist CRUD: RE-ACTIVATE (PATCH action: ACTIVATE)", reactRes.status === 200 && reactRes.data?.doctor?.publicationState === "PUBLISHED", `State=${reactRes.data?.doctor?.publicationState}`);

  // --------------------------------------------------------------------------
  // ROLE C: RECEPTIONIST
  // --------------------------------------------------------------------------
  console.log("\n[TESTING ROLE C: RECEPTIONIST (frontdesk@evercare.bd)]");
  const recAuth = await login("frontdesk@evercare.bd", "Evercare#2026");
  record("Receptionist Login", recAuth.status === 200 && recAuth.user?.role === "RECEPTIONIST", `Role=${recAuth.user?.role}`);

  const recAdminPage = await request("/admin", {
    headers: { Cookie: recAuth.cookie },
  });
  record("Receptionist Access /admin", recAdminPage.status === 200 && recAdminPage.data.includes("Front Desk"), `Status ${recAdminPage.status}`);

  const recAptsApi = await request("/api/v1/admin/appointments", {
    headers: { Cookie: recAuth.cookie },
  });
  record("Receptionist GET /api/v1/admin/appointments (Permitted)", recAptsApi.status === 200 && Array.isArray(recAptsApi.data?.appointments), `Count: ${recAptsApi.data?.count}`);

  // FORBIDDEN CHECKS FOR RECEPTIONIST
  const recUsersForbidden = await request("/api/v1/admin/users", {
    headers: { Cookie: recAuth.cookie },
  });
  record("Receptionist BLOCKED from GET /api/v1/admin/users (RBAC)", recUsersForbidden.status === 403, `Status=${recUsersForbidden.status}`);

  const recDoctorCreateForbidden = await request("/api/v1/admin/doctors", {
    method: "POST",
    headers: { Cookie: recAuth.cookie },
    body: { nameEn: "Unauthorized Doc" },
  });
  record("Receptionist BLOCKED from POST /api/v1/admin/doctors", recDoctorCreateForbidden.status === 403, `Status=${recDoctorCreateForbidden.status}`);

  const recAnalyticsForbidden = await request("/api/v1/admin/analytics", {
    headers: { Cookie: recAuth.cookie },
  });
  record("Receptionist BLOCKED from GET /api/v1/admin/analytics", recAnalyticsForbidden.status === 403, `Status=${recAnalyticsForbidden.status}`);

  // --------------------------------------------------------------------------
  // ROLE D: CONTENT EDITOR (CMS)
  // --------------------------------------------------------------------------
  console.log("\n[TESTING ROLE D: CONTENT EDITOR (editor@evercare.bd)]");
  const edAuth = await login("editor@evercare.bd", "Evercare#2026");
  record("Content Editor Login", edAuth.status === 200 && edAuth.user?.role === "CONTENT_EDITOR", `Role=${edAuth.user?.role}`);

  const edAdminPage = await request("/admin", {
    headers: { Cookie: edAuth.cookie },
  });
  record("Content Editor Access /admin", edAdminPage.status === 200 && edAdminPage.data.includes("Content Editor"), `Status ${edAdminPage.status}`);

  const edContentApi = await request("/api/v1/admin/content", {
    headers: { Cookie: edAuth.cookie },
  });
  record("Content Editor GET /api/v1/admin/content (Permitted)", edContentApi.status === 200 && Array.isArray(edContentApi.data?.conditions), `Conditions count: ${edContentApi.data?.conditions?.length}`);

  // FORBIDDEN CHECKS FOR CONTENT EDITOR
  const edAptsForbidden = await request("/api/v1/admin/appointments", {
    headers: { Cookie: edAuth.cookie },
  });
  record("Content Editor BLOCKED from Operational Appointments", edAptsForbidden.status === 403, `Status=${edAptsForbidden.status}`);

  const edUsersForbidden = await request("/api/v1/admin/users", {
    headers: { Cookie: edAuth.cookie },
  });
  record("Content Editor BLOCKED from Staff Accounts (RBAC)", edUsersForbidden.status === 403, `Status=${edUsersForbidden.status}`);

  // Content editor submits doctor profile change -> forced to PENDING_APPROVAL
  const edDocSubmit = await request("/api/v1/admin/doctors", {
    method: "POST",
    headers: { Cookie: edAuth.cookie },
    body: {
      departmentId: "dept-cardiology",
      specialtyIds: ["spec-interventional-cardiology"],
      slug: "dr-editor-approval-test",
      nameEn: "Dr. Editor Proposal",
      nameBn: "ডা. এডিটর প্রস্তাব",
      designationEn: "Associate Consultant",
      designationBn: "সহযোগী কনসালট্যান্ট",
      qualificationsEn: "MBBS, D-Card",
      qualificationsBn: "এমবিবিএস",
      experienceYears: 7,
      bmdcRegistrationNo: "BMDC-A-44332",
      bioEn: "Specialist bio drafted by editor requiring administrative review.",
      bioBn: "অনুমোদনের জন্য প্রেরিত বিবরণ।",
      consultationFeeBdt: 1700,
      followupFeeBdt: 1000,
      feeEffectiveFrom: "2026-01-01",
      branchId: "branch-dhanmondi",
      roomNumber: "Chamber 205",
      publicationState: "PUBLISHED", // Attempt direct publish
    },
  });
  record("Content Editor cannot bypass approval: forced to PENDING_APPROVAL", edDocSubmit.status === 200 && edDocSubmit.data?.doctor?.publicationState === "PENDING_APPROVAL" && edDocSubmit.data?.approvalRequest != null, `State=${edDocSubmit.data?.doctor?.publicationState}`);

  // --------------------------------------------------------------------------
  // ROLE E: PATIENT PORTAL
  // --------------------------------------------------------------------------
  console.log("\n[TESTING ROLE E: PATIENT PORTAL (patient@evercare.bd)]");
  const patAuth = await login("patient@evercare.bd", "Evercare#2026");
  record("Patient Login", patAuth.status === 200 && patAuth.user?.role === "PATIENT", `Role=${patAuth.user?.role}`);

  const patDashboardPage = await request("/dashboard", {
    headers: { Cookie: patAuth.cookie },
  });
  record("Patient Access /dashboard", patDashboardPage.status === 200 && patDashboardPage.data.includes("Patient Portal"), `Status ${patDashboardPage.status}`);

  const patAdminRedirect = await request("/admin", {
    headers: { Cookie: patAuth.cookie },
  });
  record("Patient BLOCKED from /admin (Redirected to /dashboard)", patAdminRedirect.status === 307 || patAdminRedirect.status === 302, `Status ${patAdminRedirect.status}`);

  const patAdminApiForbidden = await request("/api/v1/admin/appointments", {
    headers: { Cookie: patAuth.cookie },
  });
  record("Patient BLOCKED from Staff Admin APIs", patAdminApiForbidden.status === 403, `Status=${patAdminApiForbidden.status}`);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log("\n================================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});

