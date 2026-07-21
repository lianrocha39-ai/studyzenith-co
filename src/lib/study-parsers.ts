import type { SubjectIncidence, EditalTopic } from "./study-store";

const INC_MAP: Record<string, number> = {
  "muito alta": 5,
  altissima: 5,
  "altíssima": 5,
  alta: 4,
  media: 3,
  "média": 3,
  medio: 3,
  "médio": 3,
  baixa: 2,
  "muito baixa": 1,
  "baixissima": 1,
  "baixíssima": 1,
};

function parseIncidence(v: string): number {
  const s = v.trim().toLowerCase();
  if (!s) return 3;
  const n = Number(s.replace(",", "."));
  if (!isNaN(n)) return Math.min(5, Math.max(1, Math.round(n)));
  return INC_MAP[s] ?? 3;
}

/** Accepts CSV/TSV/plain lines like: "Materia,Alta" or "Materia - 4" or JSON array. */
export function parseSubjectsFile(text: string): SubjectIncidence[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  // JSON
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed);
      const arr = Array.isArray(j) ? j : (j.materias ?? j.subjects ?? []);
      return arr
        .map((r: any) => ({
          name: String(r.materia ?? r.name ?? r.subject ?? "").trim(),
          incidence: parseIncidence(String(r.incidencia ?? r.incidence ?? r.nivel ?? "3")),
        }))
        .filter((r: SubjectIncidence) => r.name);
    } catch {
      /* fallthrough */
    }
  }
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: SubjectIncidence[] = [];
  for (const line of lines) {
    if (/^(materia|subject|nome)\b/i.test(line) && /(incidencia|incidence|nivel)/i.test(line)) continue;
    const parts = line.split(/[,;\t]|\s-\s|\s+\|\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      out.push({ name: parts[0], incidence: parseIncidence(parts[parts.length - 1]) });
    } else {
      out.push({ name: parts[0], incidence: 3 });
    }
  }
  return out;
}

/** Plain text edital: lines like "Direito Constitucional: Princípios; Controle" or
 *  "Direito Constitucional - Princípios". Sections headed by ALL CAPS or ending with ":" become subjects. */
export function parseEditalFile(text: string): EditalTopic[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: EditalTopic[] = [];
  let currentSubject = "Geral";
  let idx = 0;
  for (const line of lines) {
    // section header: ends with ":" and has no other separators
    const headerMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (headerMatch && (headerMatch[2] === "" || headerMatch[1].length < 60)) {
      const subj = headerMatch[1].trim();
      const rest = headerMatch[2].trim();
      if (!rest) {
        currentSubject = subj;
        continue;
      }
      currentSubject = subj;
      rest
        .split(/[;•]|\s\|\s/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => out.push({ id: `t${idx++}`, subject: currentSubject, topic: t }));
      continue;
    }
    // bullet or dash
    const cleaned = line.replace(/^[-•*\d.\)]+\s*/, "").trim();
    if (cleaned) out.push({ id: `t${idx++}`, subject: currentSubject, topic: cleaned });
  }
  return out;
}

export type ScheduleDay = {
  date: Date;
  subjects: { name: string; minutes: number; incidence: number }[];
};

/** Build a schedule from start date until endDate. Each day picks `subjectsPerDay` items,
 *  weighted by incidence, splitting `minutesPerDay` proportionally. */
export function buildSchedule(
  subjects: SubjectIncidence[],
  opts: {
    startDate: Date;
    endDate: Date;
    minutesPerDay: number;
    subjectsPerDay: number;
    restDays?: number[]; // 0=Sun..6=Sat
  },
): ScheduleDay[] {
  if (subjects.length === 0) return [];
  const restDays = opts.restDays ?? [];
  const days: ScheduleDay[] = [];
  const cursor = new Date(opts.startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(opts.endDate);
  end.setHours(0, 0, 0, 0);

  // Weighted round-robin queue
  const queue = [...subjects].sort((a, b) => b.incidence - a.incidence);
  let ptr = 0;

  while (cursor.getTime() <= end.getTime()) {
    if (restDays.includes(cursor.getDay())) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const picks: SubjectIncidence[] = [];
    for (let i = 0; i < opts.subjectsPerDay; i++) {
      picks.push(queue[ptr % queue.length]);
      ptr++;
    }
    const totalWeight = picks.reduce((a, p) => a + p.incidence, 0);
    days.push({
      date: new Date(cursor),
      subjects: picks.map((p) => ({
        name: p.name,
        incidence: p.incidence,
        minutes: Math.round((p.incidence / totalWeight) * opts.minutesPerDay),
      })),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
