import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let pathname = "/";
let search = "";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("@/lib/auth/sign-out", () => ({ signOutAction: vi.fn() }));

import { AppChrome } from "../AppChrome";

beforeEach(() => {
  pathname = "/";
  search = "";
});

const renderAt = (path: string, role: "investidor" | null = null, query = "") => {
  pathname = path;
  search = query;
  return render(
    <AppChrome role={role}>
      <p>conteudo</p>
    </AppChrome>
  );
};

describe("AppChrome em rotas de auth (AUTH-05, critério 11)", () => {
  it.each(["/entrar", "/entrar/link-enviado", "/cadastro", "/cadastro/confirmar-email", "/esqueci-senha", "/esqueci-senha/codigo", "/redefinir-senha", "/completar-perfil", "/auth/confirm"])(
    "%s mostra so o logo com link para / e o conteudo",
    (path) => {
      renderAt(path);

      expect(screen.getByText("conteudo")).toBeTruthy();
      const logo = screen.getByRole("link", { name: "Îasy, voltar ao início" });
      expect(logo.getAttribute("href")).toBe("/");
      expect(screen.queryByRole("navigation")).toBeNull();
      expect(screen.queryByRole("contentinfo")).toBeNull();
      expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    }
  );

  it("nao confunde /entrarx com rota de auth", () => {
    renderAt("/entrarx");

    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
  });
});

describe("AppChrome em rotas publicas e do produtor/verificador", () => {
  it("rota comum mantem header, nav e banner legal", () => {
    renderAt("/negocios");

    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
    expect(screen.getByRole("contentinfo")).toBeTruthy();
  });

  it.each(["/produtor/painel", "/verificacao/123"])("%s continua sem chrome", (path) => {
    renderAt(path);

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(screen.getByText("conteudo")).toBeTruthy();
  });
});

describe("faixa de aviso sem-permissao (AUTH-01, critério 7a)", () => {
  it("aparece em /negocios?aviso=sem-permissao e pode ser dispensada", () => {
    renderAt("/negocios", "investidor", "aviso=sem-permissao");

    expect(screen.getByRole("status").textContent).toContain("Essa área é de outro perfil");

    fireEvent.click(screen.getByRole("button", { name: "Dispensar aviso" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("nao aparece sem o parametro ou com outro valor", () => {
    renderAt("/negocios", "investidor", "");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("nao aparece em rota de auth", () => {
    renderAt("/entrar", null, "aviso=sem-permissao");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
