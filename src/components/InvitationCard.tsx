import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface InvitationCardProps {
  invitation: {
    id: string;
    message: string | null;
    projects: {
      name: string;
      genre: string;
    };
    profiles: {
      username: string;
    };
  };
  onAccept: () => void;
  onDecline: () => void;
}

export const InvitationCard = ({
  invitation,
  onAccept,
  onDecline,
}: InvitationCardProps) => {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <p className="font-semibold">{invitation.projects.name}</p>
        <p className="text-sm text-muted-foreground">
          from @{invitation.profiles.username}
        </p>
        {invitation.message && (
          <p className="text-sm mt-2 text-muted-foreground italic">
            "{invitation.message}"
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onAccept}
          className="flex-1 bg-gradient-primary hover:opacity-90"
        >
          <Check className="w-4 h-4 mr-1" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDecline}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-1" />
          Decline
        </Button>
      </div>
    </Card>
  );
};
