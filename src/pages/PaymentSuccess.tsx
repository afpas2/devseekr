import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Crown, Home, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const activatePremium = async () => {
      // Verificar se o pagamento foi iniciado (previne bypass)
      const paymentInitiated = localStorage.getItem('payment_initiated');
      
      if (!paymentInitiated) {
        setError("Sessão de pagamento inválida.");
        toast.error("Sessão de pagamento inválida. Por favor tenta novamente.");
        setIsActivating(false);
        return;
      }
      
      const initiatedTime = parseInt(paymentInitiated);
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      
      if (initiatedTime < thirtyMinutesAgo) {
        localStorage.removeItem('payment_initiated');
        setError("Sessão de pagamento expirada.");
        toast.error("Sessão de pagamento expirada. Por favor tenta novamente.");
        setIsActivating(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        // Chamar Edge Function segura para ativar Premium
        const { data, error: fnError } = await supabase.functions.invoke('activate-premium', {
          body: { payment_token: paymentInitiated }
        });

        if (fnError) {
          console.error("Erro ao ativar premium:", fnError);
          throw new Error(fnError.message || "Erro ao ativar premium");
        }

        if (!data?.success) {
          throw new Error(data?.error || "Erro ao ativar premium");
        }

        // Limpar dados de sessão após sucesso
        localStorage.removeItem('payment_initiated');

        const expiresDate = new Date(data.expires_at);
        setExpiresAt(expiresDate.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }));

        toast.success("Premium ativado com sucesso!");
      } catch (error: any) {
        console.error("Erro ao ativar premium:", error);
        setError(error.message || "Erro ao ativar premium");
        toast.error("Erro ao ativar premium. Por favor contacta o suporte.");
      } finally {
        setIsActivating(false);
      }
    };

    activatePremium();
  }, [navigate]);

  if (isActivating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">A ativar Premium...</h1>
            <p className="text-muted-foreground">Aguarda um momento</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Erro na Ativação</h1>
            <p className="text-muted-foreground mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate("/checkout")} className="gap-2">
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
                <Home className="w-4 h-4" />
                Ir para Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500 absolute top-0 right-1/3 animate-bounce" />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute bottom-4 left-1/3 animate-bounce delay-150" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground mb-8">
            Bem-vindo ao Devseekr Premium
          </p>

          <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Premium Ativo
              </span>
            </div>

            <div className="space-y-3 text-left">
              {[
                "Projetos ilimitados",
                "Membros ilimitados por projeto",
                "Chamadas sem limite de tempo",
                "Badge 'Pro' no perfil",
                "Prioridade no matching",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {expiresAt && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Próxima faturação: <span className="font-medium text-foreground">{expiresAt}</span>
                </p>
              </div>
            )}
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/dashboard")}
              className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
            >
              <Home className="w-4 h-4" />
              Ir para Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="gap-2"
            >
              <User className="w-4 h-4" />
              Ver Perfil
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
