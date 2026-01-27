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
import { X, User, Gamepad2, Wrench, Heart, Link2 } from "lucide-react";
import { z } from "zod";

const SKILLS = [
  "Unity", "Unreal Engine", "Godot", "GameMaker",
  "Blender", "Maya", "Photoshop", "Aseprite",
  "C#", "C++", "Python", "JavaScript",
  "FMOD", "Wwise", "FL Studio", "Audacity",
  "Figma", "After Effects", "Spine", "Tiled"
];

const CLASSES = [
  { value: "Programmer", label: "Programmer", icon: "💻", description: "Código e sistemas" },
  { value: "Artist", label: "Artist", icon: "🎨", description: "Arte 2D/3D e animação" },
  { value: "Sound Designer", label: "Sound Designer", icon: "🎵", description: "Audio e música" },
  { value: "Game Designer", label: "Game Designer", icon: "🎮", description: "Mecânicas e design" },
  { value: "Producer", label: "Producer", icon: "📋", description: "Gestão e coordenação" },
  { value: "Writer", label: "Writer", icon: "✍️", description: "Narrativa e diálogos" },
  { value: "All-Rounder", label: "All-Rounder", icon: "🌟", description: "Um pouco de tudo" },
];

const LEVELS = [
  { value: "Beginner", label: "Iniciante", description: "A começar a jornada" },
  { value: "Junior", label: "Júnior", description: "1-2 anos de experiência" },
  { value: "Mid", label: "Pleno", description: "3-5 anos de experiência" },
  { value: "Senior", label: "Sénior", description: "5+ anos de experiência" },
];

const GENRES = [
  "Action", "Adventure", "RPG", "Strategy", "Simulation", "Puzzle",
  "Horror", "Platformer", "Fighting", "Racing", "Sports", "MMO"
];

const AESTHETICS = [
  "Pixel Art", "Low Poly", "Realistic", "Cel Shaded", "Minimalist",
  "Voxel", "Hand Drawn", "Sci-Fi", "Fantasy", "Cyberpunk"
];

