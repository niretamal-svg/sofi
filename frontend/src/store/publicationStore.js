import { create } from 'zustand';

export const usePublicationStore = create((set) => ({
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

  reset: () =>
    set({
      selectedVacancy: null,
      selectedProfile: null,
      selectedCountries: [],
      selectedPortals: [],
      campaign: null,
      currentStep: 1,
    }),
}));
