import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  CheckCircle2,
  XCircle,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { SUBJECTS, useStudy, type StudySession } from "@/lib/study-store";

export const Route = createFileRoute("/desempenho")({
  head: () => ({
    meta: [
      { title: "Desempenho — Foco Total" },
      {
        name: "description",
        content:
          "Painel analítico de desempenho: acertos, erros, precisão e evolução diária por matéria.",
      },
      { property: "og:title", content: "Desempenho — Foco Total" },
      {
        property: "og:description",
        content: "Acompanhe métricas, gráficos e histórico detalhado dos seus estudos.",
      },
    ],
  }),
  component: DesempenhoPage,
});

type PeriodKey = "7d" | "30d" | "month" | "all";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "month", label: "Mês atual" },
  { key: "all", label: "Todo o período" },
];

function startOfPeriod(p: PeriodKey): Date | null {
  const now = new Date();
  if (p === "all") return null;
  if (p === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const days = p === "7d" ? 7 : 30;
  const d = new Date(now);
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function precisionTone(p: number) {
  if (p >= 75) return "bg-mint text-mint-foreground";
  if (p >= 50) return "bg-peach text-foreground";
  return "bg-destructive/15 text-destructive";
}

function DesempenhoPage() {
  const { sessions } = useStudy();
  const [subject, setSubject] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodKey>("7d");

  const filtered = useMemo(() => {
    const start = startOfPeriod(period);
    return sessions.filter((s: StudySession) => {
      if (subject !== "all" && s.subject !== subject) return false;
      const created = new Date(s.createdAt);
      if (start && created < start) return false;
      return true;
    });
  }, [sessions, subject, period]);

  const kpis = useMemo(() => {
    const correct = filtered.reduce((a, s) => a + s.correct, 0);
    const wrong = filtered.reduce((a, s) => a + s.wrong, 0);
    const total = correct + wrong;
    const acc = total === 0 ? 0 : Math.round((correct / total) * 100);
    const days = new Set(filtered.map((s) => fmtDayKey(new Date(s.createdAt)))).size || 1;
    const avg = Math.round(total / days);
    return { correct, wrong, total, acc, avg };
  }, [filtered]);

  const chartData = useMemo(() => {
    const start = startOfPeriod(period);
    const days: string[] = [];
    if (start) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const d = new Date(start);
      while (d <= now) {
        days.push(fmtDayKey(d));
        d.setDate(d.getDate() + 1);
      }
    } else {
      const set = new Set(filtered.map((s) => fmtDayKey(new Date(s.createdAt))));
      Array.from(set)
        .sort()
        .forEach((k) => days.push(k));
    }
    const map = new Map<string, { correct: number; wrong: number }>();
    days.forEach((k) => map.set(k, { correct: 0, wrong: 0 }));
    filtered.forEach((s) => {
      const key = fmtDayKey(new Date(s.createdAt));
      const cur = map.get(key) ?? { correct: 0, wrong: 0 };
      cur.correct += s.correct;
      cur.wrong += s.wrong;
      map.set(key, cur);
    });
    return days.map((k) => {
      const v = map.get(k)!;
      const t = v.correct + v.wrong;
      return {
        day: fmtDayLabel(k),
        Acertos: v.correct,
        Erros: v.wrong,
        precision: t === 0 ? 0 : Math.round((v.correct / t) * 100),
        total: t,
      };
    });
  }, [filtered, period]);

  const tableRows = useMemo(() => {
    const map = new Map<
      string,
      { date: string; subject: string; correct: number; wrong: number }
    >();
    filtered.forEach((s) => {
      const key = `${fmtDayKey(new Date(s.createdAt))}__${s.subject}`;
      const cur = map.get(key) ?? {
        date: fmtDayKey(new Date(s.createdAt)),
        subject: s.subject,
        correct: 0,
        wrong: 0,
      };
      cur.correct += s.correct;
      cur.wrong += s.wrong;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        total: r.correct + r.wrong,
        precision:
          r.correct + r.wrong === 0
            ? 0
            : Math.round((r.correct / (r.correct + r.wrong)) * 100),
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filtered]);

  return (
    <PageShell
      title="Desempenho"
      description="Acompanhe acertos, erros e evolução diária por matéria."
      actions={
        <div className="hidden items-center gap-2 md:flex">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-52 rounded-xl">
              <SelectValue placeholder="Matéria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as matérias</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {/* Mobile filters */}
      <div className="grid gap-2 md:hidden">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Matéria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as matérias</SelectItem>
            {SUBJECTS.map((s) => (
              <SelectItem key={s.name} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Exercícios feitos"
          value={kpis.total}
          icon={<Activity className="h-4 w-4" />}
          tint="bg-lavender text-lavender-foreground"
        />
        <KpiCard
          label="Acertos"
          value={kpis.correct}
          hint={`${kpis.acc}% de precisão`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tint="bg-mint text-mint-foreground"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Erros"
          value={kpis.wrong}
          icon={<XCircle className="h-4 w-4" />}
          tint="bg-destructive/15 text-destructive"
          valueClass="text-destructive"
        />
        <KpiCard
          label="Média diária"
          value={kpis.avg}
          hint="questões / dia"
          icon={<CalendarDays className="h-4 w-4" />}
          tint="bg-peach text-foreground"
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" /> Acertos x Erros por dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0].payload as {
                      Acertos: number;
                      Erros: number;
                      total: number;
                      precision: number;
                    };
                    return (
                      <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="mb-1 font-semibold">{label}</p>
                        <p className="text-emerald-600 dark:text-emerald-400">
                          Acertos: {row.Acertos}
                        </p>
                        <p className="text-destructive">Erros: {row.Erros}</p>
                        <p className="mt-1 text-muted-foreground">
                          Total: {row.total} · Precisão: {row.precision}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="Acertos"
                  fill="oklch(0.72 0.16 155)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="Erros"
                  fill="oklch(0.65 0.2 25)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Histórico detalhado por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {tableRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum exercício registrado para os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead className="text-right">Exercícios</TableHead>
                    <TableHead className="text-right">Acertos</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                    <TableHead className="text-right">Precisão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{fmtDayLabel(r.date)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.subject}</TableCell>
                      <TableCell className="text-right">{r.total}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                        {r.correct}
                      </TableCell>
                      <TableCell className="text-right text-destructive">{r.wrong}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`rounded-full ${precisionTone(r.precision)}`}>
                          {r.precision}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tint,
  valueClass,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  tint: string;
  valueClass?: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${tint}`}>
            {icon}
          </span>
        </div>
        <div className={`text-3xl font-bold ${valueClass ?? ""}`}>{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
