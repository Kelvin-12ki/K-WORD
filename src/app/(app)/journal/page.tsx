import { Metadata } from "next";
import { JournalClient } from "./journal-client";

export const metadata: Metadata = { title: "Vocabulary Journal" };

export default function JournalPage() {
  return <JournalClient />;
}
