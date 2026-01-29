import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApplicationLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationsUsed: number;
  maxApplications: number;
}

export const ApplicationLimitDialog = ({
  open,
  onOpenChange,
  applicationsUsed,
  maxApplications,
}: ApplicationLimitDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/10">
            <AlertTriangle className="h-7 w-7 text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            Limite de Candidaturas Atingido
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p>
              Já usaste as tuas <strong>{applicationsUsed}/{maxApplications}</strong> candidaturas mensais.
            </p>
            <p className="text-muted-foreground">
              Com o plano Premium, tens candidaturas ilimitadas e muitas outras vantagens!
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col mt-4">
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate('/pricing');
            }}
            className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
          >
            <Crown className="w-4 h-4" />
            Fazer Upgrade para PRO
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
