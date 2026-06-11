import { redirect } from "next/navigation";

export default function Home() {
  // Pending-to-connect is the standard working view — land there, not the dashboard.
  redirect("/vendors?status=NEW");
}
