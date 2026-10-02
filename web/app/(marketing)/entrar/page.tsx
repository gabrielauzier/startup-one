import { EntrarForm } from "./entrar-form";

export default async function EntrarPage(props: PageProps<"/entrar">) {
  const searchParams = await props.searchParams;
  const redirectTo =
    typeof searchParams.redirect === "string" ? searchParams.redirect : "";

  return <EntrarForm redirectTo={redirectTo} />;
}
