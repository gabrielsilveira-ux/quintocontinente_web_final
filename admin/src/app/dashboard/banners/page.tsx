import React from "react";
import prisma from "@/lib/db";
import { BannersManager } from "@/components/BannersManager";

export const revalidate = 0; // Garante que a página sempre consulte o banco diretamente

export default async function BannersPage() {
  // 1. Busca os banners ordenados
  const banners = await prisma.banner.findMany({
    orderBy: {
      order: "asc",
    },
  });

  return (
    <div className="w-full">
      {/* Renderiza o gerenciador interativo no lado do cliente */}
      <BannersManager initialBanners={banners} />
    </div>
  );
}
