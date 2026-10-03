import { redirect } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { ResendForm } from "@/components/auth/ResendForm";
import { readAuthContext } from "@/lib/auth/auth-context-cookie";
import { resendMagicLink } from "../magic-link-actions";

export default async function LinkEnviadoPage() {
  // AD-010: o e-mail vem do cookie assinado, nunca da URL.
  const ctx = await readAuthContext("magic");
  if (!ctx) redirect("/entrar");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          Confira seu e-mail
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Se existir uma conta com <strong>{ctx.email}</strong>, enviamos um link de acesso.
          Ele vale por 10 minutos e só pode ser usado uma vez. Olhe também a caixa de spam.
        </Typography>
      </div>

      <ResendForm
        action={resendMagicLink}
        label="Reenviar"
        sentText="Enviamos outro link."
      />

      <Typography variant="body" size="sm">
        <a href="/entrar" className="text-primary underline-offset-4 hover:underline">
          Voltar para entrar
        </a>
      </Typography>
    </main>
  );
}
