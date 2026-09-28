/** Gera um slug legivel a partir do nome do negocio (sem acento, minusculo, hifens). */
export function slugifyBusinessName(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Slug unico: nome + fragmento curto do id do negocio (evita colisao). */
export function buildBusinessSlug(nome: string, businessId: string): string {
  const base = slugifyBusinessName(nome) || "negocio";
  return `${base}-${businessId.slice(0, 8)}`;
}
