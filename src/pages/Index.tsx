import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gamepad2, Users, Sparkles, ArrowRight, Search, MessageCircle, Target, Star, Zap, Shield, Globe } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ developers: 0, projects: 0, satisfaction: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  // Animate stats when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsVisible) {
          setStatsVisible(true);
          animateStats();
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [statsVisible]);

  const animateStats = () => {
    const targets = { developers: 500, projects: 200, satisfaction: 95 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setStats({
        developers: Math.round(targets.developers * eased),
        projects: Math.round(targets.projects * eased),
        satisfaction: Math.round(targets.satisfaction * eased),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 bg-mesh" />
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-hero blur-2xl opacity-40 rounded-full" />
                <img src={logo} alt="Devseekr" className="relative w-20 h-20 lg:w-28 lg:h-28 rounded-3xl shadow-elegant" />
              </div>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-bold font-display mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="gradient-text">
                Devseekr
              </span>
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-fade-in font-display" style={{ animationDelay: '0.2s' }}>
              Encontra a tua equipa dos sonhos
            </p>
            <p className="text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
              Matching alimentado por IA para conectar desenvolvedores de jogos indie em todo o mundo.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-hero hover:opacity-90 text-lg px-10 py-6 rounded-2xl shadow-elegant btn-glow text-primary-foreground"
              >
                Começar Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-10 py-6 rounded-2xl border-2"
              >
                Entrar
              </Button>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="stat-card">
                <p className="stat-value">{stats.developers}+</p>
                <p className="stat-label">Desenvolvedores</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.projects}+</p>
                <p className="stat-label">Projetos Ativos</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.satisfaction}%</p>
                <p className="stat-label">Satisfação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <section className="section-padding bg-muted/30">
        <div className="content-width">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Simples & Rápido
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Como Funciona</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Três passos simples para encontrares a tua equipa ideal
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { 
                step: 1, 
                icon: Users, 
                title: "Cria o Teu Perfil", 
                desc: "Adiciona as tuas skills, preferências de géneros, jogos favoritos e portfolio. Quanto mais completo, melhor o matching.",
                color: "primary"
              },
              { 
                step: 2, 
                icon: Search, 
                title: "Encontra a Equipa", 
                desc: "A nossa IA analisa perfis e recomenda os melhores colaboradores. Explora projetos abertos ou cria o teu.",
                color: "secondary"
              },
              { 
                step: 3, 
                icon: Target, 
                title: "Colabora e Cria", 
                desc: "Usa chat em tempo real, gere a equipa e mantém todos sincronizados. Concentra-te em criar jogos incríveis.",
                color: "accent"
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative group">
                <div className="card-interactive p-8">
                  <div className={`absolute -top-5 -left-5 w-14 h-14 rounded-2xl bg-${color} flex items-center justify-center text-${color}-foreground font-bold text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {step}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-${color}/10 flex items-center justify-center mb-6 mt-4`}>
                    <Icon className={`w-7 h-7 text-${color}`} />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-3">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="section-padding">
        <div className="content-width">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              Funcionalidades
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Tudo o que Precisas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas para desenvolvedores indie
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Matching com IA", desc: "Algoritmos inteligentes analisam skills, preferências e ambições para encontrar colaboradores perfeitos.", gradient: "from-primary to-primary-glow" },
              { icon: MessageCircle, title: "Chat em Tempo Real", desc: "Mensagens diretas, chat de equipa, notificações e indicadores de presença online.", gradient: "from-secondary to-secondary-glow" },
              { icon: Gamepad2, title: "Gestão de Projetos", desc: "Cria projetos, convida membros, define roles e mantém a equipa organizada.", gradient: "from-accent to-purple-400" },
              { icon: Globe, title: "Comunidade Global", desc: "Conecta-te com developers de todo o mundo, sem barreiras geográficas.", gradient: "from-green-500 to-emerald-400" },
              { icon: Shield, title: "Perfis Verificados", desc: "Sistema de reviews e portfolios para garantir colaboradores de qualidade.", gradient: "from-orange-500 to-yellow-400" },
              { icon: Zap, title: "Chamadas de Voz", desc: "Comunicação em tempo real com a tua equipa, integrada na plataforma.", gradient: "from-pink-500 to-rose-400" },
            ].map(({ icon: Icon, title, desc, gradient }) => (
              <div key={title} className="card-interactive p-6 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold font-display mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testemunhos */}
      <section className="section-padding bg-muted/30">
        <div className="content-width">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              Testemunhos
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">O que Dizem</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Histórias de sucesso da nossa comunidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Miguel S.", role: "Programador Unity", quote: "Encontrei o artista perfeito para o meu jogo em menos de uma semana. O matching com IA é incrível!", stars: 5 },
              { name: "Ana R.", role: "Pixel Artist", quote: "Finalmente uma plataforma focada em game dev. Já colaborei em 3 projetos fantásticos.", stars: 5 },
              { name: "João P.", role: "Compositor", quote: "A comunidade é super acolhedora e profissional. Recomendo a todos os indies!", stars: 5 },
            ].map(({ name, role, quote, stars }) => (
              <div key={name} className="card-elevated p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="content-width">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                FAQ
              </span>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">Perguntas Frequentes</h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                { q: "O que é o Devseekr?", a: "Devseekr é uma plataforma de networking alimentada por IA para desenvolvedores de jogos indie. Conectamos programadores, artistas, compositores, designers e writers para formarem equipas compatíveis." },
                { q: "É gratuito?", a: "Sim! O plano gratuito inclui criação de perfil, exploração de projetos, matching com IA e comunicação. O Premium desbloqueia projetos ilimitados e chamadas sem limite de tempo." },
                { q: "Como funciona o matching com IA?", a: "A nossa IA analisa skills, géneros preferidos, preferências estéticas e jogos favoritos para sugerir as melhores matches baseadas em compatibilidade técnica e pessoal." },
                { q: "Que tipo de developers posso encontrar?", a: "Programadores (Unity, Unreal, Godot), artistas 2D/3D, pixel artists, compositores, sound designers, game designers, narrative designers, writers e mais." },
                { q: "Posso usar para projetos comerciais?", a: "Absolutamente! Podes usar o Devseekr para hobby ou jogos comerciais. Os acordos são definidos entre os membros - nós facilitamos a conexão." },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 bg-card shadow-sm">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6">{q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding">
        <div className="content-width">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-12 lg:p-20 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 text-white">
                Pronto para Começar?
              </h2>
              <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto">
                Junta-te a centenas de developers que já estão a criar os seus jogos dos sonhos com as equipas perfeitas.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-white text-primary hover:bg-white/90 text-lg px-12 py-7 rounded-2xl shadow-xl font-semibold"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="content-width text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Devseekr. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
