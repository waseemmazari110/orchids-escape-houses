import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Large Group Accommodation & Luxury Holiday Homes | Group Escape Houses",
  description: "Browse our hand-picked collection of exceptional large group accommodation across the UK. Perfect for celebrations, family gatherings, and corporate retreats.",
  keywords: ["large group accommodation", "luxury holiday homes", "group stays uk", "celebration houses"],
  openGraph: {
    title: "Large Group Accommodation & Luxury Holiday Homes | Group Escape Houses",
    description: "Browse our collection of exceptional large group accommodation across the UK. Perfect for any occasion.",
    url: "https://groupescapehouses.co.uk/properties",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://groupescapehouses.co.uk/properties",
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
