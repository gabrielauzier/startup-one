import { CodigoForm } from "./codigo-form";

export default async function CodigoPage(
  props: PageProps<"/entrar/codigo">
) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";
  const role = typeof searchParams.role === "string" ? searchParams.role : "";

  return <CodigoForm email={email} role={role} />;
}
