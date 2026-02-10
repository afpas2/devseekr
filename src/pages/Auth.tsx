import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Gamepad2, Mail, Lock, ArrowRight, Sparkles, Users, Target } from "lucide-react";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkProfileAndRedirect = async (session: Session) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          checkProfileAndRedirect(session);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkProfileAndRedirect(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Bem-vindo de volta!");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifica o teu email para continuar.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8">
            <img src={logo} alt="Devseekr" className="w-24 h-24 rounded-3xl shadow-2xl" />
          </div>
          
          <h1 className="text-5xl font-bold font-display mb-4 text-center">Devseekr</h1>
          <p className="text-xl text-white/90 text-center mb-12 max-w-md">
            A plataforma de networking para desenvolvedores de jogos indie
          </p>

          <div className="space-y-6 w-full max-w-sm">
            {[
              { icon: Sparkles, text: "Matching alimentado por IA" },
              { icon: Users, text: "Comunidade global de developers" },
              { icon: Target, text: "Encontra a equipa perfeita" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4 bg-white/10 rounded-xl px-6 py-4 backdrop-blur">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logo} alt="Devseekr" className="w-16 h-16 rounded-2xl shadow-elegant mb-4" />
            <h1 className="text-3xl font-bold font-display gradient-text">Devseekr</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display mb-2">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground">
              Entra ou cria uma conta para continuar
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-12">
              <TabsTrigger value="login" className="text-base">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="text-base">Registar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="tu@exemplo.com"
                      required
                      className="pl-12 h-12 text-base rounded-xl input-focus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="pl-12 h-12 text-base rounded-xl input-focus"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-hero hover:opacity-90 rounded-xl shadow-elegant"
                  disabled={loading}
                >
                  {loading ? "A entrar..." : "Entrar"}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="tu@exemplo.com"
                      required
                      className="pl-12 h-12 text-base rounded-xl input-focus"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pl-12 h-12 text-base rounded-xl input-focus"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-hero hover:opacity-90 rounded-xl shadow-elegant"
                  disabled={loading}
                >
                  {loading ? "A criar conta..." : "Criar Conta"}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </form>
              
              <p className="text-xs text-center text-muted-foreground">
                Ao criar conta, concordas com os nossos Termos de Serviço e Política de Privacidade.
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              ← Voltar à página inicial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
