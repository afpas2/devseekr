import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Upload, ArrowLeft, User, Wrench, Gamepad2, Heart, Link2 } from "lucide-react";
import { z } from "zod";
import { SkillTagInput } from "@/components/ui/SkillTagInput";
import { LanguageMultiSelect } from "@/components/ui/LanguageMultiSelect";

const CLASSES = [
  { value: "Programmer", label: "Programmer", icon: "💻", description: "Código e sistemas" },
  { value: "Artist", label: "Artist", icon: "🎨", description: "Arte 2D/3D e animação" },
  { value: "Sound Designer", label: "Sound Designer", icon: "🎵", description: "Audio e música" },
  { value: "Game Designer", label: "Game Designer", icon: "🎮", description: "Mecânicas e design" },
  { value: "Producer", label: "Producer", icon: "📋", description: "Gestão e coordenação" },
  { value: "Writer", label: "Writer", icon: "✍️", description: "Narrativa e diálogos" },
  { value: "All-Rounder", label: "All-Rounder", icon: "🌟", description: "Um pouco de tudo" },
];

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle",
  "Horror", "Platformer", "Fighting", "Racing", "Sports", "MMO"
];

const AESTHETICS = [
  "Pixel Art", "Low Poly", "Realistic", "Cel Shaded", "Minimalist",
  "Voxel", "Hand Drawn", "Sci-Fi", "Fantasy", "Cyberpunk"
];

