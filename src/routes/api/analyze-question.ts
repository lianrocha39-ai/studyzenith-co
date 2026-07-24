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

        const key = process.env.HUGGINGFACE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "HUGGINGFACE_API_KEY ausente. Configure no Vercel." }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const system = `Você é um professor especialista em concursos públicos brasileiros. Analise a questão de múltipla escolha enviada, identifique a alternativa correta (A, B, C, D ou E) e explique por que está correta. Retorne APENAS um JSON válido com os campos:
{
  "correct": "A letra da alternativa correta (A, B, C, D ou E)",
  "explanation": "Explicação breve do porquê essa alternativa está correta"
}`;

        const userMsg = `Questão:\n${question}\n\nResposta escolhida pelo usuário: ${userAnswer || "(não informada)"}\n\nRetorne apenas o JSON.`;

        try {
          const res = await fetch(
            "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                inputs: `${system}\n\n${userMsg}`,
                parameters: {
                  max_new_tokens: 500,
                  temperature: 0.7,
                },
              }),
            }
          );

          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 429 ? 429 : 500;
            return new Response(
              JSON.stringify({
                error:
                  res.status === 429
                    ? "Muitas requisições. Tente novamente em instantes."
                    : res.status === 503
                    ? "Modelo carregando. Tente novamente em poucos segundos."
                    : `Erro da IA: ${text}`,
              }),
              { status, headers: { "content-type": "application/json" } }
            );
          }

          const data = (await res.json()) as Array<{ generated_text?: string }>;
          let content = data[0]?.generated_text ?? "{}";
          
          // Limpar a resposta - remover prompt repetido
          if (content.includes(userMsg)) {
            content = content.split(userMsg)[1] ?? content;
          }

          let parsed: { correct?: string; explanation?: string } = {};
          try {
            // Tentar extrair JSON da resposta
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            } else {
              parsed = { explanation: content };
            }
          } catch {
            parsed = { explanation: content };
          }

          const correct = (parsed.correct ?? "").trim().toUpperCase().slice(0, 1);
          const explanation = parsed.explanation ?? "";
          const isCorrect = !!userAnswer && !!correct && userAnswer === correct;

          return new Response(
            JSON.stringify({ correct, explanation, isCorrect, userAnswer }),
            { headers: { "content-type": "application/json" } }
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ error: (e as Error).message || "Falha na IA" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
