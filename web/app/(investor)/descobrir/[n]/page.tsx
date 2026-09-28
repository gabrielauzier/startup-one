import { notFound } from "next/navigation";
import { loadAnswers } from "../actions";
import { TOTAL_QUESTIONS } from "../types";
import { DescobrirForm } from "./DescobrirForm";

/**
 * RF-17/RN-22: uma pergunta por tela ("Pergunta N de 5"). Publica
 * (RN-26) - visitante sem conta pode responder (RN-23).
 */
export default async function DescobrirPage({ params }: PageProps<"/descobrir/[n]">) {
  const { n } = await params;
  const questionNumber = Number(n);

  if (
    !Number.isInteger(questionNumber) ||
    questionNumber < 1 ||
    questionNumber > TOTAL_QUESTIONS
  ) {
    notFound();
  }

  const answers = await loadAnswers();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-12">
      <DescobrirForm n={questionNumber} answers={answers} />
    </main>
  );
}
