import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
// @ts-expect-error - sharp types can fail resolution depending on bundler settings
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    // 1. Garante que o usuário está autenticado
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para realizar uploads." },
        { status: 401 }
      );
    }

    // 2. Lê o corpo da requisição em formato FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media"; // bucket padrão

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    // 3. Valida se é um tipo de arquivo aceitável (imagem)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Apenas arquivos de imagem são permitidos." },
        { status: 400 }
      );
    }

    // 4. Configuração das credenciais do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Credenciais do Supabase não configuradas no servidor." },
        { status: 500 }
      );
    }

    // 5. Gera um nome de arquivo único para evitar colisões
    const fileExt = file.name.split(".").pop() || "jpg";
    let uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // 6. Converte o arquivo para Buffer e tenta otimizar com Sharp
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    
    let buffer = inputBuffer;
    let contentType = file.type;
    
    try {
      buffer = await sharp(inputBuffer)
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      contentType = "image/webp";
      
      // Substitui a extensão original por .webp no nome final do arquivo
      const baseName = uniqueFileName.substring(0, uniqueFileName.lastIndexOf("."));
      uniqueFileName = `${baseName}.webp`;
    } catch (sharpError) {
      console.warn("Sharp falhou ao otimizar a imagem, enviando original:", sharpError);
      buffer = inputBuffer;
    }

    // 7. Envia o arquivo para a API de Storage do Supabase
    // URL de Upload: https://[project-id].supabase.co/storage/v1/object/[bucket]/[filename]
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${uniqueFileName}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": contentType,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro no upload para o Supabase Storage:", errorText);
      return NextResponse.json(
        { error: "Falha ao enviar a imagem para o Supabase Storage." },
        { status: 500 }
      );
    }

    // 8. Constrói a URL pública final
    // URL Pública: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[filename]
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
    });
  } catch (error: any) {
    console.error("Erro na rota de upload:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
