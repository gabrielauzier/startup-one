import { redirect } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { ResendForm } from "@/components/auth/ResendForm";
import { readAuthContext } from "@/lib/auth/auth-context-cookie";
import { CodigoForm } from "./codigo-form";
import { resendResetCode } from "./actions";

export default async function CodigoPage() {
  // AD-010: o e-mail vem do cookie assinado, nunca da URL.
  const ctx = await readAuthContext("reset");
  if (!ctx) redirect("/esqueci-senha");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          Digite o código
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Se existir uma conta com <strong>{ctx.email}</strong>, enviamos um código de 6 dígitos.
          Ele vale por 10 minutos. Olhe também a caixa de spam.
        </Typography>
      </div>

      <CodigoForm />

      <ResendForm
        action={resendResetCode}
        label="Reenviar código"
        sentText="Enviamos outro código."
      />

      <Typography variant="body" size="sm">
        <a href="/entrar" className="text-primary underline-offset-4 hover:underline">
          Voltar para entrar
        </a>
      </Typography>
    </main>
  );
}
