export type Role = "investidor" | "empresa" | "produtor" | "verificador";

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: "no-session" | "wrong-role" };

interface RouteRule {
  pattern: RegExp;
  roles: Role[];
}

/**
 * Rotas privadas do MVP e os papeis que podem acessa-las (RN-01, RN-26,
 * RN-30). Qualquer caminho que nao bata com nenhuma regra e' publico.
 * A primeira regra cujo padrao combina com o caminho e' a que vale.
 */
export const ROUTE_ACCESS: RouteRule[] = [
  { pattern: /^\/produtor(\/|$)/, roles: ["produtor"] },
  { pattern: /^\/verificacao(\/|$)/, roles: ["verificador"] },
  { pattern: /^\/interesses(\/|$)/, roles: ["investidor", "empresa"] },
  {
    pattern: /^\/negocios\/[^/]+\/documentos(\/|$)/,
    roles: ["investidor", "empresa"],
  },
];

/**
 * Decide se `role` pode acessar `pathname`. `role` e' `null` para
 * visitante sem sessao (CA-02.3). Rotas que nao batem com nenhuma regra
 * de `ROUTE_ACCESS` sao publicas e sempre permitidas.
 */
export function resolveAccess(pathname: string, role: Role | null): AccessResult {
  const rule = ROUTE_ACCESS.find(({ pattern }) => pattern.test(pathname));

  if (!rule) {
    return { allowed: true };
  }
  if (!role) {
    return { allowed: false, reason: "no-session" };
  }
  if (!rule.roles.includes(role)) {
    return { allowed: false, reason: "wrong-role" };
  }
  return { allowed: true };
}
