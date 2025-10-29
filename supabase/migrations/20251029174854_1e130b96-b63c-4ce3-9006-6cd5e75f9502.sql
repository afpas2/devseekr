-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  country TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user languages
CREATE TABLE public.user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  language TEXT NOT NULL,
  UNIQUE(user_id, language)
);

-- Create user roles (what they can do)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  UNIQUE(user_id, role)
);

-- Create user game genres liked
CREATE TABLE public.user_game_genres_liked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  genre TEXT NOT NULL,
  UNIQUE(user_id, genre)
);

-- Create user game genres disliked
CREATE TABLE public.user_game_genres_disliked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  genre TEXT NOT NULL,
  UNIQUE(user_id, genre)
);

-- Create user aesthetic preferences
CREATE TABLE public.user_aesthetic_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  aesthetic TEXT NOT NULL,
  preference TEXT CHECK (preference IN ('like', 'dislike')) NOT NULL,
  UNIQUE(user_id, aesthetic, preference)
);

-- Create user favorite games
CREATE TABLE public.user_favorite_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_name TEXT NOT NULL
);

-- Create user social links
CREATE TABLE public.user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'planning',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project invitations
CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, recipient_id, status)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_genres_liked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_genres_disliked ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_aesthetic_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_languages
CREATE POLICY "Languages are viewable by everyone" ON public.user_languages FOR SELECT USING (true);
CREATE POLICY "Users can manage their own languages" ON public.user_languages FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Roles are viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Users can manage their own roles" ON public.user_roles FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_game_genres_liked
CREATE POLICY "Liked genres are viewable by everyone" ON public.user_game_genres_liked FOR SELECT USING (true);
CREATE POLICY "Users can manage their liked genres" ON public.user_game_genres_liked FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_game_genres_disliked
CREATE POLICY "Disliked genres are viewable by everyone" ON public.user_game_genres_disliked FOR SELECT USING (true);
CREATE POLICY "Users can manage their disliked genres" ON public.user_game_genres_disliked FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_aesthetic_preferences
CREATE POLICY "Aesthetic preferences are viewable by everyone" ON public.user_aesthetic_preferences FOR SELECT USING (true);
CREATE POLICY "Users can manage their aesthetic preferences" ON public.user_aesthetic_preferences FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_favorite_games
CREATE POLICY "Favorite games are viewable by everyone" ON public.user_favorite_games FOR SELECT USING (true);
CREATE POLICY "Users can manage their favorite games" ON public.user_favorite_games FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_social_links
CREATE POLICY "Social links are viewable by everyone" ON public.user_social_links FOR SELECT USING (true);
CREATE POLICY "Users can manage their own social links" ON public.user_social_links FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Project owners can update their projects" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Project owners can delete their projects" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for project_members
CREATE POLICY "Project members are viewable by everyone" ON public.project_members FOR SELECT USING (true);
CREATE POLICY "Project owners can add members" ON public.project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);
CREATE POLICY "Project owners can remove members" ON public.project_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);

-- RLS Policies for project_invitations
CREATE POLICY "Users can view their own invitations" ON public.project_invitations FOR SELECT USING (
  auth.uid() = recipient_id OR auth.uid() = sender_id
);
CREATE POLICY "Project owners can create invitations" ON public.project_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid())
);
CREATE POLICY "Recipients can update invitation status" ON public.project_invitations FOR UPDATE USING (
  auth.uid() = recipient_id
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();