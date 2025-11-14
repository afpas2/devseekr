import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().trim().min(10, "Descrição deve ter pelo menos 10 caracteres").max(2000, "Descrição muito longa"),
  communication_link: z.string().trim().url("URL inválida").optional().or(z.literal("")),
});

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    name: string;
    description: string;
    communication_link: string | null;
  };
  onProjectUpdated: () => void;
}

export const EditProjectDialog = ({ open, onOpenChange, project, onProjectUpdated }: EditProjectDialogProps) => {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description,
    communication_link: project.communication_link || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate
      const validated = projectSchema.parse(formData);

      const { error } = await supabase
        .from("projects")
        .update({
          name: validated.name,
          description: validated.description,
          communication_link: validated.communication_link || null,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Projeto atualizado com sucesso!");
      onProjectUpdated();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do projeto"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição do projeto"
              rows={4}
              maxLength={2000}
            />
          </div>
          <div>
            <Label htmlFor="communication_link">Link de Comunicação (Discord, Slack, etc.)</Label>
            <Input
              id="communication_link"
              type="url"
              value={formData.communication_link}
              onChange={(e) => setFormData({ ...formData, communication_link: e.target.value })}
              placeholder="https://discord.gg/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link para Discord, Slack ou outra plataforma de comunicação
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
