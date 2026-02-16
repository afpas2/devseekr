import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const LANGUAGES = [
  "Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano",
  "Japonês", "Coreano", "Chinês Mandarim", "Russo", "Árabe", "Hindi",
  "Holandês", "Polaco", "Sueco", "Turco", "Norueguês", "Dinamarquês",
  "Finlandês", "Grego", "Checo", "Romeno", "Húngaro", "Tailandês",
  "Vietnamita", "Indonésio", "Malaio", "Filipino", "Ucraniano", "Catalão",
  "Hebraico", "Persa", "Bengali", "Tâmil", "Urdu", "Swahili",
  "Croata", "Sérvio", "Búlgaro", "Eslovaco", "Esloveno", "Lituano",
  "Letão", "Estoniano", "Islandês", "Galego", "Basco",
];

interface LanguageMultiSelectProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
}

export const LanguageMultiSelect = ({ selectedLanguages, onChange }: LanguageMultiSelectProps) => {
  const [input, setInput] = useState("");
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

  const filtered = LANGUAGES.filter(
    (l) =>
      l.toLowerCase().includes(input.toLowerCase()) &&
      !selectedLanguages.includes(l)
  ).slice(0, 10);

  const addLanguage = (lang: string) => {
    if (!selectedLanguages.includes(lang)) {
      onChange([...selectedLanguages, lang]);
    }
    setInput("");
    setShowDropdown(false);
  };

  const removeLanguage = (lang: string) => {
    onChange(selectedLanguages.filter((l) => l !== lang));
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Pesquisar idioma..."
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((lang) => (
              <div
                key={lang}
                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm transition-colors"
                onMouseDown={(e) => { e.preventDefault(); addLanguage(lang); }}
              >
                {lang}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map((lang) => (
            <Badge key={lang} variant="secondary" className="py-1.5 px-3">
              {lang}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => removeLanguage(lang)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
