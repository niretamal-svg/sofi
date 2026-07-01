import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePublicationStore = create(
  persist(
    (set) => ({
      selectedVacancy: null,
      setSelectedVacancy: (vacancy) => set({ selectedVacancy: vacancy }),

      selectedProfile: null,
      setSelectedProfile: (profile) => set({ selectedProfile: profile }),

      selectedCountries: [],
      setSelectedCountries: (countries) => set({ selectedCountries: countries }),

      selectedPortals: [],
      togglePortal: (portal) =>
        set((state) => {
          const exists = state.selectedPortals.find((p) => p.id === portal.id);
          if (exists) {
            return {
              selectedPortals: state.selectedPortals.filter((p) => p.id !== portal.id),
            };
          } else {
            return {
              selectedPortals: [...state.selectedPortals, portal],
            };
          }
        }),

      campaign: null,
      setCampaign: (campaign) => set({ campaign }),

      currentStep: 1,
      setStep: (step) => set({ currentStep: step }),

      draftProfile: null,
      setDraftProfile: (draft) => set({ draftProfile: draft }),

      aiSuggestions: [],
      setAiSuggestions: (suggestions) => set({ aiSuggestions: suggestions }),

      reset: () =>
        set({
          selectedVacancy: null,
          selectedProfile: null,
          selectedCountries: [],
          selectedPortals: [],
          campaign: null,
          currentStep: 1,
          draftProfile: null,
          aiSuggestions: [],
        }),
    }),
    {
      name: 'sofi-publication-store', // unique name for the local storage key
    }
  )
);
