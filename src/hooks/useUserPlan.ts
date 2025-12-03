import { useState, useEffect } from 'react';
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
    maxMembersPerProject: 3,
    maxCallDurationMinutes: 15,
  },
  premium: {
    maxProjectsPerMonth: Infinity,
    maxMembersPerProject: Infinity,
    maxCallDurationMinutes: Infinity,
  },
};

interface UseUserPlanReturn {
  plan: UserPlan;
  limits: PlanLimits;
  projectsCreatedThisMonth: number;
  canCreateProject: boolean;
  isLoading: boolean;
}

export function useUserPlan(): UseUserPlanReturn {
  const [plan] = useState<UserPlan>('freemium'); // Por agora, todos são freemium
  const [projectsCreatedThisMonth, setProjectsCreatedThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjectCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
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
    };

    loadProjectCount();
  }, []);

  const limits = PLAN_LIMITS[plan];
  const canCreateProject = projectsCreatedThisMonth < limits.maxProjectsPerMonth;

  return {
    plan,
    limits,
    projectsCreatedThisMonth,
    canCreateProject,
    isLoading,
  };
}
