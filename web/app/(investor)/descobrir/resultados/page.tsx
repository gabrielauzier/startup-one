import { loadAnswers } from "../actions";

/**
 * RF-18/T08: tela de resultados, para onde as 5 perguntas levam ao
 * final (CA-22.3). Placeholder minimo criado aqui (T33) so' para o
 * fluxo de perguntas ter um destino real - o conteudo completo (cards
 * ordenados por alinhamento, filtros, chips do resumo) e' construido
 * no T36, que substitui este arquivo por inteiro.
 */
export default async function ResultadosPage() {
  const answers = await loadAnswers();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-heading text-2xl">Resultados</h1>
      <p className="font-body text-sm text-muted-foreground">
        {answers.impactos && answers.impactos.length > 0
          ? `${answers.impactos.length} impacto(s) considerado(s).`
          : "Sem critério de impacto (pergunta pulada)."}
      </p>
    </main>
  );
}
