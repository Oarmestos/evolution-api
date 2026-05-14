import { create } from 'zustand';
import axios from 'axios';

interface Statistics {
  totalMessages: number;
  totalSales: number;
  totalLeads: number;
  activeInstances: number;
  period: string;
}

interface StatisticsState {
  stats: Statistics | null;
  loading: boolean;
  error: string | null;
  fetchStats: (instanceName?: string) => Promise<void>;
}

export const useStatisticsStore = create<StatisticsState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async (instanceName?: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const url = instanceName 
        ? `/statistics/summary/${instanceName}` 
        : '/statistics/summary';
      
      const response = await axios.get(url, {
        headers: { apikey: token }
      });

      set({ stats: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));
