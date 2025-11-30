import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

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

      toast.success("Project created successfully!");
      navigate(`/projects/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 shadow-elegant">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Create New Project
          </h1>
          <p className="text-muted-foreground mb-8">
            Start your game development journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a genre" />
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
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
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
                  disabled={uploadingImage}
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
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
