import { resolveAccess } from "./roles";
import { isSafeRedirect, type ProfileRole } from "./redirect";

export interface PostAuthProfile {
  role: ProfileRole;
  termos_aceitos_em: string | null;
}

export interface PostAuthDeps {
  getProfile(userId: string): Promise<PostAuthProfile | null>;
  migrateAnswers(userId: string): Promise<void>;
  resolveDefault(userId: string, role: ProfileRole): Promise<string>;
}

function withRedirect(base: string, requested: string | null | undefined): string {
  if (requested && isSafeRedirect(requested)) {
    return `${base}?${new URLSearchParams({ redirect: requested }).toString()}`;
  }
  return base;
}

/**
 * AUTH-01: ponto unico do destino depois de QUALQUER autenticacao
 * (senha, magic link, confirmacao de e-mail, redefinicao de senha).
 * Ordem fixa:
 *   1. sem perfil            -> /completar-perfil
 *   2. migra o cookie de respostas (RN-23) para investidor/empresa,
 *      antes de qualquer redirect
 *   3. termos pendentes      -> /termos (RN-55)
 *   4. `requested` seguro E permitido para o papel (RN-56)
 *   5. destino padrao do papel (RF-03)
 */
export async function resolvePostAuthDestination(
  deps: PostAuthDeps,
  input: { userId: string; requested?: string | null }
): Promise<string> {
  const { userId, requested } = input;

  const profile = await deps.getProfile(userId);
  if (!profile) {
    return withRedirect("/completar-perfil", requested);
  }

  const { role } = profile;
  const isInvestorSide = role === "investidor" || role === "empresa";

  if (isInvestorSide) {
    await deps.migrateAnswers(userId);
    if (!profile.termos_aceitos_em) {
      return withRedirect("/termos", requested);
    }
  }

  if (requested && isSafeRedirect(requested)) {
    const pathname = requested.split(/[?#]/)[0];
    if (resolveAccess(pathname, role).allowed) {
      return requested;
    }
  }

  return deps.resolveDefault(userId, role);
}
