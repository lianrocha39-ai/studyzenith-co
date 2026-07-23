import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";

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

const WEEK_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// today's dayIndex (Mon=0..Sun=6)
export function getTodayIndex() {
  const d = new Date().getDay(); // 0 Sun .. 6 Sat
  return (d + 6) % 7;
}

export type SubjectIncidence = { name: string; incidence: number }; // 1..5
export type EditalTopic = { id: string; subject: string; topic: string };

type UserStudyData = {
  sessions: StudySession[];
  completedTopics: number;
  subjectsIncidence: SubjectIncidence[];
  editalTopics: EditalTopic[];
};

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
  subjectsIncidence: SubjectIncidence[];
  setSubjectsIncidence: (s: SubjectIncidence[]) => void;
  editalTopics: EditalTopic[];
  setEditalTopics: (t: EditalTopic[]) => void;
};

const StudyCtx = createContext<Ctx | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [completedTopics, setCompletedTopics] = useState<number>(0);
  const [subjectsIncidence, setSubjectsIncidence] = useState<SubjectIncidence[]>([]);
  const [editalTopics, setEditalTopics] = useState<EditalTopic[]>([]);

  // Load user-specific study data whenever userId changes
  useEffect(() => {
    if (!userId) {
      setSessions([]);
      setCompletedTopics(0);
      setSubjectsIncidence([]);
      setEditalTopics([]);
      return;
    }

    const storageKey = `study_store_${userId}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const data = JSON.parse(raw) as UserStudyData;
        setSessions(data.sessions || []);
        setCompletedTopics(data.completedTopics || 0);
        setSubjectsIncidence(data.subjectsIncidence || []);
        setEditalTopics(data.editalTopics || []);
      } catch (e) {
        console.error("Erro ao carregar dados de estudo do usuário", e);
        setSessions([]);
        setCompletedTopics(0);
      }
    } else {
      // New User: 100% zerado
      setSessions([]);
      setCompletedTopics(0);
      setSubjectsIncidence([]);
      setEditalTopics([]);
    }
  }, [userId]);

  // Persist study data when updated
  const saveUserData = (
    newSessions: StudySession[],
    newCompleted: number,
    newIncidence: SubjectIncidence[],
    newEdital: EditalTopic[]
  ) => {
    if (!userId) return;
    const storageKey = `study_store_${userId}`;
    const payload: UserStudyData = {
      sessions: newSessions,
      completedTopics: newCompleted,
      subjectsIncidence: newIncidence,
      editalTopics: newEdital,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  };

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
      completedTopics,
      addSession: (s) => {
        const newSession: StudySession = {
          ...s,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          dayIndex: getTodayIndex(),
        };
        const updatedSessions = [...sessions, newSession];
        const updatedCompleted = s.markedComplete ? completedTopics + 1 : completedTopics;

        setSessions(updatedSessions);
        if (s.markedComplete) setCompletedTopics(updatedCompleted);

        saveUserData(updatedSessions, updatedCompleted, subjectsIncidence, editalTopics);
      },
      weeklyTime,
      weeklyQuestions,
      todayBySubject,
      totals: { weekMinutes, weekQuestions, todayMinutes },
      subjectsIncidence,
      setSubjectsIncidence: (inc) => {
        setSubjectsIncidence(inc);
        saveUserData(sessions, completedTopics, inc, editalTopics);
      },
      editalTopics,
      setEditalTopics: (t) => {
        setEditalTopics(t);
        saveUserData(sessions, completedTopics, subjectsIncidence, t);
      },
    };
  }, [sessions, completedTopics, subjectsIncidence, editalTopics, userId]);

  return <StudyCtx.Provider value={value}>{children}</StudyCtx.Provider>;
}

export function useStudy() {
  const v = useContext(StudyCtx);
  if (!v) throw new Error("useStudy must be used within StudyProvider");
  return v;
}
