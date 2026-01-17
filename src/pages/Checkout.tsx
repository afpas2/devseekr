import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Shield, Crown, Lock, CreditCard, Sparkles } from "lucide-react";

const BREEZI_PAYMENT_URL = "https://breezi.dev/pay/5a85ccdd-9304-43ca-927c-3ccd8efb4b2b";

const Checkout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const handlePayWithBreezi = () => {
    // Guardar timestamp para validação - previne bypass
    localStorage.setItem('payment_initiated', Date.now().toString());
    // Redirecionar para Breezi (mesma janela para callback funcionar)
    window.location.href = BREEZI_PAYMENT_URL;
  };

  const features = [
    "Projetos ilimitados",
    "Membros ilimitados por projeto",
    "Chamadas sem limite de tempo",
    "Badge 'Pro' no perfil",
    "Prioridade no matching",
    "Suporte prioritário",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 mb-4">
              <CreditCard className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
              Checkout
            </h1>
            <p className="text-muted-foreground">
              Upgrade para Premium e desbloqueia todas as funcionalidades
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <Card className="p-6 border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Premium</h2>
                  <p className="text-muted-foreground text-sm">
                    Para equipas sérias
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-background/80 border border-border/50">
                <span className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">€20</span>
                <span className="text-muted-foreground text-lg">/mês</span>
              </div>

              <div className="space-y-3 mb-6">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-500/10">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Faturação mensal. Cancela a qualquer momento.
                </p>
              </div>
            </Card>

            {/* Payment Section */}
            <Card className="p-6 border border-border/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                  alt="PayPal"
                  className="w-10 h-10"
                />
                <div>
                  <h2 className="text-xl font-bold">Pagamento via PayPal</h2>
                  <p className="text-sm text-muted-foreground">Seguro e rápido</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    O pagamento é processado de forma segura através do PayPal via Breezi.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Serás redirecionado para completar o pagamento.
                  </p>
                </div>

                <Button
                  onClick={handlePayWithBreezi}
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-7 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <img
                    src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                    alt="PayPal"
                    className="w-6 h-6 mr-3"
                  />
                  Pagar €20 com PayPal
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Após completar o pagamento, serás redirecionado automaticamente.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Ambiente Sandbox
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este é um simulador de pagamento. Usa as credenciais de teste do PayPal Sandbox.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Lock className="w-4 h-4" />
                <span>Pagamento seguro e encriptado</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
