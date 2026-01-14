import type { Metadata } from "next";
import MultiGenerationalClient from "./MultiGenerationalClient";

export const metadata: Metadata = {
  title: "Multi-Generational Holidays UK | Group Escape Houses",
  description: "Find the perfect multi-generational holiday homes across the UK. Luxury group accommodation designed for children, parents, and grandparents to enjoy together.",
};

export default function MultiGenerationalPage() {
  return <MultiGenerationalClient />;
}
