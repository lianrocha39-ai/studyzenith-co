import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type StudySession = {
  id: string;
  subject: string;
  topic: string;
  minutes: number;
  correct: number;
  wrong: number;
  markedComplete: boolean;
  createdAt: Date;
  dayIndex: number; // 0 = Seg ... 6 = Dom
};

export const SUBJECTS = [
  { name: "Direito Constitucional", color: "oklch(0.78 0.12 155)" },
  { name: "Direito Administrativo", color: "oklch(0.72 0.14 300)" },
  { name: "Direito Penal", color: "oklch(0.7 0.16 25)" },
  { name: "Língua Portuguesa", color: "oklch(0.82 0.11 40)" },
  { name: "Raciocínio Lógico", color: "oklch(0.72 0.12 220)" },
  { name: "Informática", color: "oklch(0.78 0.14 100)" },
];

export const TOTAL_TOPICS = 200;
const INITIAL_COMPLETED = 28;

const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// today's dayIndex (Mon=0..Sun=6)
export function getTodayIndex() {
  const d = new Date().getDay(); // 0 Sun .. 6 Sat
  return (d + 6) % 7;
}

const seedSessions: StudySession[] = [
  { id: "s1", subject: "Direito Constitucional", topic: "Princípios fundamentais", minutes: 120, correct: 20, wrong: 12, markedComplete: true, createdAt: new Date(), dayIndex: 0 },
  { id: "s2", subject: "Direito Administrativo", topic: "Atos administrativos", minutes: 95, correct: 18, wrong: 10, markedComplete: true, createdAt: new Date(), dayIndex: 1 },
  { id: "s3", subject: "Língua Portuguesa", topic: "Concordância verbal", minutes: 180, correct: 30, wrong: 15, markedComplete: false, createdAt: new Date(), dayIndex: 2 },
  { id: "s4", subject: "Raciocínio Lógico", topic: "Proposições", minutes: 60, correct: 12, wrong: 6, markedComplete: false, createdAt: new Date(), dayIndex: 3 },
  { id: "s5", subject: "Informática", topic: "Redes", minutes: 145, correct: 25, wrong: 15, markedComplete: true, createdAt: new Date(), dayIndex: 4 },
  { id: "s6", subject: "Direito Constitucional", topic: "Controle de constitucionalidade", minutes: 200, correct: 35, wrong: 16, markedComplete: false, createdAt: new Date(), dayIndex: 5 },
];

type Ctx = {
  sessions: StudySession[];
  completedTopics: number;
  addSession: (s: Omit<StudySession, "id" | "createdAt" | "dayIndex">) => void;
  weeklyTime: { day: string; value: number }[];
  weeklyQuestions: { day: string; value: number }[];
  todayBySubject: { name: string; value: number; color: string }[];
  totals: {
    weekMinutes: number;
    weekQuestions: number;
    todayMinutes: number;
  };
};

const StudyCtx = createContext<Ctx | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<StudySession[]>(seedSessions);
  const [extraCompleted, setExtraCompleted] = useState(0);

  const value = useMemo<Ctx>(() => {
    const todayIdx = getTodayIndex();

    const weeklyTime = WEEK_LABELS.map((day, i) => ({
      day,
      value: sessions.filter((s) => s.dayIndex === i).reduce((a, s) => a + s.minutes, 0),
    }));

    const weeklyQuestions = WEEK_LABELS.map((day, i) => ({
      day,
      value: sessions
        .filter((s) => s.dayIndex === i)
        .reduce((a, s) => a + s.correct + s.wrong, 0),
    }));

    const bySubject = new Map<string, number>();
    sessions
      .filter((s) => s.dayIndex === todayIdx)
      .forEach((s) => bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.minutes));
    const todayBySubject = Array.from(bySubject.entries()).map(([name, v]) => ({
      name,
      value: v,
      color: SUBJECTS.find((x) => x.name === name)?.color ?? "oklch(0.7 0.05 260)",
    }));

    const weekMinutes = weeklyTime.reduce((a, b) => a + b.value, 0);
    const weekQuestions = weeklyQuestions.reduce((a, b) => a + b.value, 0);
    const todayMinutes = todayBySubject.reduce((a, b) => a + b.value, 0);

    return {
      sessions,
      completedTopics: INITIAL_COMPLETED + extraCompleted,
      addSession: (s) => {
        setSessions((prev) => [
          ...prev,
          {
            ...s,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            dayIndex: getTodayIndex(),
          },
        ]);
        if (s.markedComplete) setExtraCompleted((c) => c + 1);
      },
      weeklyTime,
      weeklyQuestions,
      todayBySubject,
      totals: { weekMinutes, weekQuestions, todayMinutes },
    };
  }, [sessions, extraCompleted]);

  return <StudyCtx.Provider value={value}>{children}</StudyCtx.Provider>;
}

export function useStudy() {
  const v = useContext(StudyCtx);
  if (!v) throw new Error("useStudy must be used within StudyProvider");
  return v;
}
