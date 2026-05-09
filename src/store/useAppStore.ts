import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

interface AppStore {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  activeCurrencyCode: string;
  setActiveCurrencyCode: (code: string) => void;
  periodType: 'week' | 'month' | 'year';
  setPeriodType: (type: 'week' | 'month' | 'year') => void;
  currentPeriodDate: string;
  setCurrentPeriodDate: (date: string) => void;
  goToPrevPeriod: () => void;
  goToNextPeriod: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      activeCurrencyCode: 'EUR',
      setActiveCurrencyCode: (code) => set({ activeCurrencyCode: code }),
      periodType: 'month',
      setPeriodType: (type) => set({ periodType: type }),
      currentPeriodDate: format(new Date(), 'yyyy-MM-dd'),
      setCurrentPeriodDate: (date) => set({ currentPeriodDate: date }),
      goToPrevPeriod: () => {
        const { periodType, currentPeriodDate } = get();
        const d = new Date(currentPeriodDate + 'T12:00:00');
        if (periodType === 'week') d.setDate(d.getDate() - 7);
        else if (periodType === 'month') d.setMonth(d.getMonth() - 1);
        else d.setFullYear(d.getFullYear() - 1);
        set({ currentPeriodDate: format(d, 'yyyy-MM-dd') });
      },
      goToNextPeriod: () => {
        const { periodType, currentPeriodDate } = get();
        const d = new Date(currentPeriodDate + 'T12:00:00');
        if (periodType === 'week') d.setDate(d.getDate() + 7);
        else if (periodType === 'month') d.setMonth(d.getMonth() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        set({ currentPeriodDate: format(d, 'yyyy-MM-dd') });
      },
      isModalOpen: false,
      setIsModalOpen: (open) => set({ isModalOpen: open }),
    }),
    { name: 'spentrack-ui' }
  )
);
