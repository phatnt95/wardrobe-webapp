import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Shield, Loader2 } from 'lucide-react';
import { PlanCard } from '../components/subscription/PlanCard';
import { PlanComparisonTable } from '../components/subscription/PlanComparisonTable';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { useLicenseStore } from '../store/useLicenseStore';
import toast from 'react-hot-toast';

export const SubscriptionPage = () => {
  const {
    license,
    plans,
    isLoading,
    fetchLicense,
    fetchPlans,
    subscribe,
  } = useLicenseStore();

  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchLicense();
    fetchPlans();
  }, [fetchLicense, fetchPlans]);

  const handleUpgrade = (planName: string) => {
    setUpgradeTarget(planName);
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeTarget) return;
    setIsUpgrading(true);
    try {
      await subscribe(upgradeTarget as 'free' | 'pro' | 'premium');
      toast.success(
        `Successfully switched to ${upgradeTarget.charAt(0).toUpperCase() + upgradeTarget.slice(1)} plan!`,
      );
      setUpgradeTarget(null);
    } catch {
      toast.error('Failed to change plan. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const targetPlanObj = plans.find((p) => p.name === upgradeTarget);

  const statusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  if (isLoading && !license) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500 mt-1">
          Manage your plan and unlock premium features
        </p>
      </div>

      {/* Current Plan Banner */}
      {license && (
        <div className="bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-2xl border border-primary-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Current Plan
                </p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {license.plan}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor[license.status] || statusColor.active}`}
              >
                <Shield className="w-3.5 h-3.5" />
                {license.status.charAt(0).toUpperCase() +
                  license.status.slice(1)}
              </span>

              {/* Expiry */}
              {license.expiresAt && (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  Expires{' '}
                  {new Date(license.expiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Usage Summary */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Items</p>
              <p className="text-lg font-bold text-gray-800">
                {license.limits.maxItems === -1
                  ? '∞'
                  : license.limits.maxItems}
              </p>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Outfits</p>
              <p className="text-lg font-bold text-gray-800">
                {license.limits.maxOutfits === -1
                  ? '∞'
                  : license.limits.maxOutfits}
              </p>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">AI Styling</p>
              <p className="text-lg font-bold">
                {license.limits.aiFeatures ? (
                  <span className="text-emerald-600">On</span>
                ) : (
                  <span className="text-gray-400">Off</span>
                )}
              </p>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Import/Export</p>
              <p className="text-lg font-bold">
                {license.limits.importExport ? (
                  <span className="text-emerald-600">On</span>
                ) : (
                  <span className="text-gray-400">Off</span>
                )}
              </p>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Analytics</p>
              <p className="text-lg font-bold">
                {license.limits.analytics ? (
                  <span className="text-emerald-600">On</span>
                ) : (
                  <span className="text-gray-400">Off</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Choose a Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              isCurrentPlan={license?.plan === plan.name}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            Compare Plans
          </h2>
          <PlanComparisonTable
            plans={plans}
            currentPlan={license?.plan || 'free'}
          />
        </div>
      )}

      {/* Upgrade Modal */}
      {targetPlanObj && (
        <UpgradeModal
          targetPlan={targetPlanObj.name}
          targetPlanDisplayName={targetPlanObj.displayName}
          targetPrice={targetPlanObj.price}
          isOpen={!!upgradeTarget}
          isLoading={isUpgrading}
          onClose={() => setUpgradeTarget(null)}
          onConfirm={handleConfirmUpgrade}
        />
      )}
    </div>
  );
};
