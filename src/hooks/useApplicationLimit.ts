import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserPlan } from './useUserPlan';

interface UseApplicationLimitReturn {
  applicationsThisMonth: number;
  maxApplications: number;
  canApply: boolean;
  isLoading: boolean;
  incrementApplicationCount: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useApplicationLimit(): UseApplicationLimitReturn {
  const { isPremium, isLoading: planLoading } = useUserPlan();
  const [applicationsThisMonth, setApplicationsThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const maxApplications = isPremium ? Infinity : 3;

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('applications_count, last_application_reset')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        const lastReset = profile.last_application_reset 
          ? new Date(profile.last_application_reset) 
          : new Date();
        const now = new Date();

        // Check if we need to reset (new month)
        if (lastReset.getMonth() !== now.getMonth() || 
            lastReset.getFullYear() !== now.getFullYear()) {
          // Reset count for new month
          await supabase
            .from('profiles')
            .update({ 
              applications_count: 0, 
              last_application_reset: now.toISOString() 
            })
            .eq('id', user.id);
          setApplicationsThisMonth(0);
        } else {
          setApplicationsThisMonth(profile.applications_count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading application limit:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!planLoading) {
      loadData();
    }
  }, [loadData, planLoading]);

  const incrementApplicationCount = useCallback(async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const newCount = applicationsThisMonth + 1;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          applications_count: newCount,
          last_application_reset: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setApplicationsThisMonth(newCount);
      return true;
    } catch (error) {
      console.error('Error incrementing application count:', error);
      return false;
    }
  }, [applicationsThisMonth]);

  const canApply = isPremium || applicationsThisMonth < maxApplications;

  return {
    applicationsThisMonth,
    maxApplications,
    canApply,
    isLoading: isLoading || planLoading,
    incrementApplicationCount,
    refetch: loadData,
  };
}
