import { redirect } from "next/navigation";

export default function FacebookGeneratorRedirect() {
  redirect("/admin?tab=facebook");
}
