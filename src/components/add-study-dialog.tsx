import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SUBJECTS, useStudy } from "@/lib/study-store";

export function AddStudyDialog() {
  const { addSession } = useStudy();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState("");
  const [correct, setCorrect] = useState("");
  const [wrong, setWrong] = useState("");
  const [markedComplete, setMarkedComplete] = useState(false);

  const reset = () => {
    setSubject("");
    setTopic("");
    setMinutes("");
    setCorrect("");
    setWrong("");
    setMarkedComplete(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !topic || !minutes) {
      toast.error("Preencha matéria, tópico e tempo estudado.");
      return;
    }
    addSession({
      subject,
      topic,
      minutes: Number(minutes) || 0,
      correct: Number(correct) || 0,
      wrong: Number(wrong) || 0,
      markedComplete,
    });
    toast.success("Sessão registrada!", {
      description: markedComplete ? "Tópico marcado como concluído." : topic,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-11 rounded-xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar estudo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar sessão de estudo</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para atualizar seu progresso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Matéria</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject" className="rounded-lg">
                <SelectValue placeholder="Selecione a matéria" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Tópico do edital</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Controle de constitucionalidade"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minutes">Tempo estudado (minutos)</Label>
            <Input
              id="minutes"
              type="number"
              min={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="60"
              className="rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="correct">Acertos</Label>
              <Input
                id="correct"
                type="number"
                min={0}
                value={correct}
                onChange={(e) => setCorrect(e.target.value)}
                placeholder="0"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wrong">Erros</Label>
              <Input
                id="wrong"
                type="number"
                min={0}
                value={wrong}
                onChange={(e) => setWrong(e.target.value)}
                placeholder="0"
                className="rounded-lg"
              />
            </div>
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <Checkbox
              id="complete"
              checked={markedComplete}
              onCheckedChange={(v) => setMarkedComplete(v === true)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">Marcar tópico como concluído</p>
              <p className="text-xs text-muted-foreground">
                Atualiza automaticamente o progresso no edital.
              </p>
            </div>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-lg">
              Salvar sessão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