// Validation schema
const profileSchema = z.object({
  username: z.string()
    .trim()
    .min(1, "Nome de utilizador é obrigatório")
    .max(50, "Nome de utilizador deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nome de utilizador só pode conter letras, números, underscores e hífens"),
  fullName: z.string()
    .trim()
    .min(1, "Nome completo é obrigatório")
    .max(100, "Nome completo deve ter no máximo 100 caracteres"),
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

const textInputSchema = z.string()
  .trim()
  .min(1)
  .max(100, "O texto deve ter no máximo 100 caracteres");

const Onboarding = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    country: "",
    bio: "",
    level: "Beginner",
    playerClass: "",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
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

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
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

  const addLanguage = () => {
    const trimmed = languageInput.trim();
    try {
      textInputSchema.parse(trimmed);
      if (!selectedLanguages.includes(trimmed)) {
        setSelectedLanguages([...selectedLanguages, trimmed]);
        setLanguageInput("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const addGame = () => {
    const trimmed = gameInput.trim();
    try {
      textInputSchema.parse(trimmed);
      if (!favoriteGames.includes(trimmed)) {
        setFavoriteGames([...favoriteGames, trimmed]);
        setGameInput("");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) return;

    // Validate form data
    try {
      profileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (selectedSkills.length === 0) {
      toast.error("Seleciona pelo menos um skill");
      return;
    }

    // Validate social links
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

    setLoading(true);

    try {
      // Create profile with level and class
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          username: formData.username.trim(),
          full_name: formData.fullName.trim(),
          country: formData.country.trim(),
          bio: formData.bio.trim() || null,
          level: formData.level,
          class: formData.playerClass || null,
        });

      if (profileError) throw profileError;

      // Insert skills as roles (reusing user_roles table)
      for (const skill of selectedSkills) {
        await supabase.from("user_roles").insert({
          user_id: session.user.id,
          role: skill,
        });
      }

      // Insert languages
      for (const language of selectedLanguages) {
        await supabase.from("user_languages").insert({
          user_id: session.user.id,
          language,
        });
      }

      // Insert liked genres
      for (const genre of likedGenres) {
        await supabase.from("user_game_genres_liked").insert({
          user_id: session.user.id,
          genre,
        });
      }

      // Insert disliked genres
      for (const genre of dislikedGenres) {
        await supabase.from("user_game_genres_disliked").insert({
          user_id: session.user.id,
          genre,
        });
      }

      // Insert aesthetic preferences
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

      // Insert favorite games
      for (const game of favoriteGames) {
        await supabase.from("user_favorite_games").insert({
          user_id: session.user.id,
          game_name: game,
        });
      }

      // Insert social links
      for (const link of socialLinks.filter(l => l.url.trim())) {
        await supabase.from("user_social_links").insert({
          user_id: session.user.id,
          platform: link.platform,
          url: link.url.trim(),
        });
      }

      toast.success("Perfil criado com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-hero bg-clip-text text-transparent">
            Completa o teu Perfil
          </h1>
          <p className="text-muted-foreground text-lg">
            Configura o teu perfil de desenvolvedor para encontrar os melhores matches
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <Card className="p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Os teus Dados</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Utilizador *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="o_teu_username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="O teu nome completo"
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
                  placeholder="Portugal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre ti</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conta-nos um pouco sobre ti, a tua experiência e o que te motiva..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Class & Level */}
          <Card className="p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gamepad2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">A tua Classe</h2>
            </div>
            
            <div className="space-y-6">
              {/* Class Selection */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Escolhe a tua Classe Principal</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {CLASSES.map((cls) => (
                    <div
                      key={cls.value}
                      onClick={() => setFormData({ ...formData, playerClass: cls.value })}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                        ${formData.playerClass === cls.value 
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

              {/* Level Selection */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Nível de Experiência</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {LEVELS.map((level) => (
                    <div
                      key={level.value}
                      onClick={() => setFormData({ ...formData, level: level.value })}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                        ${formData.level === level.value 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <span className="font-medium">{level.label}</span>
                      <span className="text-xs text-muted-foreground block mt-1">{level.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Skills & Languages */}
          <Card className="p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Skills Técnicos</h2>
            </div>
            
            <div className="space-y-6">
              {/* Skills */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Seleciona as tuas ferramentas e tecnologias *</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      className={`cursor-pointer text-sm py-1.5 px-3 ${
                        selectedSkills.includes(skill) ? "bg-gradient-primary" : ""
                      }`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Idiomas que falas</Label>
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                    placeholder="Adicionar idioma..."
                  />
                  <Button type="button" onClick={addLanguage} variant="outline">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((lang) => (
                    <Badge key={lang} variant="secondary" className="py-1.5 px-3">
                      {lang}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== lang))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 4: Game Preferences */}
          <Card className="p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Preferências de Jogos</h2>
            </div>
            
            <div className="space-y-6">
              {/* Genres */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Géneros Favoritos</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        variant={likedGenres.includes(genre) ? "default" : "outline"}
                        className={`cursor-pointer py-1.5 px-3 ${
                          likedGenres.includes(genre) ? "bg-gradient-primary" : ""
                        }`}
                        onClick={() => toggleGenre(genre, 'like')}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Géneros a Evitar</Label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        variant={dislikedGenres.includes(genre) ? "destructive" : "outline"}
                        className="cursor-pointer py-1.5 px-3"
                        onClick={() => toggleGenre(genre, 'dislike')}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aesthetics */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Estéticas Favoritas</Label>
                  <div className="flex flex-wrap gap-2">
                    {AESTHETICS.map((aesthetic) => (
                      <Badge
                        key={aesthetic}
                        variant={likedAesthetics.includes(aesthetic) ? "default" : "outline"}
                        className={`cursor-pointer py-1.5 px-3 ${
                          likedAesthetics.includes(aesthetic) ? "bg-gradient-secondary" : ""
                        }`}
                        onClick={() => toggleAesthetic(aesthetic, 'like')}
                      >
                        {aesthetic}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Estéticas a Evitar</Label>
                  <div className="flex flex-wrap gap-2">
                    {AESTHETICS.map((aesthetic) => (
                      <Badge
                        key={aesthetic}
                        variant={dislikedAesthetics.includes(aesthetic) ? "destructive" : "outline"}
                        className="cursor-pointer py-1.5 px-3"
                        onClick={() => toggleAesthetic(aesthetic, 'dislike')}
                      >
                        {aesthetic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Favorite Games */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Jogos Favoritos</Label>
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
                    <Badge key={game} variant="secondary" className="py-1.5 px-3">
                      {game}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => setFavoriteGames(favoriteGames.filter(g => g !== game))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: Social Links */}
          <Card className="p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Links Sociais</h2>
            </div>
            
            <div className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="space-y-2">
                  <Label>{link.platform}</Label>
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...socialLinks];
                      newLinks[index].url = e.target.value;
                      setSocialLinks(newLinks);
                    }}
                    placeholder={`https://${link.platform.toLowerCase()}.com/...`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 h-12 text-lg font-medium rounded-xl"
            disabled={loading}
          >
            {loading ? "A criar perfil..." : "Concluir Perfil"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
