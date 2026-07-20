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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
              <Button size="lg" className="h-11 rounded-xl shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar estudo
              </Button>
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
                      <p className="text-5xl font-bold tracking-tight">14%</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        do edital concluído
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>28 de 200 tópicos</p>
                      <p className="mt-1">Meta: 40% até nov/25</p>
                    </div>
                  </div>
                  <Progress value={14} className="h-2.5 rounded-full" />
                  <div className="grid grid-cols-3 gap-3">
                    <StatBlock
                      icon={<Check className="h-4 w-4" />}
                      label="Concluídos"
                      value="28"
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
                      value="160"
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
