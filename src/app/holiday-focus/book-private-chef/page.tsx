import type { Metadata } from "next";
import BookPrivateChefClient from "./BookPrivateChefClient";

export const metadata: Metadata = {
  title: "Book a Private Chef for Your Group Stay | Group Escape Houses",
  description: "Enhance your group stay by booking a private chef for your holiday home. Professional in-house catering across the UK for celebrations and special occasions.",
};

export default function BookPrivateChefPage() {
  return <BookPrivateChefClient />;
}
