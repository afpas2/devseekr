import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, RefreshCw, MessageCircle, CreditCard, AlertTriangle } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-red-400 to-rose-500 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Pagamento Falhou</h1>
          <p className="text-muted-foreground mb-8">
            Não foi possível processar o teu pagamento
          </p>

          <Card className="p-6 mb-8 border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3 text-left">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-2">
                  Possíveis razões:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Fundos insuficientes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Cartão expirado ou inválido
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Cartão bloqueado pelo banco
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    Limite de transações excedido
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 mb-8 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Tenta usar outro método de pagamento ou contacta o teu banco para mais informações.
            </p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/checkout")}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Ver Planos
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Precisas de ajuda?
            </p>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar Suporte
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentFailed;
