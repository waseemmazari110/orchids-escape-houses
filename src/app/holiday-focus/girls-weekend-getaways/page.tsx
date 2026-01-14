import type { Metadata } from "next";
import GirlsWeekendClient from "./GirlsWeekendClient";

export const metadata: Metadata = {
  title: "Girls Weekend Getaways UK | Group Escape Houses",
  description: "Plan the ultimate girls' weekend getaway with our luxury group accommodation. Stunning houses and cottages across the UK perfect for relaxation and celebration.",
};

export default function GirlsWeekendPage() {
  return <GirlsWeekendClient />;
}
