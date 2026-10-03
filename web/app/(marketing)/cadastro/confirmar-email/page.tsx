import { redirect } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { ResendForm } from "@/components/auth/ResendForm";
import { readAuthContext } from "@/lib/auth/auth-context-cookie";
import { resendConfirmation } from "@/app/(marketing)/entrar/magic-link-actions";
import { NovoLinkForm } from "./novo-link-form";

export default async function ConfirmarEmailPage(props: PageProps<"/cadastro/confirmar-email">) {
  const searchParams = await props.searchParams;
  const expired = searchParams.erro === "expirado";

  // AD-010: o e-mail vem do cookie assinado, nunca da URL.
  const ctx = await readAuthContext("signup");
  if (!ctx && !expired) redirect("/cadastro");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          {expired ? "Esse link venceu" : "Confirme seu e-mail"}
        </Typography>
        {expired ? (
          <Typography variant="body" role="alert" className="mt-2 text-foreground/70">
            O link de confirmação já foi usado ou passou de 10 minutos. Peça um novo.
          </Typography>
        ) : (
          <Typography variant="body" className="mt-2 text-foreground/70">
            Enviamos um link de confirmação para <strong>{ctx!.email}</strong>. Clique nele para
            começar a usar a Îasy. O link vale por 10 minutos. Olhe também a caixa de spam.
          </Typography>
        )}
      </div>

      {ctx ? (
        <ResendForm
          action={resendConfirmation}
          label={expired ? "Enviar novo link" : "Reenviar e-mail"}
          sentText="Enviamos outro e-mail."
          initialCooldown={expired ? 0 : 60}
        />
      ) : (
        <NovoLinkForm />
      )}

      <Typography variant="body" size="sm">
        <a href="/entrar" className="text-primary underline-offset-4 hover:underline">
          Já confirmou? Entrar
        </a>
      </Typography>
    </main>
  );
}
