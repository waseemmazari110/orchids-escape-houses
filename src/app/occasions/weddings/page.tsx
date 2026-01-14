import type { Metadata } from "next";
import WeddingsClient from "./WeddingsClient";

export const metadata: Metadata = {
  title: "Wedding Venues with Accommodation | Group Escape Houses",
  description: "Discover stunning wedding venues with accommodation across the UK. Perfect for intimate celebrations, ceremonies, and full-weekend group wedding stays.",
};

export default function WeddingsPage() {
  return <WeddingsClient />;
}
