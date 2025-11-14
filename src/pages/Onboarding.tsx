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
import { X } from "lucide-react";
import { z } from "zod";

const ROLES = [
  "Programmer", "3D Artist", "2D Artist", "Composer", "Sound Designer",
  "Game Designer", "Level Designer", "Writer", "Producer", "QA Tester"
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
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  fullName: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less"),
  country: z.string()
    .trim()
    .min(1, "Country is required")
    .max(100, "Country must be 100 characters or less"),
  bio: z.string()
    .trim()
    .max(500, "Bio must be 500 characters or less")
    .optional(),
});

const urlSchema = z.string()
  .url("Must be a valid URL")
  .regex(/^https?:\/\//, "URL must start with http:// or https://");

const textInputSchema = z.string()
  .trim()
  .min(1)
  .max(100, "Input must be 100 characters or less");

const Onboarding = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    country: "",
    bio: "",
  });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
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

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
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
      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          username: formData.username.trim(),
          full_name: formData.fullName.trim(),
          country: formData.country.trim(),
          bio: formData.bio.trim() || null,
        });

      if (profileError) throw profileError;

      // Insert roles
      for (const role of selectedRoles) {
        await supabase.from("user_roles").insert({
          user_id: session.user.id,
          role,
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

      // Insert social links (already validated above)
      for (const link of socialLinks.filter(l => l.url.trim())) {
        await supabase.from("user_social_links").insert({
          user_id: session.user.id,
          platform: link.platform,
          url: link.url.trim(),
        });
      }

      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 py-12">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 shadow-elegant">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground mb-8">
            Tell us about yourself to get the best matches
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Roles *</h2>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Badge
                    key={role}
                    variant={selectedRoles.includes(role) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedRoles.includes(role) ? "bg-gradient-primary" : ""
                    }`}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Languages</h2>
              <div className="flex gap-2">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                  placeholder="Add a language..."
                />
                <Button type="button" onClick={addLanguage} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((lang) => (
                  <Badge key={lang} variant="secondary">
                    {lang}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedLanguages(selectedLanguages.filter(l => l !== lang))}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Game Genres */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Game Genres</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Liked Genres</Label>
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
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Disliked Genres</Label>
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
            </div>

            {/* Aesthetics */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Aesthetic Preferences</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Liked Aesthetics</Label>
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
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Disliked Aesthetics</Label>
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
            </div>

            {/* Favorite Games */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Favorite Games</h2>
              <div className="flex gap-2">
                <Input
                  value={gameInput}
                  onChange={(e) => setGameInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGame())}
                  placeholder="Add a favorite game..."
                />
                <Button type="button" onClick={addGame} variant="outline">
                  Add
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

            {/* Social Links */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Social Links</h2>
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
                    placeholder={`https://...`}
                  />
                </div>
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
