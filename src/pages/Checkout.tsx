import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Check, Loader2, Shield, Crown } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);

    // Simular processamento de pagamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cardNumberClean = cardData.number.replace(/\s/g, "");

    // Cartões de teste
    if (cardNumberClean === "4242424242424242") {
      // Sucesso - criar/atualizar subscrição
      try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const { error } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "premium",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "card_" + cardNumberClean.slice(-4),
          }, { onConflict: "user_id" });

        if (error) throw error;

        navigate("/payment-success");
      } catch (error: any) {
        toast.error("Erro ao processar: " + error.message);
        setLoading(false);
      }
    } else if (
      cardNumberClean === "4000000000000002" ||
      cardNumberClean === "4000000000009995"
    ) {
      // Falha
      navigate("/payment-failed");
    } else {
      // Qualquer outro cartão - sucesso para demo
      try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        const { error } = await supabase
          .from("user_subscriptions")
          .upsert({
            user_id: userId,
            plan: "premium",
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_method: "card_" + cardNumberClean.slice(-4),
          }, { onConflict: "user_id" });

        if (error) throw error;

        navigate("/payment-success");
      } catch (error: any) {
        toast.error("Erro ao processar: " + error.message);
        setLoading(false);
      }
    }
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

            {/* Formulário de Pagamento */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Dados de Pagamento</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome no Cartão</Label>
                  <Input
                    id="name"
                    value={cardData.name}
                    onChange={(e) =>
                      setCardData({ ...cardData, name: e.target.value })
                    }
                    placeholder="João Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número do Cartão</Label>
                  <Input
                    id="number"
                    value={cardData.number}
                    onChange={(e) =>
                      setCardData({
                        ...cardData,
                        number: formatCardNumber(e.target.value),
                      })
                    }
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Validade</Label>
                    <Input
                      id="expiry"
                      value={cardData.expiry}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          expiry: formatExpiry(e.target.value),
                        })
                      }
                      placeholder="MM/AA"
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={cardData.cvv}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                        })
                      }
                      placeholder="123"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pagar €20
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      Ambiente de Teste
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <Badge variant="outline" className="text-xs">4242 4242 4242 4242</Badge> para simular sucesso
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use <Badge variant="outline" className="text-xs">4000 0000 0000 0002</Badge> para simular falha
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Shield className="w-4 h-4" />
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
