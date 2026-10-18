import { Metadata } from "next";
import { AddWordForm } from "@/components/words/add-word-form";

export const metadata: Metadata = { title: "Add Word" };

export default function AddWordPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-2xl">
      <AddWordForm />
    </div>
  );
}
