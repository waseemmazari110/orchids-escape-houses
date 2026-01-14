import type { Metadata } from "next";
import AdventureHolidaysClient from "./AdventureHolidaysClient";

export const metadata: Metadata = {
  title: "Adventure Holidays Group Accommodation | Group Escape Houses",
  description: "Book the perfect base for your adventure holidays in the UK. Luxury group accommodation near hiking, water sports, and outdoor activities for active groups.",
};

export default function AdventureHolidaysPage() {
  return <AdventureHolidaysClient />;
}
