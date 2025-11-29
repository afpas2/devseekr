import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineStatus {
  [userId: string]: boolean;
}

export const useOnlineStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });

    // Create presence channel
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online: OnlineStatus = {};
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as Array<any>;
          if (presences && presences.length > 0) {
            presences.forEach((presence: any) => {
              if (presence.user_id) {
                online[presence.user_id] = true;
              }
            });
          }
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presences = newPresences as Array<any>;
        setOnlineUsers((prev) => {
          const updated = { ...prev };
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              updated[presence.user_id] = true;
            }
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presences = leftPresences as Array<any>;
        setOnlineUsers((prev) => {
          const updated = { ...prev };
          presences.forEach((presence: any) => {
            if (presence.user_id) {
              delete updated[presence.user_id];
            }
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ user_id: user.id });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isUserOnline = (userId: string) => {
    return onlineUsers[userId] === true;
  };

  return { onlineUsers, isUserOnline, currentUserId };
};
