import React from "react";
import {
  getPublishedBranches,
  getPublishedConditions,
  getPublishedDepartments,
  getPublishedDoctors,
} from "@/server/services/publicQueryService";
import { HomepageClient } from "@/components/home/HomepageClient";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  const doctors = getPublishedDoctors();
  const conditions = getPublishedConditions();

  return (
    <HomepageClient
      branches={branches}
      departments={departments}
      doctors={doctors}
      conditions={conditions}
    />
  );
}

