import { create } from "zustand";

interface QuizStoreState {
  defaultTab: "take-test" | "generate-quiz";
  setDefaultTab: (tab: "take-test" | "generate-quiz") => void;
}

export const useQuizStore = create<QuizStoreState>((set) => ({
  defaultTab: "take-test",
  setDefaultTab: (tab) => set({ defaultTab: tab }),
}));
