import type { Metadata } from "next";
import BusinessOffsiteClient from "./BusinessOffsiteClient";

export const metadata: Metadata = {
  title: "Business Offsite and Corporate Accommodation | Group Escape Houses",
  description: "Book professional business offsite and corporate accommodation in the UK. Luxury group houses designed for team building, retreats, and remote working sessions.",
};

export default function BusinessOffsitePage() {
  return <BusinessOffsiteClient />;
}
