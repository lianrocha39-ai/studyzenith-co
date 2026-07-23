import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Upload, FileText, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStudy } from "@/lib/study-store";
import { useAuth } from "@/lib/auth-context";
import { parseEditalFile } from "@/lib/study-parsers";
import { extractTextFromPdf, parseEditalTopicsFromText } from "@/lib/pdf-parser";

export const Route = createFileRoute("/edital")({
  component: EditalPage,
});

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EditalPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, loading, navigate]);

  const { editalTopics, setEditalTopics, sessions } = useStudy();
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isReadingPdf, setIsReadingPdf] = useState(false);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const studiedTokens = useMemo(
    () => sessions.map((s) => normalize(s.topic)).filter(Boolean),
    [sessions],
  );

  const isStudied = (topic: string) => {
    const n = normalize(topic);
    return studiedTokens.some((t) => t && (n.includes(t) || t.includes(n)));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof editalTopics>();
    const q = normalize(query);
    for (const t of editalTopics) {
      if (q && !normalize(`${t.subject} ${t.topic}`).includes(q)) continue;
      const arr = map.get(t.subject) ?? [];
      arr.push(t);
      map.set(t.subject, arr);
    }
    return Array.from(map.entries());
  }, [editalTopics, query]);

  const total = editalTopics.length;
  const done = editalTopics.filter((t) => isStudied(t.topic)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const onFile = async (f: File) => {
    try {
      if (f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf") {
        setIsReadingPdf(true);
        toast.info("Lendo edital em PDF...");
        const pdfText = await extractTextFromPdf(f);
        const parsed = parseEditalTopicsFromText(pdfText);
        setIsReadingPdf(false);

        if (parsed.length === 0) {
          toast.error("Não encontrei tópicos no edital em PDF.");
          return;
        }
        setEditalTopics(parsed);
        toast.success(`${parsed.length} tópicos extraídos do edital em PDF!`);
        return;
      }

      const text = await f.text();
      const parsed = parseEditalFile(text);
      if (parsed.length === 0) {
        toast.error("Não encontrei tópicos no arquivo.");
        return;
      }
      setEditalTopics(parsed);
      toast.success(`${parsed.length} tópicos carregados.`);
    } catch (err) {
      setIsReadingPdf(false);
      console.error(err);
      toast.error("Erro ao ler edital.");
    }
  };

  return (
    <PageShell
      title="Edital esquematizado"
      description="Envie seu edital em PDF ou TXT e acompanhe visualmente o que já foi estudado"
    >
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4" /> Edital em PDF ou Arquivo de texto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie o <strong>edital oficial em PDF (.pdf)</strong> ou arquivo TXT/JSON. O sistema esquematizará os tópicos por matéria automaticamente!
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.json,.csv,application/pdf,text/plain,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <Button onClick={() => fileRef.current?.click()} className="rounded-xl" disabled={isReadingPdf}>
              <Upload className="mr-2 h-4 w-4" /> {isReadingPdf ? "Lendo PDF..." : "Escolher arquivo (PDF, TXT)"}
            </Button>
              accept=".txt,.json,.md,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <Button onClick={() => fileRef.current?.click()} className="rounded-xl">
              <Upload className="mr-2 h-4 w-4" /> Escolher arquivo
            </Button>
            {total > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {total} tópicos
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {total > 0 && (
        <>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Progresso no edital
                  </p>
                  <p className="mt-1 text-4xl font-bold tabular-nums">{pct}%</p>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {done} de {total} tópicos estudados
                </p>
              </div>
              <Progress value={pct} className="h-2.5 rounded-full" />
              <Input
                placeholder="Buscar matéria ou tópico..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {grouped.map(([subject, topics]) => {
              const sDone = topics.filter((t) => isStudied(t.topic)).length;
              return (
                <Card key={subject} className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <BookOpen className="h-4 w-4" /> {subject}
                    </CardTitle>
                    <Badge variant="outline" className="rounded-full">
                      {sDone}/{topics.length}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {topics.map((t) => {
                        const studied = isStudied(t.topic);
                        return (
                          <li
                            key={t.id}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              studied
                                ? "border-primary/40 bg-mint/40 text-foreground"
                                : "border-border/60 bg-card text-muted-foreground"
                            }`}
                          >
                            {studied ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0" />
                            )}
                            <span className={studied ? "font-medium" : ""}>{t.topic}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}
