import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StarRating } from "./StarRating";
import { MetricSlider } from "./MetricSlider";
import { ChevronRight, AlertTriangle, Loader2 } from "lucide-react";

interface MemberData {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

interface ReviewFormData {
  rating_overall: number;
  metrics: {
    deadlines: number;
    quality: number;
    communication: number;
    teamwork: number;
    professionalism: number;
    problem_solving: number;
  };
  would_work_again: boolean | null;
  recommend: boolean | null;
  role_played: string;
  commitment_level: string;
  comment: string;
  flags: {
    toxic: boolean;
    abandoned: boolean;
    broken_rules: boolean;
  };
}

interface MemberReviewFormProps {
  member: MemberData;
  currentIndex: number;
  totalMembers: number;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  isSubmitting: boolean;
}

const ROLES = [
  "Programmer",
  "Artist",
  "Sound Designer",
  "Game Designer",
  "Writer",
  "Producer",
  "QA Tester",
  "Animator",
  "3D Modeler",
  "UI/UX Designer",
  "Marketing",
  "Other",
];

const COMMITMENT_LEVELS = [
  "Muito Baixo",
  "Baixo",
  "Médio",
  "Alto",
  "Muito Alto",
];

export const MemberReviewForm = ({
  member,
  currentIndex,
  totalMembers,
  onSubmit,
  isSubmitting,
}: MemberReviewFormProps) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating_overall: 0,
    metrics: {
      deadlines: 3,
      quality: 3,
      communication: 3,
      teamwork: 3,
      professionalism: 3,
      problem_solving: 3,
    },
    would_work_again: null,
    recommend: null,
    role_played: "",
    commitment_level: "",
    comment: "",
    flags: {
      toxic: false,
      abandoned: false,
      broken_rules: false,
    },
  });

  const [flagsOpen, setFlagsOpen] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const updateMetric = (key: keyof typeof formData.metrics, value: number) => {
    setFormData((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (formData.rating_overall === 0) {
      return;
    }
    await onSubmit(formData);
  };

  const isValid = formData.rating_overall > 0;

  return (
    <Card className="max-w-2xl mx-auto border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 ring-2 ring-primary/20">
              <AvatarImage src={member.profiles.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {getInitials(member.profiles.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{member.profiles.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                @{member.profiles.username}
              </p>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} de {totalMembers}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Avaliação Geral *</Label>
          <StarRating
            value={formData.rating_overall}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, rating_overall: value }))
            }
            size="lg"
          />
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Métricas Detalhadas</Label>
          <div className="grid gap-4">
            <MetricSlider
              label="Cumprimento de Prazos"
              value={formData.metrics.deadlines}
              onChange={(v) => updateMetric("deadlines", v)}
            />
            <MetricSlider
              label="Qualidade do Trabalho"
              value={formData.metrics.quality}
              onChange={(v) => updateMetric("quality", v)}
            />
            <MetricSlider
              label="Comunicação"
              value={formData.metrics.communication}
              onChange={(v) => updateMetric("communication", v)}
            />
            <MetricSlider
              label="Trabalho em Equipa"
              value={formData.metrics.teamwork}
              onChange={(v) => updateMetric("teamwork", v)}
            />
            <MetricSlider
              label="Profissionalismo"
              value={formData.metrics.professionalism}
              onChange={(v) => updateMetric("professionalism", v)}
            />
            <MetricSlider
              label="Resolução de Problemas"
              value={formData.metrics.problem_solving}
              onChange={(v) => updateMetric("problem_solving", v)}
            />
          </div>
        </div>

        {/* Compatibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Voltarias a trabalhar?</Label>
            <ToggleGroup
              type="single"
              value={
                formData.would_work_again === null
                  ? ""
                  : formData.would_work_again
                  ? "yes"
                  : "no"
              }
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  would_work_again: value === "" ? null : value === "yes",
                }))
              }
              className="justify-start"
            >
              <ToggleGroupItem value="yes" className="px-6">
                Sim
              </ToggleGroupItem>
              <ToggleGroupItem value="no" className="px-6">
                Não
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label>Recomendarias?</Label>
            <ToggleGroup
              type="single"
              value={
                formData.recommend === null
                  ? ""
                  : formData.recommend
                  ? "yes"
                  : "no"
              }
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  recommend: value === "" ? null : value === "yes",
                }))
              }
              className="justify-start"
            >
              <ToggleGroupItem value="yes" className="px-6">
                Sim
              </ToggleGroupItem>
              <ToggleGroupItem value="no" className="px-6">
                Não
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Role and Commitment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Papel no Projeto</Label>
            <Select
              value={formData.role_played}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role_played: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleciona o papel" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nível de Compromisso</Label>
            <Select
              value={formData.commitment_level}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, commitment_level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleciona o nível" />
              </SelectTrigger>
              <SelectContent>
                {COMMITMENT_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label>Comentário (opcional)</Label>
          <Textarea
            placeholder="Partilha a tua experiência de colaboração..."
            value={formData.comment}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, comment: e.target.value }))
            }
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.comment.length}/500
          </p>
        </div>

        {/* Flags (Collapsible) */}
        <Collapsible open={flagsOpen} onOpenChange={setFlagsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <AlertTriangle className="w-4 h-4" />
            Reportar Problema
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                flagsOpen ? "rotate-90" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-sm text-muted-foreground">
                Marca se houve problemas graves (confidencial):
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="toxic"
                    checked={formData.flags.toxic}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        flags: { ...prev.flags, toxic: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="toxic" className="text-sm cursor-pointer">
                    Comportamento tóxico
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="abandoned"
                    checked={formData.flags.abandoned}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        flags: { ...prev.flags, abandoned: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="abandoned" className="text-sm cursor-pointer">
                    Abandonou o projeto
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="broken_rules"
                    checked={formData.flags.broken_rules}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        flags: { ...prev.flags, broken_rules: !!checked },
                      }))
                    }
                  />
                  <Label htmlFor="broken_rules" className="text-sm cursor-pointer">
                    Quebrou acordos
                  </Label>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              A guardar...
            </>
          ) : (
            <>
              {currentIndex < totalMembers - 1 ? "Próximo" : "Concluir"}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
