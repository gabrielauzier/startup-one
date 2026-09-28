import { RegisterCadastroSW } from "./register-sw";

export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RegisterCadastroSW />
      {children}
    </>
  );
}
