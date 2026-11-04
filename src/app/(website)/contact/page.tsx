import React from "react";
import {
  getPublishedBranches,
  getPublishedDepartments,
} from "@/server/services/publicQueryService";
import { ContactAndFeedbackClient } from "@/components/contact/ContactAndFeedbackClient";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const branches = getPublishedBranches();
  const departments = getPublishedDepartments();
  return (
    <ContactAndFeedbackClient branches={branches} departments={departments} />
  );
}

