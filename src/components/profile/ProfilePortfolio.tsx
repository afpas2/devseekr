import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddPortfolioItemDialog } from "./AddPortfolioItemDialog";
import { Briefcase, Plus, ExternalLink, Youtube } from "lucide-react";

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

  if (items.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Briefcase className="w-5 h-5" />
          <h3>Portfolio</h3>
        </div>
        {isOwnProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum item no portfolio ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === "screenshot" && (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {item.type === "video" && (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Youtube className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {item.type === "link" && (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <ExternalLink className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                {item.project_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.project_name}
                  </p>
                )}
              </div>
            </div>
          ))}
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
