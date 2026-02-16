import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const BASE_SKILLS = [
  "Unity", "Unreal Engine", "Godot", "GameMaker",
  "Blender", "Maya", "Photoshop", "Aseprite",
  "C#", "C++", "Python", "JavaScript", "TypeScript",
  "FMOD", "Wwise", "FL Studio", "Audacity",
  "Figma", "After Effects", "Spine", "Tiled",
  "Substance Painter", "ZBrush", "Krita", "GIMP",
  "Rust", "Lua", "GDScript", "Haxe",
  "React", "Node.js", "Docker", "Git",
];

interface SkillTagInputProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
}

export const SkillTagInput = ({ selectedSkills, onChange }: SkillTagInputProps) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = input.trim();
    if (query.length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const fetchSuggestions = async () => {
      // Get distinct roles from DB matching the query
      const { data: dbRoles } = await supabase
        .from("user_roles")
        .select("role")
        .ilike("role", `${query}%`)
        .limit(20);

      const dbSet = new Set(dbRoles?.map(r => r.role) || []);
      
      // Merge with base skills
      const allOptions = new Set<string>([...dbSet]);
      BASE_SKILLS.forEach(s => {
        if (s.toLowerCase().startsWith(query.toLowerCase())) {
          allOptions.add(s);
        }
      });

      // Filter out already selected
      const filtered = Array.from(allOptions)
        .filter(s => !selectedSkills.some(sel => sel.toLowerCase() === s.toLowerCase()))
        .sort()
        .slice(0, 8);

      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timer);
  }, [input, selectedSkills]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedSkills, trimmed]);
    }
    setInput("");
    setShowDropdown(false);
  };

  const removeSkill = (skill: string) => {
    onChange(selectedSkills.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addSkill(suggestions[0]);
      } else if (input.trim()) {
        addSkill(input);
      }
    }
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Escreve uma skill (ex: Godot, Blender, C#)..."
        />
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s}
                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm transition-colors"
                onMouseDown={(e) => { e.preventDefault(); addSkill(s); }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <Badge key={skill} variant="secondary" className="py-1.5 px-3">
              {skill}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => removeSkill(skill)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
