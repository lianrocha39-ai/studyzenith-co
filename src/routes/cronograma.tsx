import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CalendarDays, Upload, FileText, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStudy } from "@/lib/study-store";
import { parseSubjectsFile, buildSchedule } from "@/lib/study-parsers";

export const Route = createFileRoute("/cronograma")({
  component: CronogramaPage,
});

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function CronogramaPage() {
  const { subjectsIncidence, setSubjectsIncidence } = useStudy();
  const fileRef = useRef<HTMLInputElement>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("2026-11-01");
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [subjectsPerDay, setSubjectsPerDay] = useState("2");

  const schedule = useMemo(() => {
    if (subjectsIncidence.length === 0) return [];
    return buildSchedule(subjectsIncidence, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      minutesPerDay: Math.max(30, Number(hoursPerDay) * 60),
      subjectsPerDay: Math.max(1, Number(subjectsPerDay)),
    });
  }, [subjectsIncidence, startDate, endDate, hoursPerDay, subjectsPerDay]);

  const onFile = async (f: File) => {
    const text = await f.text();
    const parsed = parseSubjectsFile(text);
    if (parsed.length === 0) {
      toast.error("Nenhuma matéria encontrada no arquivo.");
      return;
    }
    setSubjectsIncidence(parsed);
    toast.success(`${parsed.length} matérias carregadas.`);
  };

  const incColor = (n: number) =>
    n >= 5
      ? "bg-primary text-primary-foreground"
      : n === 4
        ? "bg-mint text-mint-foreground"
        : n === 3
          ? "bg-lavender text-lavender-foreground"
          : "bg-peach text-foreground";

  const incLabel = (n: number) =>
    n >= 5 ? "Muito alta" : n === 4 ? "Alta" : n === 3 ? "Média" : n === 2 ? "Baixa" : "Muito baixa";

  return (
    <PageShell title="Cronograma" description="Monte seu plano de estudos a partir do arquivo de matérias">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4" /> Arquivo de matérias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Envie CSV, TXT ou JSON com matérias e nível de incidência. Ex:{" "}
            <code className="rounded bg-muted px-1">Direito Constitucional, Alta</code> ou{" "}
            <code className="rounded bg-muted px-1">Português - 4</code>.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,.json,.tsv,text/plain,application/json"
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
            {subjectsIncidence.length > 0 && (
              <Badge variant="secondary" className="rounded-full">
                {subjectsIncidence.length} matérias carregadas
              </Badge>
            )}
          </div>
          {subjectsIncidence.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {subjectsIncidence.map((s) => (
                <span
                  key={s.name}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${incColor(s.incidence)}`}
                >
                  {s.name}
                  <span className="rounded-full bg-white/40 px-1.5 text-[10px]">
                    {incLabel(s.incidence)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4" /> Preferências do cronograma
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Início</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prova / meta</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Horas por dia</Label>
            <Input
              type="number"
              min={1}
              max={16}
              step={0.5}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Matérias por dia</Label>
            <Input
              type="number"
              min={1}
              max={6}
              value={subjectsPerDay}
              onChange={(e) => setSubjectsPerDay(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="h-4 w-4" /> Plano gerado
          </CardTitle>
          {schedule.length > 0 && (
            <Badge variant="outline" className="rounded-full">
              {schedule.length} dias · {Math.round((schedule.length * Number(hoursPerDay)))}h totais
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Envie um arquivo de matérias para gerar o cronograma.
            </p>
          ) : (
            <div className="space-y-3">
              {schedule.map((d) => {
                const iso = d.date.toISOString().slice(0, 10);
                const label = d.date.toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                });
                return (
                  <div
                    key={iso}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center"
                  >
                    <div className="w-32 shrink-0">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {label.split(",")[0]}
                      </p>
                      <p className="text-lg font-bold">{label.split(",")[1]?.trim() ?? label}</p>
                    </div>
                    <div className="flex flex-1 flex-wrap gap-2">
                      {d.subjects.map((s, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${incColor(s.incidence)}`}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/40 px-2 py-0.5 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {Math.floor(s.minutes / 60)}h{(s.minutes % 60).toString().padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
