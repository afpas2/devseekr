import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Shield, Crown } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Checkout</h1>
          <p className="text-muted-foreground text-center mb-8">
            Upgrade para Premium e desbloqueia todas as funcionalidades
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resumo do Plano */}
            <Card className="p-6 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Premium</h2>
                  <p className="text-muted-foreground text-sm">
                    Para equipas sérias
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">€20</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  "Projetos ilimitados",
                  "Membros ilimitados por projeto",
                  "Chamadas sem limite de tempo",
                  "Badge 'Pro' no perfil",
                  "Prioridade no matching",
                  "Suporte prioritário",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  Faturação mensal. Cancela a qualquer momento.
                </p>
              </div>
            </Card>

            {/* Pagamento via Breezi/PayPal */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <img
                  src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                  alt="PayPal"
                  className="w-8 h-8"
                />
                <h2 className="text-xl font-bold">Pagamento via PayPal</h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-muted-foreground mb-2">
                    O pagamento é processado de forma segura através do PayPal via Breezi.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Serás redirecionado para completar o pagamento numa nova janela.
                  </p>
                </div>

                <Button
                  onClick={handlePayWithBreezi}
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-6 text-lg"
                >
                  <img
                    src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
                    alt="PayPal"
                    className="w-6 h-6 mr-2"
                  />
                  Pagar €20 com PayPal
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Após completar o pagamento, serás redirecionado automaticamente.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Ambiente Sandbox
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este é um simulador de pagamento. Usa as credenciais de teste do PayPal Sandbox para simular o pagamento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4" />
                <span>Pagamento seguro via PayPal</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
