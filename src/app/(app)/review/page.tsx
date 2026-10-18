import { Metadata } from "next";
import { ReviewClient } from "./review-client";

export const metadata: Metadata = { title: "Daily Review" };

export default function ReviewPage() {
  return <ReviewClient />;
}
