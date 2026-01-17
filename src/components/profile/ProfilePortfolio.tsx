import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddPortfolioItemDialog } from "./AddPortfolioItemDialog";
import { Briefcase, Plus, ExternalLink, Youtube, Image, Folder } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  type: "screenshot" | "video" | "link";
  url: string;
  thumbnail_url: string | null;
  project_name: string | null;
}

interface ProfilePortfolioProps {
  items: PortfolioItem[];
  isOwnProfile: boolean;
  onItemAdded: () => void;
}

export const ProfilePortfolio = ({
  items,
  isOwnProfile,
  onItemAdded,
}: ProfilePortfolioProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'screenshot':
        return Image;
      case 'video':
        return Youtube;
      default:
        return ExternalLink;
    }
  };

  if (items.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <Card className="p-6 space-y-5 border-border/50 hover:border-primary/10 transition-colors animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-foreground">Portfolio</h3>
        </div>
        {isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5 hover:bg-primary/5"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Folder className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Portfolio vazio</p>
          <p className="text-xs text-muted-foreground">
            Adiciona trabalhos para mostrar as tuas habilidades
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="group border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer bg-card"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative flex items-center justify-center">
                  {item.type === "screenshot" ? (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="p-4 rounded-full bg-background/80 shadow-lg">
                      <TypeIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-white text-sm font-medium">Ver detalhes</span>
                  </div>
                </div>
                <div className="p-3.5">
                  <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  {item.project_name && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.project_name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddPortfolioItemDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onItemAdded={onItemAdded}
      />

      <Dialog
        open={!!selectedItem}
        onOpenChange={() => setSelectedItem(null)}
      >
        <DialogContent className="max-w-4xl">
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
                {selectedItem.project_name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.project_name}
                  </p>
                )}
              </div>

              {selectedItem.type === "screenshot" && (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full rounded-lg"
                />
              )}

              {selectedItem.type === "video" && (
                <div className="aspect-video">
                  {getYouTubeEmbedUrl(selectedItem.url) && (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedItem.url)!}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  {getVimeoEmbedUrl(selectedItem.url) && (
                    <iframe
                      src={getVimeoEmbedUrl(selectedItem.url)!}
                      className="w-full h-full rounded-lg"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              )}

              {selectedItem.type === "link" && (
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visitar Link
                </a>
              )}

              {selectedItem.description && (
                <p className="text-muted-foreground">{selectedItem.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
