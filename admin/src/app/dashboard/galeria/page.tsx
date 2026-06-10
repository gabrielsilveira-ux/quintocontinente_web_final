import React from "react";
import prisma from "@/lib/db";
import { GalleryManager } from "@/components/GalleryManager";

export const revalidate = 0; // Atualiza dados em tempo real

export default async function GalleryPage() {
  // 1. Busca os itens da galeria cadastrados
  const items = await prisma.galleryItem.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="w-full">
      {/* Renderiza o gerenciador interativo no lado do cliente */}
      <GalleryManager initialItems={items} />
    </div>
  );
}
