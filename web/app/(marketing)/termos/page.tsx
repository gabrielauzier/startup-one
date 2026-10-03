import { firstParam } from "@/lib/auth/redirect";
import { TermosForm } from "./termos-form";

export default async function TermosPage(props: PageProps<"/termos">) {
  const searchParams = await props.searchParams;
  const redirectTo = firstParam(searchParams.redirect);

  return <TermosForm redirectTo={redirectTo} />;
}
