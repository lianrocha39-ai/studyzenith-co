import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Plus,
  ChevronDown,
  Check,
  BookOpen,
  Target,
  Sparkles,
  Clock,
  Flame,
  CalendarClock,
  Trophy,
  Timer,
  ListChecks,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddStudyDialog } from "@/components/add-study-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOTAL_TOPICS, useStudy } from "@/lib/study-store";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const weekDays = [
  { label: "Seg", date: 14, done: true },
  { label: "Ter", date: 15, done: true },
  { label: "Qua", date: 16, done: true },
  { label: "Qui", date: 17, done: false, today: true },
  { label: "Sex", date: 18, done: false },
  { label: "Sáb", date: 19, done: false },
  { label: "Dom", date: 20, done: false },
];

function Dashboard() {
  const [plan, setPlan] = useState("concursos");
  const { completedTopics } = useStudy();
  const progressPct = Math.round((completedTopics / TOTAL_TOPICS) * 100);
  const pending = TOTAL_TOPICS - completedTopics;


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-sm font-semibold md:text-base">
                Olá, Ana <span className="ml-1">👋</span>
              </h1>
              <p className="text-xs text-muted-foreground">Bom te ver de volta. Vamos estudar?</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-lavender text-lavender-foreground text-xs font-semibold">
                  AN
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Content */}
          <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
            {/* Action bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="h-11 w-[220px] rounded-xl border-border bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concursos">Plano Concursos</SelectItem>
                    <SelectItem value="oab">Plano OAB</SelectItem>
                    <SelectItem value="enem">Plano ENEM</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="hidden rounded-full bg-mint text-mint-foreground sm:inline-flex">
                  <Flame className="mr-1 h-3 w-3" /> 12 dias em sequência
                </Badge>
              </div>
              <AddStudyDialog />
            </div>


            {/* Top grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Progress card */}
              <Card className="lg:col-span-2 rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Progresso geral no edital
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Concurso · Analista Judiciário · TRF
                    </p>
                  </div>
                  <Badge className="rounded-full bg-mint text-mint-foreground hover:bg-mint">
                    Em andamento
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-5xl font-bold tracking-tight tabular-nums">
                        {progressPct}%
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        do edital concluído
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p className="tabular-nums">
                        {completedTopics} de {TOTAL_TOPICS} tópicos
                      </p>
                      <p className="mt-1">Meta: 40% até nov/25</p>
                    </div>
                  </div>
                  <Progress value={progressPct} className="h-2.5 rounded-full transition-all" />
                  <div className="grid grid-cols-3 gap-3">
                    <StatBlock
                      icon={<Check className="h-4 w-4" />}
                      label="Concluídos"
                      value={String(completedTopics)}
                      tone="mint"
                    />
                    <StatBlock
                      icon={<Clock className="h-4 w-4" />}
                      label="Em revisão"
                      value="12"
                      tone="lavender"
                    />
                    <StatBlock
                      icon={<BookOpen className="h-4 w-4" />}
                      label="Pendentes"
                      value={String(pending)}
                      tone="peach"
                    />
                  </div>
                </CardContent>

              </Card>

              {/* Motivation card */}
              <Card className="rounded-2xl border-border/60 bg-mint text-mint-foreground shadow-sm">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/40 backdrop-blur">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-70">
                      Frase do dia
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-snug">
                      "Disciplina é escolher entre o que você quer agora e o que você quer mais."
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit rounded-full bg-white/40 text-mint-foreground hover:bg-white/60"
                  >
                    Personalizar
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Week calendar */}
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Sua semana de estudos
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Marque os dias em que cumpriu a meta
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  <Target className="mr-1 h-3 w-3" /> 3 / 7 dias
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 sm:gap-3">
                  {weekDays.map((d) => (
                    <DayCell key={d.label} {...d} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target exam + weekly goals */}
            <div className="grid gap-6 lg:grid-cols-3">
              <TargetExamCard />
              <WeeklyGoalsCard />
            </div>

            {/* Weekly chart + Pie */}
            <div className="grid gap-6 lg:grid-cols-3">
              <WeeklyStudyChart />
              <TodayStudyPie />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function StatBlock({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "mint" | "lavender" | "peach";
}) {
  const toneMap = {
    mint: "bg-mint text-mint-foreground",
    lavender: "bg-lavender text-lavender-foreground",
    peach: "bg-peach text-foreground",
  };
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DayCell({
  label,
  date,
  done,
  today,
}: {
  label: string;
  date: number;
  done: boolean;
  today?: boolean;
}) {
  return (
    <button
      className={`group flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
        done
          ? "border-transparent bg-primary text-primary-foreground"
          : today
            ? "border-primary/60 bg-card ring-2 ring-primary/20"
            : "border-border/60 bg-card"
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
        {label}
      </span>
      <span className="text-lg font-bold">{date}</span>
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          done ? "bg-white/30" : "bg-muted"
        }`}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

const EXAM_DATE = new Date();
EXAM_DATE.setDate(EXAM_DATE.getDate() + 71);

function TargetExamCard() {
  const daysLeft = useMemo(() => {
    const diff = EXAM_DATE.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);
  const formatted = EXAM_DATE.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-1 overflow-hidden">
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-lavender/60 via-card to-mint/40" />
        <CardContent className="relative flex h-full flex-col justify-between gap-4 p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Trophy className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="rounded-full bg-card/80 backdrop-blur">
              <CalendarClock className="mr-1 h-3 w-3" /> Concurso alvo
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Próxima prova
            </p>
            <h3 className="mt-1 text-lg font-bold leading-tight">
              TRF 3ª Região · Analista Judiciário
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Aplicação em {formatted}</p>
          </div>
          <div className="rounded-2xl bg-card/70 p-4 backdrop-blur">
            <p className="text-xs text-muted-foreground">Contagem regressiva</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{daysLeft}</span>
              <span className="text-sm font-medium text-muted-foreground">dias</span>
            </p>
            <p className="mt-2 text-xs font-medium text-foreground/70">
              Faltam {daysLeft} dias para a prova
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function WeeklyGoalsCard() {
  const { totals } = useStudy();
  const hoursDone = totals.weekMinutes;
  const hoursGoal = 20 * 60;
  const hoursPct = Math.min(100, Math.round((hoursDone / hoursGoal) * 100));
  const hoursText = `${Math.floor(hoursDone / 60)}h${(hoursDone % 60).toString().padStart(2, "0")}min`;

  const questionsDone = totals.weekQuestions;
  const questionsGoal = 120;
  const questionsPct = Math.min(100, Math.round((questionsDone / questionsGoal) * 100));


  return (
    <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Metas de estudo semanal</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Acompanhe seu ritmo em relação à meta desta semana
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          Semana atual
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <GoalBar
          icon={<Timer className="h-4 w-4" />}
          label="Horas de estudo"
          currentText={hoursText}
          goalText="20h00min"
          pct={hoursPct}
          barClass="bg-primary"

          tone="bg-mint text-mint-foreground"
        />
        <GoalBar
          icon={<ListChecks className="h-4 w-4" />}
          label="Questões resolvidas"
          currentText={`${questionsDone}`}
          goalText={`${questionsGoal}`}
          pct={questionsPct}
          barClass="bg-[oklch(0.65_0.18_300)]"
          tone="bg-lavender text-lavender-foreground"
          overachieved={questionsDone > questionsGoal}
        />
      </CardContent>
    </Card>
  );
}

function GoalBar({
  icon,
  label,
  currentText,
  goalText,
  pct,
  barClass,
  tone,
  overachieved,
}: {
  icon: React.ReactNode;
  label: string;
  currentText: string;
  goalText: string;
  pct: number;
  barClass: string;
  tone: string;
  overachieved?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
            {icon}
          </span>
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{currentText}</span> de {goalText}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{pct}%</p>
          {overachieved && (
            <p className="text-[10px] font-medium text-primary">Meta superada</p>
          )}
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function WeeklyStudyChart() {
  const [tab, setTab] = useState("tempo");
  const { weeklyTime, weeklyQuestions } = useStudy();
  const data = tab === "tempo" ? weeklyTime : weeklyQuestions;

  const total = data.reduce((a, b) => a + b.value, 0);
  const formatValue = (v: number) =>
    tab === "tempo" ? `${Math.floor(v / 60)}h${(v % 60).toString().padStart(2, "0")}` : `${v}`;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Estudo semanal</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatValue(total)}</span>
          </p>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="rounded-full">
            <TabsTrigger value="tempo" className="rounded-full">Tempo</TabsTrigger>
            <TabsTrigger value="questoes" className="rounded-full">Questões</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="day"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (tab === "tempo" ? `${Math.round(v / 60)}h` : `${v}`)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [formatValue(v), tab === "tempo" ? "Tempo" : "Questões"]}
              />
              <Bar
                dataKey="value"
                radius={[10, 10, 4, 4]}
                fill={tab === "tempo" ? "var(--primary)" : "oklch(0.7 0.15 300)"}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const todaySubjectsFallback: { name: string; value: number; color: string }[] = [];

function TodayStudyPie() {
  const { todayBySubject } = useStudy();
  const subjects = todayBySubject.length > 0 ? todayBySubject : todaySubjectsFallback;
  const total = subjects.reduce((a, b) => a + b.value, 0);
  const formatTime = (m: number) =>
    `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, "0")}`;

  const formatTime = (m: number) =>
    `${Math.floor(m / 60)}h${(m % 60).toString().padStart(2, "0")}`;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Estudos do dia</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Distribuição por matéria hoje
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={todaySubjects}
                dataKey="value"
                innerRadius={50}
                outerRadius={78}
                paddingAngle={2}
                stroke="none"
              >
                {todaySubjects.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number, n) => [formatTime(v), n as string]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xl font-bold">{formatTime(total)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              hoje
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {todaySubjects.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="font-medium">{s.name}</span>
              </span>
              <span className="text-muted-foreground">{formatTime(s.value)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
