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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const portfolioItemSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["screenshot", "video", "link"]),
  url: z.string().optional(),
  project_name: z.string().optional(),
});

type PortfolioItemForm = z.infer<typeof portfolioItemSchema>;

interface AddPortfolioItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
}

export const AddPortfolioItemDialog = ({
  open,
  onOpenChange,
  onItemAdded,
}: AddPortfolioItemDialogProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<PortfolioItemForm>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "screenshot",
      url: "",
      project_name: "",
    },
  });

  const watchType = form.watch("type");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const onSubmit = async (data: PortfolioItemForm) => {
    try {
      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilizador não autenticado");

      let imageUrl = data.url || "";

      if (data.type === "screenshot" && imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("user_portfolio_items").insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type: data.type,
        url: imageUrl,
        project_name: data.project_name || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao portfolio.",
      });

      form.reset();
      setImageFile(null);
      onItemAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item ao portfolio.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar ao Portfolio</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="screenshot">Screenshot</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do projeto ou item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o projeto..."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === "screenshot" && (
              <div>
                <FormLabel>Imagem</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2"
                />
              </div>
            )}

            {(watchType === "video" || watchType === "link") && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {watchType === "video" ? "URL do Vídeo" : "URL do Link"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          watchType === "video"
                            ? "https://youtube.com/watch?v=..."
                            : "https://..."
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="project_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projeto (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: RPG Adventure" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
