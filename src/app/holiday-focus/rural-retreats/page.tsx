import type { Metadata } from "next";
import RuralRetreatsClient from "./RuralRetreatsClient";

export const metadata: Metadata = {
  title: "Rural Retreats Group Accommodation | Group Escape Houses",
  description: "Discover luxury rural retreats for large groups across the UK. Escape to the countryside with our handpicked collection of group houses and cottages.",
};

export default function RuralRetreatsPage() {
  return <RuralRetreatsClient />;
}
