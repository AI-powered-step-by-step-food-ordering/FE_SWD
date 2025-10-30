'use client';

import { create } from 'zustand';

interface UiState {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isLoading: false,
  showLoading: () => set({ isLoading: true }),
  hideLoading: () => set({ isLoading: false }),
}));


