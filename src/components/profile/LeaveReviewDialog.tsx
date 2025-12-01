import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Loader2 } from "lucide-react";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  project_id: z.string().min(1, "Selecione um projeto"),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface LeaveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewedUserId: string;
  sharedProjects: Array<{ id: string; name: string }>;
  onReviewSubmitted: () => void;
}

export const LeaveReviewDialog = ({
  open,
  onOpenChange,
  reviewedUserId,
  sharedProjects,
  onReviewSubmitted,
}: LeaveReviewDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      project_id: "",
    },
  });

  const watchRating = form.watch("rating");

  const onSubmit = async (data: ReviewForm) => {
    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilizador não autenticado");

      const { error } = await supabase.from("user_reviews").insert({
        reviewer_id: user.id,
        reviewed_id: reviewedUserId,
        project_id: data.project_id,
        rating: data.rating,
        comment: data.comment || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Review submetida com sucesso.",
      });

      form.reset();
      onReviewSubmitted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erro",
        description:
          error.message === 'duplicate key value violates unique constraint "user_reviews_reviewer_id_reviewed_id_project_id_key"'
            ? "Já submeteu uma review para este utilizador neste projeto."
            : "Não foi possível submeter a review.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deixar Review</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avaliação</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => field.onChange(i + 1)}
                          onMouseEnter={() => setHoverRating(i + 1)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              i < (hoverRating || watchRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-muted text-muted"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sharedProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Partilhe a sua experiência..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submeter Review
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
