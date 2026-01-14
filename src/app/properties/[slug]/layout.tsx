import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Large Holiday House | Group Escape Houses",
  description: "View details, photos, and availability for this exceptional large group accommodation. Perfect for your next group getaway.",
  alternates: {
    canonical: "https://groupescapehouses.co.uk/properties",
  },
};

export default function PropertyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
