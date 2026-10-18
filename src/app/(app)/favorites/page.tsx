import { Metadata } from "next";
import { FavoritesClient } from "./favorites-client";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return <FavoritesClient />;
}
