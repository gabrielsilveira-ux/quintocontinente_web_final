import React from "react";
import prisma from "@/lib/db";
import { ArtistsManager } from "@/components/ArtistsManager";

export const revalidate = 0; // Evita cache, atualiza dados em tempo real

export default async function ArtistsPage() {
  // 1. Busca os artistas cadastrados
  const artists = await prisma.artist.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="w-full">
      {/* Renderiza o gerenciador interativo no lado do cliente */}
      <ArtistsManager initialArtists={artists} />
    </div>
  );
}
