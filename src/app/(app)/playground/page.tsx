import { Metadata } from "next";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = { title: "Word Playground" };

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
