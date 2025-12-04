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
import { ArrowLeft, Upload, Loader2, AlertTriangle, Crown } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle",
  "Horror", "Platformer", "Fighting", "Racing", "Sports", "MMO"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        {/* Limite de Projetos Warning */}
        {!planLoading && plan === 'freemium' && (
          <Card className={`p-4 mb-6 ${!canCreateProject ? 'border-destructive bg-destructive/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${!canCreateProject ? 'text-destructive' : 'text-amber-500'}`} />
              <div className="flex-1">
                {!canCreateProject ? (
                  <>
                    <p className="font-medium text-destructive">
                      Limite de projetos atingido
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Já criaste {projectsCreatedThisMonth} de {limits.maxProjectsPerMonth} projetos este mês.
                      Faz upgrade para Premium para criar projetos ilimitados.
                    </p>
                    <Button 
                      onClick={() => navigate('/checkout')} 
                      size="sm"
                      className="mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 text-white"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Fazer Upgrade
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      Plano Freemium
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tens <Badge variant="outline">{remainingProjects}</Badge> {remainingProjects === 1 ? 'projeto restante' : 'projetos restantes'} este mês.
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

        <Card className="p-8 shadow-elegant">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Criar Novo Projeto
          </h1>
          <p className="text-muted-foreground mb-8">
            Começa a tua jornada de desenvolvimento de jogos
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Género *</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
                disabled={!canCreateProject}
              >
                <SelectTrigger>
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
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
                disabled={!canCreateProject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageFile">Imagem do Projeto</Label>
              <div className="space-y-2">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || !canCreateProject}
                />
                {uploadingImage && (
                  <p className="text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                    A carregar imagem...
                  </p>
                )}
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Ou insere um URL:</p>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
                disabled={!canCreateProject}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={loading || !canCreateProject}
            >
              {loading ? "A criar..." : "Criar Projeto"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
