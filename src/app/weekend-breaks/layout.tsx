import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weekend Group Getaways | Luxury Party Houses",
  description: "Weekend group getaways in luxury houses across the UK. 2-3 night breaks with hot tubs, games rooms and premium facilities. From £89pp per night.",
  keywords: ["weekend house hire", "group weekend breaks", "luxury party houses", "hen weekend accommodation"],
  openGraph: {
    title: "Luxury Weekend Breaks for Groups",
    description: "Luxury weekend breaks for groups. 2-3 nights from £89pp with hot tubs and entertainment.",
    url: "https://www.groupescapehouses.co.uk/weekend-breaks",
  },
};

export default function WeekendBreaksRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
