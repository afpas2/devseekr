import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  requester?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  addressee?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export const useFriendships = () => {
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendships();
    
    const channel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        () => {
          loadFriendships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadFriendships = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, full_name, avatar_url),
          addressee:profiles!friendships_addressee_id_fkey(id, username, full_name, avatar_url)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const accepted = (data?.filter(f => f.status === 'accepted') || []) as Friendship[];
      const pending = (data?.filter(f => f.status === 'pending' && f.addressee_id === user.id) || []) as Friendship[];

      setFriendships(accepted);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error loading friendships:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification
      const { data: profiles } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        recipient_id: addresseeId,
        sender_id: user.id,
        type: 'friend_request',
        message: `${profiles?.username} enviou-te um pedido de amizade`
      });

      await loadFriendships();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const acceptFriendRequest = async (friendshipId: string, requesterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;

      // Create notification
      const { data: profiles } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        recipient_id: requesterId,
        sender_id: user.id,
        type: 'friend_request_accepted',
        message: `${profiles?.username} aceitou o teu pedido de amizade`
      });

      await loadFriendships();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', friendshipId);

      if (error) throw error;

      await loadFriendships();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      await loadFriendships();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    friendships,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  };
};