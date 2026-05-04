import { Check, X, Sparkles, Crown, Zap } from 'lucide-react';
import type { LicensePlan } from '../../services/licenseService';

interface PlanCardProps {
  plan: LicensePlan;
  isCurrentPlan: boolean;
  onUpgrade: (planName: string) => void;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="w-8 h-8" />,
  pro: <Sparkles className="w-8 h-8" />,
  premium: <Crown className="w-8 h-8" />,
};

const planGradients: Record<string, string> = {
  free: 'from-slate-500 to-slate-600',
  pro: 'from-violet-500 to-indigo-600',
  premium: 'from-amber-500 to-orange-600',
};

const planGlows: Record<string, string> = {
  free: '',
  pro: 'shadow-violet-200/50',
  premium: 'shadow-amber-200/50',
};

export const PlanCard = ({ plan, isCurrentPlan, onUpgrade }: PlanCardProps) => {
  const features = [
    {
      label: 'Items',
      value:
        plan.limits.maxItems === -1
          ? 'Unlimited'
          : `Up to ${plan.limits.maxItems}`,
      enabled: true,
    },
    {
      label: 'Outfits',
      value:
        plan.limits.maxOutfits === -1
          ? 'Unlimited'
          : `Up to ${plan.limits.maxOutfits}`,
      enabled: true,
    },
    { label: 'AI Styling', value: '', enabled: plan.limits.aiFeatures },
    { label: 'Import / Export', value: '', enabled: plan.limits.importExport },
    { label: 'Analytics', value: '', enabled: plan.limits.analytics },
  ];

  return (
    <div
      className={`relative rounded-2xl bg-white border-2 transition-all duration-300 hover:-translate-y-1 ${
        isCurrentPlan
          ? 'border-primary-500 shadow-xl ' + planGlows[plan.name]
          : plan.name === 'pro'
            ? 'border-violet-200 shadow-lg hover:shadow-xl ' + planGlows[plan.name]
            : 'border-gray-100 shadow-md hover:shadow-lg'
      }`}
    >
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-500 text-white shadow-md">
            Current Plan
          </span>
        </div>
      )}

      {/* Popular Badge for Pro */}
      {plan.name === 'pro' && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md">
            ✨ Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`px-6 pt-8 pb-6 rounded-t-2xl bg-gradient-to-br ${planGradients[plan.name]} text-white`}>
        <div className="flex items-center gap-3 mb-3">
          {planIcons[plan.name]}
          <h3 className="text-2xl font-bold">{plan.displayName}</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold">${plan.price}</span>
          {plan.price > 0 && (
            <span className="text-white/70 text-sm font-medium">/month</span>
          )}
          {plan.price === 0 && (
            <span className="text-white/70 text-sm font-medium">forever</span>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-6">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-center gap-3">
              {feature.enabled ? (
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </div>
              )}
              <span
                className={`text-sm ${
                  feature.enabled
                    ? 'text-gray-700 font-medium'
                    : 'text-gray-400'
                }`}
              >
                {feature.label}
                {feature.value && (
                  <span className="text-gray-500 ml-1">— {feature.value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="px-6 pb-6">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-not-allowed"
          >
            Your Current Plan
          </button>
        ) : (
          <button
            onClick={() => onUpgrade(plan.name)}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              plan.name === 'free'
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : `bg-gradient-to-r ${planGradients[plan.name]} text-white hover:shadow-lg active:scale-[0.98]`
            }`}
          >
            {plan.price === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.displayName}`}
          </button>
        )}
      </div>
    </div>
  );
};
