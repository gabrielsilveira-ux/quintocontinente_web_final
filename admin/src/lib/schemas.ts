import { z } from "zod";

// Esquema de Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório")
    .email("Insira um endereço de e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// Esquema de Banner
export const bannerSchema = z.object({
  title: z.string().min(1, "O título é obrigatório").max(100, "O título deve ter no máximo 100 caracteres"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "A imagem é obrigatória").url("A URL da imagem é inválida"),
  linkUrl: z.string().optional().nullable(),
  label: z.string().min(1, "A tag/label é obrigatória").max(30, "A tag deve ter no máximo 30 caracteres"),
  order: z.preprocess((val) => Number(val ?? 0), z.number().int().nonnegative()),
  active: z.boolean().default(true),
});

// Esquema de Artista
export const artistSchema = z.object({
  name: z.string().min(1, "O nome do artista é obrigatório").max(100, "O nome deve ter no máximo 100 caracteres"),
  slug: z.string().min(1, "O slug é obrigatório").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
  imageUrl: z.string().min(1, "A imagem é obrigatória").url("A URL da imagem é inválida"),
  bio: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  websiteUrl: z.string().url("A URL é inválida").or(z.literal("")).optional().nullable(),
  instagramUrl: z.string().url("A URL é inválida").or(z.literal("")).optional().nullable(),
  spotifyUrl: z.string().url("A URL é inválida").or(z.literal("")).optional().nullable(),
  galleryUrls: z.array(z.string()).default([]),
  order: z.preprocess((val) => Number(val ?? 0), z.number().int().nonnegative()),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

// Esquema de Item de Galeria
export const gallerySchema = z.object({
  title: z.string().optional().nullable(),
  imageUrl: z.string().min(1, "A imagem é obrigatória").url("A URL da imagem é inválida"),
  category: z.string().min(1, "A categoria é obrigatória").max(50, "A categoria deve ter no máximo 50 caracteres"),
  order: z.preprocess((val) => Number(val ?? 0), z.number().int().nonnegative()),
  active: z.boolean().default(true),
});

// Esquema de Lead (Formulário de Contato)
export const leadSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres").max(100, "O nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Insira um e-mail válido"),
  phone: z.string().min(8, "O telefone/WhatsApp deve ter no mínimo 8 dígitos").max(20, "Telefone muito longo"),
  eventType: z.string().min(1, "Selecione o tipo de evento"),
  artistInterest: z.string().optional().nullable(),
  status: z.enum(["NOVO", "EM_ATENDIMENTO", "CONCLUIDO", "ARQUIVADO"]).default("NOVO"),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  utmContent: z.string().optional().nullable(),
});

// Esquema de Criação/Edição de Usuários (Colaboradores)
export const userSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres").max(100, "O nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Insira um e-mail válido"),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .optional()
    .or(z.literal("")), // Permite senha vazia na edição (não altera)
  role: z.enum(["ADMIN", "EDITOR"]).default("ADMIN"),
});

// Esquema de Página
export const pageSchema = z.object({
  title: z.string().min(1, "O título da página é obrigatório").max(100, "Máximo de 100 caracteres"),
  slug: z.string().min(1, "O slug é obrigatório").regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hifens"),
  description: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

// Esquema de Seção de Página
export const pageSectionSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  imageUrl: z.string().url("A URL da imagem é inválida").or(z.literal("")).optional().nullable(),
  videoUrl: z.string().url("A URL do vídeo é inválida").or(z.literal("")).optional().nullable(),
  bgType: z.enum(["DARK", "WHITE"]).default("DARK"),
  order: z.preprocess((val) => Number(val ?? 0), z.number().int().nonnegative()),
});
