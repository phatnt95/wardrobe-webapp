import { create } from 'zustand';
import licenseService, {
  type LicenseResponse,
  type LicensePlan,
} from '../services/licenseService';

interface LicenseState {
  license: LicenseResponse | null;
  plans: LicensePlan[];
  isLoading: boolean;
  showUpgradePrompt: boolean;
  upgradeMessage: string;
  fetchLicense: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  subscribe: (plan: 'free' | 'pro' | 'premium') => Promise<void>;
  triggerUpgradePrompt: (message: string) => void;
  dismissUpgradePrompt: () => void;
}

export const useLicenseStore = create<LicenseState>((set) => ({
  license: null,
  plans: [],
  isLoading: false,
  showUpgradePrompt: false,
  upgradeMessage: '',

  fetchLicense: async () => {
    try {
      set({ isLoading: true });
      const license = await licenseService.getMyLicense();
      set({ license, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await licenseService.getPlans();
      set({ plans });
    } catch {
      // silently fail
    }
  },

  subscribe: async (plan) => {
    try {
      set({ isLoading: true });
      const license = await licenseService.subscribe(plan);
      set({ license, isLoading: false, showUpgradePrompt: false });
    } catch {
      set({ isLoading: false });
    }
  },

  triggerUpgradePrompt: (message: string) => {
    set({ showUpgradePrompt: true, upgradeMessage: message });
  },

  dismissUpgradePrompt: () => {
    set({ showUpgradePrompt: false, upgradeMessage: '' });
  },
}));