const profileSchema = z.object({
  username: z.string()
    .trim()
    .min(1, "Username é obrigatório")
    .max(50, "Username deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username só pode conter letras, números, _ e -"),
  fullName: z.string()
    .trim()
    .min(1, "Nome completo é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  country: z.string()
    .trim()
    .min(1, "País é obrigatório")
    .max(100, "País deve ter no máximo 100 caracteres"),
  bio: z.string()
    .trim()
    .max(500, "Bio deve ter no máximo 500 caracteres")
    .optional(),
});

const urlSchema = z.string()
  .url("Deve ser um URL válido")
  .regex(/^https?:\/\//, "URL deve começar com http:// ou https://");

const Settings = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    country: "",
    bio: "",
    avatarUrl: "",
  });

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [likedGenres, setLikedGenres] = useState<string[]>([]);
  const [dislikedGenres, setDislikedGenres] = useState<string[]>([]);
  const [likedAesthetics, setLikedAesthetics] = useState<string[]>([]);
  const [dislikedAesthetics, setDislikedAesthetics] = useState<string[]>([]);
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [gameInput, setGameInput] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([
    { platform: "GitHub", url: "" },
    { platform: "Portfolio", url: "" },
    { platform: "Twitter", url: "" },
  ]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        loadUserData(session.user.id);
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

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        setFormData({
          username: profile.username,
          fullName: profile.full_name,
          country: profile.country,
          bio: profile.bio || "",
          avatarUrl: profile.avatar_url || "",
        });
        // Parse classes from comma-separated string
        if (profile.class) {
          setSelectedClasses(profile.class.split(",").filter(Boolean));
        }
      }

      // Load roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (roles) setSelectedRoles(roles.map(r => r.role));

      // Load languages
      const { data: languages } = await supabase
        .from("user_languages")
        .select("language")
        .eq("user_id", userId);
      if (languages) setSelectedLanguages(languages.map(l => l.language));

      // Load liked genres
      const { data: liked } = await supabase
        .from("user_game_genres_liked")
        .select("genre")
        .eq("user_id", userId);
      if (liked) setLikedGenres(liked.map(g => g.genre));

      // Load disliked genres
      const { data: disliked } = await supabase
        .from("user_game_genres_disliked")
        .select("genre")
        .eq("user_id", userId);
      if (disliked) setDislikedGenres(disliked.map(g => g.genre));

      // Load aesthetic preferences
      const { data: aesthetics } = await supabase
        .from("user_aesthetic_preferences")
        .select("aesthetic, preference")
        .eq("user_id", userId);
      if (aesthetics) {
        setLikedAesthetics(aesthetics.filter(a => a.preference === 'like').map(a => a.aesthetic));
        setDislikedAesthetics(aesthetics.filter(a => a.preference === 'dislike').map(a => a.aesthetic));
      }

      // Load favorite games
      const { data: games } = await supabase
        .from("user_favorite_games")
        .select("game_name")
        .eq("user_id", userId);
      if (games) setFavoriteGames(games.map(g => g.game_name));

      // Load social links
      const { data: links } = await supabase
        .from("user_social_links")
        .select("platform, url")
        .eq("user_id", userId);
      if (links && links.length > 0) {
        const updatedLinks = socialLinks.map(sl => {
          const found = links.find(l => l.platform === sl.platform);
          return found ? { platform: sl.platform, url: found.url } : sl;
        });
        setSocialLinks(updatedLinks);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !session?.user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;

    setUploadingAvatar(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData({ ...formData, avatarUrl: publicUrl });
      toast.success("Avatar carregado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const toggleGenre = (genre: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      setLikedGenres(prev =>
        prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
      );
      setDislikedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setDislikedGenres(prev =>
        prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
      );
      setLikedGenres(prev => prev.filter(g => g !== genre));
    }
  };

  const toggleAesthetic = (aesthetic: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      setLikedAesthetics(prev =>
        prev.includes(aesthetic) ? prev.filter(a => a !== aesthetic) : [...prev, aesthetic]
      );
      setDislikedAesthetics(prev => prev.filter(a => a !== aesthetic));
    } else {
      setDislikedAesthetics(prev =>
        prev.includes(aesthetic) ? prev.filter(a => a !== aesthetic) : [...prev, aesthetic]
      );
      setLikedAesthetics(prev => prev.filter(a => a !== aesthetic));
    }
  };

  const addGame = () => {
    const trimmed = gameInput.trim();
    if (trimmed && !favoriteGames.includes(trimmed)) {
      setFavoriteGames([...favoriteGames, trimmed]);
      setGameInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) return;

    try {
      profileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (selectedRoles.length === 0) {
      toast.error("Selecione pelo menos uma skill");
      return;
    }

    for (const link of socialLinks.filter(l => l.url.trim())) {
      try {
        urlSchema.parse(link.url.trim());
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error(`${link.platform}: ${error.errors[0].message}`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      // Update profile with classes as comma-separated
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: formData.username.trim(),
          full_name: formData.fullName.trim(),
          country: formData.country.trim(),
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatarUrl || null,
          class: selectedClasses.join(",") || null,
        })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // Delete and re-insert roles
      await supabase.from("user_roles").delete().eq("user_id", session.user.id);
      for (const role of selectedRoles) {
        await supabase.from("user_roles").insert({
          user_id: session.user.id,
          role,
        });
      }

      // Delete and re-insert languages
      await supabase.from("user_languages").delete().eq("user_id", session.user.id);
      for (const language of selectedLanguages) {
        await supabase.from("user_languages").insert({
          user_id: session.user.id,
          language,
        });
      }

      // Delete and re-insert genres
      await supabase.from("user_game_genres_liked").delete().eq("user_id", session.user.id);
      for (const genre of likedGenres) {
        await supabase.from("user_game_genres_liked").insert({
          user_id: session.user.id,
          genre,
        });
      }

      await supabase.from("user_game_genres_disliked").delete().eq("user_id", session.user.id);
      for (const genre of dislikedGenres) {
        await supabase.from("user_game_genres_disliked").insert({
          user_id: session.user.id,
          genre,
        });
      }

      // Delete and re-insert aesthetics
      await supabase.from("user_aesthetic_preferences").delete().eq("user_id", session.user.id);
      for (const aesthetic of likedAesthetics) {
        await supabase.from("user_aesthetic_preferences").insert({
          user_id: session.user.id,
          aesthetic,
          preference: 'like',
        });
      }
      for (const aesthetic of dislikedAesthetics) {
        await supabase.from("user_aesthetic_preferences").insert({
          user_id: session.user.id,
          aesthetic,
          preference: 'dislike',
        });
      }

      // Delete and re-insert games
      await supabase.from("user_favorite_games").delete().eq("user_id", session.user.id);
      for (const game of favoriteGames) {
        await supabase.from("user_favorite_games").insert({
          user_id: session.user.id,
          game_name: game,
        });
      }

      // Delete and re-insert social links
      await supabase.from("user_social_links").delete().eq("user_id", session.user.id);
      for (const link of socialLinks.filter(l => l.url.trim())) {
        await supabase.from("user_social_links").insert({
          user_id: session.user.id,
          platform: link.platform,
          url: link.url.trim(),
        });
      }

      toast.success("Definições guardadas com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!session || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
              Definições da Conta
            </h1>
            <p className="text-muted-foreground">
              Atualiza as tuas informações pessoais e preferências
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Avatar + Dados Básicos */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Dados Pessoais</h2>
              </div>
              
              {/* Avatar Upload */}
              <div className="space-y-4 mb-6">
                <Label className="text-sm text-muted-foreground">Avatar</Label>
                <div className="flex items-center gap-4">
                  {formData.avatarUrl && (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="max-w-xs"
                    />
                    {uploadingAvatar && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                        A carregar...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nome de Utilizador *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Sobre ti</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Conta-nos sobre ti..."
                    rows={4}
                  />
                </div>
              </div>
            </Card>

            {/* Card 2: Classes - MULTI-SELECT */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">A tua Classe</h2>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Escolhe as tuas Classes (podes selecionar várias)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CLASSES.map((cls) => (
                    <div
                      key={cls.value}
                      onClick={() => toggleClass(cls.value)}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                        ${selectedClasses.includes(cls.value) 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <span className="text-3xl mb-2 block">{cls.icon}</span>
                      <span className="font-medium text-sm">{cls.label}</span>
                      <span className="text-xs text-muted-foreground block mt-1">{cls.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Card 3: Skills & Languages */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Skills & Idiomas</h2>
              </div>
              
              {/* Skills - FREE TEXT TAG INPUT */}
              <div className="space-y-4 mb-6">
                <Label className="text-sm text-muted-foreground">As Tuas Skills *</Label>
                <SkillTagInput
                  selectedSkills={selectedRoles}
                  onChange={setSelectedRoles}
                />
              </div>

              {/* Languages - MULTI-SELECT */}
              <div className="space-y-4">
                <Label className="text-sm text-muted-foreground">Idiomas</Label>
                <LanguageMultiSelect
                  selectedLanguages={selectedLanguages}
                  onChange={setSelectedLanguages}
                />
              </div>
            </Card>

            {/* Card 4: Géneros de Jogos */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Géneros de Jogos</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Géneros Favoritos</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        variant={likedGenres.includes(genre) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          likedGenres.includes(genre) ? "bg-gradient-primary" : ""
                        }`}
                        onClick={() => toggleGenre(genre, 'like')}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Géneros a Evitar</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        variant={dislikedGenres.includes(genre) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleGenre(genre, 'dislike')}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 5: Preferências Estéticas */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Preferências Estéticas</h2>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Estéticas Favoritas</Label>
                  <div className="flex flex-wrap gap-2">
                    {AESTHETICS.map((aesthetic) => (
                      <Badge
                        key={aesthetic}
                        variant={likedAesthetics.includes(aesthetic) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          likedAesthetics.includes(aesthetic) ? "bg-gradient-secondary" : ""
                        }`}
                        onClick={() => toggleAesthetic(aesthetic, 'like')}
                      >
                        {aesthetic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Estéticas a Evitar</Label>
                  <div className="flex flex-wrap gap-2">
                    {AESTHETICS.map((aesthetic) => (
                      <Badge
                        key={aesthetic}
                        variant={dislikedAesthetics.includes(aesthetic) ? "destructive" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleAesthetic(aesthetic, 'dislike')}
                      >
                        {aesthetic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Card 6: Jogos Favoritos */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Jogos Favoritos</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={gameInput}
                    onChange={(e) => setGameInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGame())}
                    placeholder="Adicionar jogo favorito..."
                  />
                  <Button type="button" onClick={addGame} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteGames.map((game) => (
                    <Badge key={game} variant="secondary">
                      {game}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => setFavoriteGames(favoriteGames.filter(g => g !== game))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Card 7: Links Sociais */}
            <Card className="p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Links Sociais</h2>
              </div>
              
              <div className="space-y-4">
                {socialLinks.map((link, index) => (
                  <div key={link.platform} className="space-y-2">
                    <Label htmlFor={link.platform}>{link.platform}</Label>
                    <Input
                      id={link.platform}
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...socialLinks];
                        newLinks[index].url = e.target.value;
                        setSocialLinks(newLinks);
                      }}
                      placeholder={`https://...`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 py-6 text-base"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A Guardar...
                </>
              ) : (
                "Guardar Alterações"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
