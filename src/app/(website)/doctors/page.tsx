import React from "react";
import {
  getPublishedBranches,
  getPublishedDepartments,
  getPublishedDoctors,
  getSpecialties,
} from "@/server/services/publicQueryService";
import { DoctorsDirectoryClient } from "@/components/doctors/DoctorsDirectoryClient";

export const dynamic = "force-dynamic";

export default function DoctorsPage() {
  const doctors = getPublishedDoctors();
  const departments = getPublishedDepartments();
  const branches = getPublishedBranches();
  const specialties = getSpecialties();

  return (
    <DoctorsDirectoryClient
      doctors={doctors}
      departments={departments}
      branches={branches}
      specialties={specialties}
    />
  );
}

