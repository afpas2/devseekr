import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown, Zap, HelpCircle } from "lucide-react";
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
      navigate("/checkout");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Zap className="w-3 h-3 mr-1" />
            Planos Simples
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolhe o Plano Ideal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Começa grátis e faz upgrade quando precisares de mais poder
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-8 ${
                plan.popular
                  ? "border-2 border-primary shadow-lg shadow-primary/10"
                  : "border border-border"
              } ${isCurrentPlan(plan.planType) ? "ring-2 ring-primary/50" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}

              {isCurrentPlan(plan.planType) && (
                <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">
                  Plano Atual
                </Badge>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <Button
                className={`w-full mb-6 ${
                  plan.popular && !isCurrentPlan(plan.planType)
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
                    : ""
                }`}
                variant={isCurrentPlan(plan.planType) ? "outline" : plan.buttonVariant}
                disabled={isCurrentPlan(plan.planType) || isLoading}
                onClick={() => handlePlanAction(plan.planType)}
              >
                {isLoading ? "A carregar..." : getButtonText(plan)}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
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
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Perguntas Frequentes</h2>
            </div>
            <p className="text-muted-foreground">
              Tudo o que precisas saber sobre os nossos planos
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
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
