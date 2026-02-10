import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, AlertTriangle, Crown, Gamepad2, Sparkles, Image } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle",
  "Horror", "Platformer", "Fighting", "Racing", "Sports", "MMO"
];

const METHODOLOGIES = [
  { value: "Casual", label: "Casual", description: "Sem estrutura formal, flexível" },
  { value: "Agile", label: "Agile", description: "Iterações rápidas e feedback contínuo" },
  { value: "Scrum", label: "Scrum", description: "Sprints e reuniões regulares" },
  { value: "Kanban", label: "Kanban", description: "Fluxo visual de trabalho" },
  { value: "Waterfall", label: "Waterfall", description: "Fases sequenciais planeadas" },
];

const NewProject = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    genre: "",
    methodology: "Casual",
    imageUrl: "",
  });

  const { 
    plan, 
    canCreateProject, 
    projectsCreatedThisMonth, 
    limits, 
    isLoading: planLoading 
  } = useUserPlan();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !session?.user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;

    setUploadingImage(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, imageUrl: publicUrl });
      toast.success("Imagem carregada com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) return;

    if (!canCreateProject) {
      toast.error("Atingiste o limite de projetos deste mês. Faz upgrade para Premium!");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: formData.name,
          description: formData.description,
          genre: formData.genre,
          methodology: formData.methodology,
          image_url: formData.imageUrl || null,
          owner_id: session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as first member
      await supabase.from("project_members").insert({
        project_id: data.id,
        user_id: session.user.id,
        role: "Owner",
      });

      toast.success("Projeto criado com sucesso!");
      navigate(`/projects/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  const remainingProjects = limits.maxProjectsPerMonth - projectsCreatedThisMonth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6 hover:bg-primary/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        {/* Limite de Projetos Warning */}
        {!planLoading && plan === 'freemium' && (
          <Card className={`p-5 mb-6 animate-fade-in ${!canCreateProject ? 'border-destructive/50 bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${!canCreateProject ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={`w-5 h-5 ${!canCreateProject ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`} />
              </div>
              <div className="flex-1">
                {!canCreateProject ? (
                  <>
                    <p className="font-semibold text-destructive mb-1">
                      Limite de projetos atingido
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Já criaste {projectsCreatedThisMonth} de {limits.maxProjectsPerMonth} projetos este mês.
                      Faz upgrade para Premium para criar projetos ilimitados.
                    </p>
                    <Button 
                      onClick={() => navigate('/checkout')} 
                      size="sm"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Fazer Upgrade
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                      Plano Free
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tens <Badge variant="outline" className="mx-1">{remainingProjects}</Badge> {remainingProjects === 1 ? 'projeto restante' : 'projetos restantes'} este mês.
                      <Button variant="link" className="p-0 h-auto ml-1 text-primary" onClick={() => navigate('/pricing')}>
                        Faz upgrade para ilimitado
                      </Button>
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8 border-border/50 shadow-elegant animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Criar Novo Projeto
            </h1>
          </div>
          <p className="text-muted-foreground mb-8 ml-14">
            Começa a tua jornada de desenvolvimento de jogos
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Super Adventure Game"
                required
                disabled={!canCreateProject}
                className="border-border/50 focus:border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre" className="text-sm font-medium">Género *</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
                disabled={!canCreateProject}
              >
                <SelectTrigger className="border-border/50">
                  <SelectValue placeholder="Seleciona um género" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology" className="text-sm font-medium">Metodologia</Label>
              <Select
                value={formData.methodology}
                onValueChange={(value) =>
                  setFormData({ ...formData, methodology: value })
                }
                disabled={!canCreateProject}
              >
                <SelectTrigger className="border-border/50">
                  <SelectValue placeholder="Seleciona uma metodologia" />
                </SelectTrigger>
                <SelectContent>
                  {METHODOLOGIES.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex flex-col">
                        <span>{method.label}</span>
                        <span className="text-xs text-muted-foreground">{method.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreve o teu projeto, objetivos e visão..."
                rows={4}
                required
                disabled={!canCreateProject}
                className="border-border/50 focus:border-primary/30"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Imagem do Projeto</Label>
              
              {/* Image Preview */}
              <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center hover:border-primary/30 transition-colors">
                {formData.imageUrl ? (
                  <div className="relative inline-block">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-40 h-40 object-cover rounded-lg shadow-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute -top-2 -right-2 h-7 w-7 p-0 rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="py-4">
                    <div className="p-4 rounded-full bg-muted/50 inline-flex mb-3">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Arrasta uma imagem ou clica para carregar
                    </p>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || !canCreateProject}
                      className="max-w-xs mx-auto"
                    />
                    {uploadingImage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        A carregar...
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Ou insere um URL:</span>
              </div>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
                disabled={!canCreateProject}
                className="border-border/50"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 py-6 text-base shadow-lg"
              disabled={loading || !canCreateProject}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A criar...
                </>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Criar Projeto
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
