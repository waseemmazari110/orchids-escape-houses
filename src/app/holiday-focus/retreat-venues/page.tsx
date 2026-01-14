import type { Metadata } from "next";
import RetreatVenuesClient from "./RetreatVenuesClient";

export const metadata: Metadata = {
  title: "Retreat Venues UK | Group Escape Houses",
  description: "Discover luxury retreat venues across the UK. Perfect group accommodation for wellness retreats, yoga workshops, and creative getaways in peaceful surroundings.",
};

export default function RetreatVenuesPage() {
  return <RetreatVenuesClient />;
}
