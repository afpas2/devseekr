import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onSuccess: () => void;
}

export const JoinRequestDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  onSuccess,
}: JoinRequestDialogProps) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado para fazer isso.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("project_join_requests").insert({
        project_id: projectId,
        user_id: user.id,
        message: message.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Pedido já enviado",
            description: "Você já enviou um pedido para este projeto.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Pedido enviado!",
        description: `Seu pedido para entrar em "${projectName}" foi enviado com sucesso.`,
      });

      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error sending join request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedir Entrada no Projeto</DialogTitle>
          <DialogDescription>
            Envie um pedido para entrar em "{projectName}". Você pode adicionar uma
            mensagem opcional explicando por que gostaria de participar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (Opcional)</Label>
            <Textarea
              id="message"
              placeholder="Conte ao dono do projeto sobre suas habilidades e por que você gostaria de participar..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
