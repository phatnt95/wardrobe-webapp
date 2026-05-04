import api from './api';

export interface LicenseLimits {
  maxItems: number;
  maxOutfits: number;
  aiFeatures: boolean;
  importExport: boolean;
  analytics: boolean;
}

export interface LicenseResponse {
  plan: string;
  status: string;
  startedAt: string;
  expiresAt: string | null;
  limits: LicenseLimits;
}

export interface LicensePlan {
  _id: string;
  name: string;
  displayName: string;
  price: number;
  limits: LicenseLimits;
  isActive: boolean;
}

const licenseService = {
  getMyLicense: (): Promise<LicenseResponse> =>
    api.get('/licenses/me'),

  getPlans: (): Promise<LicensePlan[]> =>
    api.get('/licenses/plans'),

  subscribe: (plan: 'free' | 'pro' | 'premium'): Promise<LicenseResponse> =>
    api.post('/licenses/subscribe', { plan }),
};

export default licenseService;
