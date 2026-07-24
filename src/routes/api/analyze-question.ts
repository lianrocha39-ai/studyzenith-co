import { createFileRoute } from "@tanstack/react-router";

type Body = {
  question?: string;
  userAnswer?: string;
};

export const Route = createFileRoute("/api/analyze-question")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response(JSON.stringify({ error: "JSON inválido" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const question = (body.question ?? "").trim();
        const userAnswer = (body.userAnswer ?? "").trim().toUpperCase();

        if (!question) {
          return new Response(JSON.stringify({ error: "Envie o enunciado da questão." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const system = `Você é um professor especialista em concursos públicos brasileiros. Analise a questão de múltipla escolha enviada, identifique a alternativa correta (A, B, C, D ou E) e explique de forma resumida (máx 4 frases) por que ela é a correta. Responda SEMPRE em JSON válido no formato: {"correct":"A","explanation":"..."}. Sem markdown, sem texto extra.`;

        const userMsg = `Questão:\n${question}\n\nResposta escolhida pelo usuário: ${userAnswer || "(não informada)"}\n\nRetorne apenas o JSON.`;

        try {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: userMsg },
              ],
              response_format: { type: "json_object" },
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 429 || res.status === 402 ? res.status : 500;
            return new Response(
              JSON.stringify({
                error:
                  res.status === 429
                    ? "Muitas requisições. Tente novamente em instantes."
                    : res.status === 402
                    ? "Créditos de IA esgotados. Adicione créditos no workspace."
                    : `Erro da IA: ${text}`,
              }),
              { status, headers: { "content-type": "application/json" } },
            );
          }

          const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content ?? "{}";
          let parsed: { correct?: string; explanation?: string } = {};
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = { explanation: content };
          }

          const correct = (parsed.correct ?? "").trim().toUpperCase().slice(0, 1);
          const explanation = parsed.explanation ?? "";
          const isCorrect = !!userAnswer && !!correct && userAnswer === correct;

          return new Response(
            JSON.stringify({ correct, explanation, isCorrect, userAnswer }),
            { headers: { "content-type": "application/json" } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ error: (e as Error).message || "Falha na IA" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
