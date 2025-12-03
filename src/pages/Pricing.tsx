import { Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';

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
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
}

const plans: PricingPlan[] = [
  {
    name: 'Freemium',
    description: 'Perfeito para começar',
    price: '€0',
    period: '/mês',
    features: [
      { text: 'Até 2 projetos por mês', included: true },
      { text: 'Máximo 3 membros por projeto', included: true },
      { text: 'Chamadas até 15 minutos', included: true },
      { text: 'Mensagens ilimitadas', included: true },
      { text: 'Perfil público', included: true },
      { text: 'Projetos ilimitados', included: false },
      { text: 'Membros ilimitados', included: false },
      { text: 'Chamadas ilimitadas', included: false },
      { text: 'Badge "Pro" no perfil', included: false },
      { text: 'Prioridade no matching', included: false },
    ],
    buttonText: 'Plano Atual',
    buttonVariant: 'outline',
  },
  {
    name: 'Premium',
    description: 'Para equipas sérias',
    price: '€9.99',
    period: '/mês',
    popular: true,
    features: [
      { text: 'Até 2 projetos por mês', included: true },
      { text: 'Máximo 3 membros por projeto', included: true },
      { text: 'Chamadas até 15 minutos', included: true },
      { text: 'Mensagens ilimitadas', included: true },
      { text: 'Perfil público', included: true },
      { text: 'Projetos ilimitados', included: true },
      { text: 'Membros ilimitados', included: true },
      { text: 'Chamadas ilimitadas', included: true },
      { text: 'Badge "Pro" no perfil', included: true },
      { text: 'Prioridade no matching', included: true },
    ],
    buttonText: 'Fazer Upgrade',
    buttonVariant: 'default',
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Planos e Preços
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Escolhe o plano ideal para ti
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Começa grátis e faz upgrade quando precisares de mais funcionalidades 
            para levar os teus projetos ao próximo nível.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg",
                plan.popular && "border-primary shadow-lg scale-105"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                  Mais Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.popular ? (
                    <Zap className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="h-5 w-5" />
                  )}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        !feature.included && "text-muted-foreground line-through"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center",
                        feature.included 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Check className="h-3 w-3" />
                      </div>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant}
                  disabled={plan.buttonText === 'Plano Atual'}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Posso cancelar a qualquer momento?</h3>
              <p className="text-muted-foreground text-sm">
                Sim! Podes cancelar a tua subscrição a qualquer momento. 
                Continuarás a ter acesso às funcionalidades Premium até ao fim do período pago.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">O que acontece aos meus projetos se fizer downgrade?</h3>
              <p className="text-muted-foreground text-sm">
                Os teus projetos existentes permanecem intactos. Apenas não poderás criar 
                novos projetos além do limite do plano Freemium.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Que métodos de pagamento aceitam?</h3>
              <p className="text-muted-foreground text-sm">
                Aceitamos cartões de crédito/débito (Visa, Mastercard, American Express) 
                através do Stripe, garantindo transações seguras.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Existe desconto para estudantes?</h3>
              <p className="text-muted-foreground text-sm">
                Sim! Oferecemos 50% de desconto para estudantes verificados. 
                Contacta-nos com o teu email institucional para mais informações.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
