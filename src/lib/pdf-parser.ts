import type { SubjectIncidence, EditalTopic } from "./study-store";

// Known common exam subjects for Brazilian public contests (Concursos)
const KNOWN_SUBJECTS = [
  "LÍNGUA PORTUGUESA",
  "PORTUGUÊS",
  "DIREITO CONSTITUCIONAL",
  "DIREITO ADMINISTRATIVO",
  "DIREITO PENAL",
  "DIREITO PROCESSUAL PENAL",
  "DIREITO CIVIL",
  "DIREITO PROCESSUAL CIVIL",
  "DIREITO TRIBUTÁRIO",
  "DIREITO TRABALHISTA",
  "RACIOCÍNIO LÓGICO",
  "RACIOCÍNIO LÓGICO E MATEMÁTICO",
  "MATEMÁTICA",
  "INFORMÁTICA",
  "NOCÕES DE INFORMÁTICA",
  "CONHECIMENTOS BÁSICOS",
  "CONHECIMENTOS ESPECÍFICOS",
  "LEGISLAÇÃO ESPECIAL",
  "LEGISLAÇÃO APLICADA",
  "ADMINISTRAÇÃO PÚBLICA",
  "ADMINISTRAÇÃO GERAL",
  "CONTABILIDADE GERAL",
  "ARQUIVOLOGIA",
  "DIREITOS HUMANOS",
  "ÉTICA NO SERVIÇO PÚBLICO",
  "AFO",
  "ADMINISTRAÇÃO FINANCEIRA E ORÇAMENTÁRIA",
];

/** Extract raw text from a PDF file using PDF.js or fallback stream extraction */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Try loading pdfjsLib via CDN script if available or inject script
  try {
    if (!(window as any).pdfjsLib) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Falha ao carregar biblioteca PDF.js"));
        document.head.appendChild(script);
      });
    }

    const pdfjsLib = (window as any).pdfjsLib;
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }

      if (fullText.trim().length > 30) {
        return fullText;
      }
    }
  } catch (err) {
    console.warn("Fallback para extrator de texto nativo PDF:", err);
  }

  // Fallback: Direct Binary Stream Text Extraction
  const bytes = new Uint8Array(arrayBuffer);
  const latinText = new TextDecoder("iso-8859-1").decode(bytes);
  let extracted = "";

  // Match text in parentheses (text)Tj or [(text)]TJ
  const textMatches = latinText.match(/\(([^)]+)\)\s*Tj/g) || [];
  for (const m of textMatches) {
    const match = m.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      extracted += match[1] + " ";
    }
  }

  if (extracted.trim().length > 20) {
    return extracted;
  }

  // Final fallback text cleanup
  return latinText.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ");
}

/** Parses subjects and incidence levels from extracted text */
export function parseSubjectsFromText(text: string): SubjectIncidence[] {
  const upperText = text.toUpperCase();
  const subjectsFound: SubjectIncidence[] = [];

  // Check known subject keywords
  for (const subj of KNOWN_SUBJECTS) {
    if (upperText.includes(subj)) {
      // Estimate incidence based on frequency of occurrence in edital text
      const regex = new RegExp(subj.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const occurrences = (text.match(regex) || []).length;
      let incidence = 3;
      if (occurrences >= 5) incidence = 5;
      else if (occurrences >= 3) incidence = 4;
      else if (occurrences === 1) incidence = 3;

      // Formatting title case
      const formattedName = subj
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
        .replace(/ E /g, " e ")
        .replace(/ No /g, " no ")
        .replace(/ De /g, " de ")
        .replace(/ Do /g, " do ")
        .replace(/ Da /g, " da ");

      subjectsFound.push({ name: formattedName, incidence });
    }
  }

  // If no known subject match, parse heading lines ending with : or uppercase sections
  if (subjectsFound.length === 0) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.length >= 4 && line.length <= 50 && (/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+$/.test(line) || line.endsWith(":"))) {
        const cleaned = line.replace(":", "").trim();
        if (cleaned && !subjectsFound.some((s) => s.name.toLowerCase() === cleaned.toLowerCase())) {
          subjectsFound.push({
            name: cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase(),
            incidence: 4,
          });
        }
      }
    }
  }

  // Fallback defaults if PDF text could not be parsed into sections
  if (subjectsFound.length === 0) {
    return [
      { name: "Língua Portuguesa", incidence: 5 },
      { name: "Direito Constitucional", incidence: 4 },
      { name: "Direito Administrativo", incidence: 4 },
      { name: "Raciocínio Lógico", incidence: 3 },
      { name: "Informática", incidence: 3 },
    ];
  }

  return subjectsFound;
}

/** Parses edital topics from extracted PDF text */
export function parseEditalTopicsFromText(text: string): EditalTopic[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: EditalTopic[] = [];
  let currentSubject = "Conhecimentos Gerais";
  let idx = 0;

  for (const line of lines) {
    // Check if line is a subject header
    const isHeader =
      KNOWN_SUBJECTS.some((s) => line.toUpperCase().includes(s)) ||
      (line.endsWith(":") && line.length < 60);

    if (isHeader) {
      currentSubject = line.replace(":", "").trim();
      continue;
    }

    // Split topics by semi-colons, numbers (1.1, 1.2), or bullets
    const topics = line.split(/[;•]|\d+\.\d+/).map((t) => t.trim()).filter((t) => t.length > 3);
    for (const topic of topics) {
      out.push({
        id: `t_${idx++}`,
        subject: currentSubject,
        topic,
      });
    }
  }

  return out;
}
