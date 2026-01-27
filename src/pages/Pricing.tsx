import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Zap, HelpCircle, Sparkles, ArrowLeft } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: PlanFeature[];
  popular: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline";
  planType: "freemium" | "premium";
}

const plans: PricingPlan[] = [
  {
    name: "Freemium",
    description: "Para começar",
    price: "€0",
    period: "/mês",
    features: [
      { text: "Até 2 projetos por mês", included: true },
      { text: "Membros ilimitados por projeto", included: true },
      { text: "Chamadas até 15 minutos", included: true },
      { text: "Mensagens ilimitadas", included: true },
      { text: "Perfil público", included: true },
      { text: "Projetos ilimitados", included: false },
      { text: "Chamadas ilimitadas", included: false },
      { text: "Badge 'Pro' no perfil", included: false },
      { text: "Prioridade no matching", included: false },
    ],
    popular: false,
    buttonText: "Plano Atual",
    buttonVariant: "outline",
    planType: "freemium",
  },
  {
    name: "Premium",
    description: "Para equipas sérias",
    price: "€20",
    period: "/mês",
    features: [
      { text: "Projetos ilimitados", included: true },
      { text: "Membros ilimitados por projeto", included: true },
      { text: "Chamadas ilimitadas", included: true },
      { text: "Mensagens ilimitadas", included: true },
      { text: "Perfil público", included: true },
      { text: "Badge 'Pro' no perfil", included: true },
      { text: "Prioridade no matching", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    popular: true,
    buttonText: "Fazer Upgrade",
    buttonVariant: "default",
    planType: "premium",
  },
];

const faqs = [
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Podes cancelar a tua subscrição Premium a qualquer momento. Continuarás a ter acesso até ao fim do período de faturação.",
  },
  {
    question: "Como funciona o limite de projetos?",
    answer:
      "No plano Freemium, podes criar até 2 projetos por mês. Este contador reinicia no primeiro dia de cada mês.",
  },
  {
    question: "O que acontece às minhas chamadas após 15 minutos?",
    answer:
      "No plano Freemium, as chamadas são automaticamente terminadas após 15 minutos. No Premium, não há limite de duração.",
  },
  {
    question: "Como funciona a prioridade no matching?",
    answer:
      "Utilizadores Premium aparecem primeiro nas sugestões de colaboradores e têm acesso a filtros avançados de matching.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { plan: currentPlan, isPremium, isLoading } = useUserPlan();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const handlePlanAction = (planType: "freemium" | "premium") => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (planType === "premium" && !isPremium) {
      // Open Stripe checkout in new tab
      window.open("https://buy.stripe.com/test_eVqbJ1csa4ch2Cv6NN2wU03", "_blank");
    }
  };

  const getButtonText = (plan: PricingPlan) => {
    if (!isAuthenticated) {
      return plan.planType === "premium" ? "Começar Agora" : "Criar Conta";
    }

    if (plan.planType === currentPlan) {
      return "Plano Atual";
    }

    if (plan.planType === "premium") {
      return "Fazer Upgrade";
    }

    return "Plano Atual";
  };

  const isCurrentPlan = (planType: "freemium" | "premium") => {
    return isAuthenticated && planType === currentPlan;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')} 
          className="mb-6 hover:bg-primary/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar à Dashboard
        </Button>
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Planos Simples
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Escolhe o Plano Ideal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Começa grátis e faz upgrade quando precisares de mais poder
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-8 transition-all duration-300 hover:shadow-elegant animate-fade-in ${
                plan.popular
                  ? "border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 shadow-lg"
                  : "border border-border/50 hover:border-primary/20"
              } ${isCurrentPlan(plan.planType) ? "ring-2 ring-primary/30" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg px-4 py-1">
                  <Crown className="w-3.5 h-3.5 mr-1.5" />
                  Mais Popular
                </Badge>
              )}

              {isCurrentPlan(plan.planType) && (
                <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Plano Atual
                </Badge>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8 pb-6 border-b border-border/50">
                <span className={`text-5xl font-bold ${plan.popular ? 'bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent' : ''}`}>
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-lg">{plan.period}</span>
              </div>

              <Button
                className={`w-full mb-8 py-6 text-base ${
                  plan.popular && !isCurrentPlan(plan.planType)
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white shadow-lg"
                    : ""
                }`}
                variant={isCurrentPlan(plan.planType) ? "outline" : plan.buttonVariant}
                disabled={isCurrentPlan(plan.planType) || isLoading}
                onClick={() => handlePlanAction(plan.planType)}
              >
                {isLoading ? "A carregar..." : getButtonText(plan)}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="p-1 rounded-full bg-green-500/10">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-muted">
                        <X className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">FAQ</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Perguntas Frequentes</h2>
            <p className="text-muted-foreground">
              Tudo o que precisas saber sobre os nossos planos
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/20 data-[state=open]:bg-primary/5 transition-all"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
    </div>
  );
}
