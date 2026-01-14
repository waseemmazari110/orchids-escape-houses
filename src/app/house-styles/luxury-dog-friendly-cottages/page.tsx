import type { Metadata } from "next";
import DogFriendlyClient from "./DogFriendlyClient";

export const metadata: Metadata = {
  title: "Dog Friendly Holiday Cottages and Group Accommodation | Group Escape Houses",
  description: "Find luxury dog friendly holiday cottages and group accommodation across the UK. Perfect for large groups where every family member, including pets, is welcome.",
};

export default function DogFriendlyPage() {
  return <DogFriendlyClient />;
}
