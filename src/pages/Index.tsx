import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gamepad2, Users, Sparkles, ArrowRight, Search, MessageCircle, Target } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [showStats] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto animate-fade-in">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Devseekr" className="w-24 h-24 rounded-3xl shadow-elegant" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Devseekr
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Conecta-te com desenvolvedores de jogos em todo o mundo. Constrói a tua equipa dos sonhos com matching alimentado por IA.
          </p>

          {showStats && (
            <div className="flex gap-8 justify-center mb-8 text-sm">
              <div>
                <p className="text-2xl font-bold text-primary">500+</p>
                <p className="text-muted-foreground">Desenvolvedores</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">200+</p>
                <p className="text-muted-foreground">Projetos Ativos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">95%</p>
                <p className="text-muted-foreground">Satisfação</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 shadow-elegant"
            >
              Começar Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Entrar
            </Button>
          </div>

          {/* Como Funciona */}
          <div className="mt-32 mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Como Funciona</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              Três passos simples para encontrares a tua equipa ideal
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="relative p-8 rounded-2xl bg-card border hover:border-primary transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  1
                </div>
                <Users className="w-10 h-10 text-primary mb-4 mt-2" />
                <h3 className="text-xl font-bold mb-3">Cria o Teu Perfil</h3>
                <p className="text-muted-foreground">
                  Adiciona as tuas skills, preferências de géneros, jogos favoritos e portfolio. Quanto mais completo, melhor o matching.
                </p>
              </div>

              <div className="relative p-8 rounded-2xl bg-card border hover:border-secondary transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  2
                </div>
                <Search className="w-10 h-10 text-secondary mb-4 mt-2" />
                <h3 className="text-xl font-bold mb-3">Encontra a Equipa Ideal</h3>
                <p className="text-muted-foreground">
                  A nossa IA analisa perfis e recomenda os melhores colaboradores para o teu projeto. Explora projetos abertos ou cria o teu.
                </p>
              </div>

              <div className="relative p-8 rounded-2xl bg-card border hover:border-accent transition-all">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  3
                </div>
                <Target className="w-10 h-10 text-accent mb-4 mt-2" />
                <h3 className="text-xl font-bold mb-3">Colabora e Cria</h3>
                <p className="text-muted-foreground">
                  Usa chat em tempo real, gere membros da equipa e mantém todos sincronizados. Concentra-te em criar jogos incríveis.
                </p>
              </div>
            </div>
          </div>

          {/* Funcionalidades Detalhadas */}
          <div className="mt-32 mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo o que Precisas</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              Ferramentas poderosas para desenvolvedores indie
            </p>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-elegant transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Matching com IA</h3>
                    <p className="text-muted-foreground text-sm">
                      Algoritmos inteligentes analisam skills, preferências de géneros, estética e ambições para sugerir os melhores colaboradores.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-elegant transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Chat em Tempo Real</h3>
                    <p className="text-muted-foreground text-sm">
                      Mensagens diretas, chat de equipa, notificações instantâneas e indicadores de "a escrever..." e online/offline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-elegant transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Gestão de Projetos</h3>
                    <p className="text-muted-foreground text-sm">
                      Cria projetos, convida membros, define roles necessários e mantém toda a equipa organizada num só lugar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-elegant transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Perfis Detalhados</h3>
                    <p className="text-muted-foreground text-sm">
                      Mostra o teu portfolio, skills, jogos favoritos, preferências estéticas e muito mais. Destaca-te e encontra a match perfeita.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-32 mb-20 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-muted-foreground mb-12">
              Tudo o que precisas saber sobre o Devseekr
            </p>

            <Accordion type="single" collapsible className="w-full text-left">
              <AccordionItem value="item-1" className="border rounded-lg px-6 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  O que é o Devseekr?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Devseekr é uma plataforma de networking alimentada por IA para desenvolvedores de jogos indie. Conectamos programadores, artistas, compositores, designers e writers para formarem equipas compatíveis e reduzirem o abandono de projetos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  É gratuito?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim! O Devseekr é totalmente gratuito para começares. Podes criar o teu perfil, explorar projetos, usar o matching com IA e comunicar com outros developers sem custos. No futuro, poderemos introduzir funcionalidades premium opcionais.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  Como funciona o matching com IA?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  A nossa IA analisa o teu perfil completo: skills técnicas, géneros de jogos preferidos, preferências estéticas, jogos favoritos e ambições. Depois, cruza essa informação com outros developers e projetos para sugerir as melhores matches baseadas em compatibilidade técnica e pessoal.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  Que tipo de developers posso encontrar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Encontras todos os tipos: programadores (Unity, Unreal, Godot, etc.), artistas 2D/3D, pixel artists, compositores de música, sound designers, game designers, narrative designers, writers e muito mais. A plataforma é para qualquer pessoa envolvida na criação de jogos indie.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6 mb-4">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                  Posso usar para projetos comerciais?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutamente! Podes usar o Devseekr para encontrar colaboradores tanto para projetos hobby como para jogos comerciais. Os acordos financeiros e de direitos autorais são definidos diretamente entre os membros da equipa - nós apenas facilitamos a conexão.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* CTA Final */}
          <div className="mt-32 mb-20 p-12 rounded-3xl bg-gradient-hero text-white shadow-elegant">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Junta-te a centenas de developers que já estão a criar os seus jogos dos sonhos com as equipas perfeitas.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 shadow-lg"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
