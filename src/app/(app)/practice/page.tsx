import { Metadata } from "next";
import { PracticeClient } from "./practice-client";

export const metadata: Metadata = { title: "Sentence Practice" };

export default function PracticePage() {
  return <PracticeClient />;
}
