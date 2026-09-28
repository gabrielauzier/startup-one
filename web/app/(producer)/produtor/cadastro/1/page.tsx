// Placeholder do "app shell" para o T16 (service worker) ter uma rota
// real para cachear e testar offline. O formulario de verdade da Parte 1
// (Sobre voce, RF-06) entra no T19.
export default function CadastroParte1Page() {
  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <p className="font-body text-sm text-foreground/70">Parte 1 de 5 · Salvo</p>
      <h1 className="mt-2 font-heading text-2xl text-primary">Sobre você</h1>
    </main>
  );
}
