import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserPlan = 'freemium' | 'premium';

interface PlanLimits {
  maxProjectsPerMonth: number;
  maxMembersPerProject: number;
  maxCallDurationMinutes: number;
}

const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  freemium: {
    maxProjectsPerMonth: 2,
    maxMembersPerProject: Infinity,
    maxCallDurationMinutes: 15,
  },
  premium: {
    maxProjectsPerMonth: Infinity,
    maxMembersPerProject: Infinity,
    maxCallDurationMinutes: Infinity,
  },
};

interface Subscription {
  id: string;
  plan: UserPlan;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  payment_method: string | null;
}

interface UseUserPlanReturn {
  plan: UserPlan;
  isPremium: boolean;
  limits: PlanLimits;
  subscription: Subscription | null;
  projectsCreatedThisMonth: number;
  canCreateProject: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useUserPlan(): UseUserPlanReturn {
  const [plan, setPlan] = useState<UserPlan>('freemium');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [projectsCreatedThisMonth, setProjectsCreatedThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Carregar subscrição
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subData) {
      const isActive = subData.status === 'active';
      const isNotExpired = !subData.expires_at || new Date(subData.expires_at) > new Date();
      
      if (isActive && isNotExpired && subData.plan === 'premium') {
        setPlan('premium');
        setSubscription(subData as Subscription);
      } else {
        setPlan('freemium');
        setSubscription(null);
      }
    } else {
      setPlan('freemium');
      setSubscription(null);
    }

    // Contar projetos criados este mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    setProjectsCreatedThisMonth(count || 0);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const limits = PLAN_LIMITS[plan];
  const canCreateProject = plan === 'premium' || projectsCreatedThisMonth < limits.maxProjectsPerMonth;
  const isPremium = plan === 'premium';

  return {
    plan,
    isPremium,
    limits,
    subscription,
    projectsCreatedThisMonth,
    canCreateProject,
    isLoading,
    refetch: loadData,
  };
}
