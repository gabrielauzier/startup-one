import { TermosForm } from "./termos-form";

export default async function TermosPage(props: PageProps<"/termos">) {
  const searchParams = await props.searchParams;
  const redirectTo =
    typeof searchParams.redirect === "string" ? searchParams.redirect : "";

  return <TermosForm redirectTo={redirectTo} />;
}
