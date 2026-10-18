import { Metadata } from "next";
import { WritingClient } from "./writing-client";

export const metadata: Metadata = { title: "Writing Assistant" };

export default function WritingPage() {
  return <WritingClient />;
}
