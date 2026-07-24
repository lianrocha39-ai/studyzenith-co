import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, History, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

type HistoryItem = {
  id: string;
  question: string;
  userAnswer: string;
  correct: string;
  isCorrect: boolean;
  explanation: string;
  createdAt: string;
};

type Stats = { correct: number; wrong: number };

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "Banco de Questões — Foco Total" },
      {
        name: "description",
        content:
          "Cole questões de concurso, resolva com IA e acompanhe acertos, erros e histórico para revisão.",
      },
      { property: "og:title", content: "Banco de Questões — Foco Total" },
      {
        property: "og:description",
        content: "Correção inteligente com IA de questões de concurso.",
      },
    ],
  }),
  component: QuestoesPage,
});

function storageKey(userId: string, suffix: string) {
  return `questoes_${suffix}_${userId}`;
}

function QuestoesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "anon";

  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [stats, setStats] = useState<Stats>({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(storageKey(userId, "stats"));
      const h = localStorage.getItem(storageKey(userId, "history"));
      if (s) setStats(JSON.parse(s));
      else setStats({ correct: 0, wrong: 0 });
      if (h) setHistory(JSON.parse(h));
      else setHistory([]);
    } catch {
      setStats({ correct: 0, wrong: 0 });
      setHistory([]);
    }
  }, [userId]);

  const total = stats.correct + stats.wrong;
  const accuracy = useMemo(
    () => (total === 0 ? 0 : Math.round((stats.correct / total) * 100)),
    [stats, total],
  );

  async function analyze() {
    if (!question.trim()) {
      toast.error("Cole o enunciado da questão.");
      return;
    }
    if (!userAnswer) {
      toast.error("Selecione a alternativa que você marcou.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze-question", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, userAnswer }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Falha na análise.");
        return;
      }

      const item: HistoryItem = {
        id: crypto.randomUUID(),
        question,
        userAnswer,
        correct: data.correct ?? "",
        isCorrect: !!data.isCorrect,
        explanation: data.explanation ?? "",
        createdAt: new Date().toISOString(),
      };

      const nextStats: Stats = {
        correct: stats.correct + (item.isCorrect ? 1 : 0),
        wrong: stats.wrong + (item.isCorrect ? 0 : 1),
      };
      const nextHistory = [item, ...history].slice(0, 100);

      setResult(item);
      setStats(nextStats);
      setHistory(nextHistory);
      localStorage.setItem(storageKey(userId, "stats"), JSON.stringify(nextStats));
      localStorage.setItem(storageKey(userId, "history"), JSON.stringify(nextHistory));

      if (item.isCorrect) toast.success("Acertou! 🟢");
      else toast.error("Errou. Revise a explicação.");
    } catch (e) {
      toast.error((e as Error).message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(storageKey(userId, "history"));
    toast.success("Histórico limpo.");
  }

  function reset() {
    setQuestion("");
    setUserAnswer("");
    setResult(null);
  }

  return (
    <PageShell
      title="Banco de Questões"
      description="Cole uma questão, marque sua resposta e deixe a IA corrigir."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard label="Acertos" value={stats.correct} tone="mint" />
        <StatCard label="Erros" value={stats.wrong} tone="rose" />
        <StatCard label="Aproveitamento" value={`${accuracy}%`} tone="lavender" />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Resolver questão com IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="q">Enunciado + alternativas (A–E)</Label>
            <Textarea
              id="q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={10}
              placeholder={`Cole aqui a questão completa, por exemplo:\n\nSegundo a CF/88, são direitos sociais:\nA) ...\nB) ...\nC) ...\nD) ...\nE) ...`}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Sua resposta</Label>
            <RadioGroup
              value={userAnswer}
              onValueChange={setUserAnswer}
              className="flex flex-wrap gap-3"
            >
              {OPTIONS.map((opt) => (
                <label
                  key={opt}
                  htmlFor={`opt-${opt}`}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium transition hover:bg-accent"
                >
                  <RadioGroupItem id={`opt-${opt}`} value={opt} />
                  {opt}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={analyze}
              disabled={loading}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Analisar e Corrigir com IA
                </>
              )}
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-xl">
              Limpar
            </Button>
          </div>

          {result && <ResultCard item={result} />}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4" /> Histórico de questões
          </CardTitle>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-xs text-muted-foreground"
            >
              <Trash2 className="mr-1 h-3 w-3" /> Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma questão resolvida ainda. Cole uma questão acima para começar.
            </p>
          ) : (
            <ul className="space-y-3">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="rounded-xl border border-border/60 bg-card/60 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    {h.isCorrect ? (
                      <Badge className="rounded-full bg-mint text-mint-foreground hover:bg-mint">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Acertou
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="rounded-full">
                        <XCircle className="mr-1 h-3 w-3" /> Errou
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Sua: <strong>{h.userAnswer}</strong> · Gabarito:{" "}
                      <strong>{h.correct || "—"}</strong>
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground/80">{h.question}</p>
                  {h.explanation && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <strong className="text-foreground">Comentário:</strong>{" "}
                      {h.explanation}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "mint" | "rose" | "lavender";
}) {
  const toneClass =
    tone === "mint"
      ? "bg-mint text-mint-foreground"
      : tone === "rose"
        ? "bg-destructive/15 text-destructive"
        : "bg-lavender text-lavender-foreground";
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClass}`}>
          {label}
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ResultCard({ item }: { item: HistoryItem }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        item.isCorrect
          ? "border-mint bg-mint/30"
          : "border-destructive/40 bg-destructive/10"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        {item.isCorrect ? (
          <Badge className="rounded-full bg-mint text-mint-foreground hover:bg-mint">
            <CheckCircle2 className="mr-1 h-3 w-3" /> ACERTOU 🟢
          </Badge>
        ) : (
          <Badge variant="destructive" className="rounded-full">
            <XCircle className="mr-1 h-3 w-3" /> ERROU 🔴
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Sua resposta: <strong>{item.userAnswer}</strong> · Gabarito:{" "}
          <strong>{item.correct || "—"}</strong>
        </span>
      </div>
      {item.explanation && (
        <p className="text-sm text-foreground/90">
          <strong>Gabarito comentado:</strong> {item.explanation}
        </p>
      )}
    </div>
  );
}
