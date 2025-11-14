import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user ID from JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId, projectContext } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with anon key to validate JWT and get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for data operations
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, project_members(user_id)")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    // Verify user owns the project
    if (project.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "You must be the project owner to find team matches" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const memberIds = project.project_members.map((m: any) => m.user_id);

    // Get all profiles with their details (excluding current members)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        full_name,
        country,
        bio,
        user_roles(role),
        user_languages(language),
        user_game_genres_liked(genre),
        user_game_genres_disliked(genre),
        user_aesthetic_preferences(aesthetic, preference),
        user_favorite_games(game_name)
      `)
      .not("id", "in", `(${memberIds.join(",")})`);

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No available developers found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Format profiles for AI
    const formattedProfiles = profiles.map((profile) => ({
      userId: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      country: profile.country,
      bio: profile.bio,
      roles: profile.user_roles?.map((r: any) => r.role) || [],
      languages: profile.user_languages?.map((l: any) => l.language) || [],
      likedGenres: profile.user_game_genres_liked?.map((g: any) => g.genre) || [],
      dislikedGenres: profile.user_game_genres_disliked?.map((g: any) => g.genre) || [],
      likedAesthetics: profile.user_aesthetic_preferences
        ?.filter((a: any) => a.preference === "like")
        .map((a: any) => a.aesthetic) || [],
      dislikedAesthetics: profile.user_aesthetic_preferences
        ?.filter((a: any) => a.preference === "dislike")
        .map((a: any) => a.aesthetic) || [],
      favoriteGames: profile.user_favorite_games?.map((g: any) => g.game_name) || [],
    }));

    // Call Lovable AI to find best match
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI matchmaker for game development teams. Analyze the project context and developer profiles to find the best match. Consider:
- Skills needed vs developer roles
- Genre preferences alignment
- Aesthetic preferences
- Experience with similar games
- Language compatibility

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "userId": "selected_user_id",
  "username": "username",
  "fullName": "full_name",
  "roles": ["role1", "role2"],
  "bio": "bio text",
  "reasoning": "2-3 sentences explaining why this is a good match"
}`,
          },
          {
            role: "user",
            content: `Project: ${project.name}
Genre: ${project.genre}
Description: ${project.description}

Project Context: ${projectContext}

Available Developers:
${JSON.stringify(formattedProfiles, null, 2)}

Find the best match and return the JSON response.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response from AI
    const match = JSON.parse(content);

    return new Response(JSON.stringify(match), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
