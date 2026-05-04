import { Check, X } from 'lucide-react';
import type { LicensePlan } from '../../services/licenseService';

interface PlanComparisonTableProps {
  plans: LicensePlan[];
  currentPlan: string;
}

const featureRows = [
  { key: 'maxItems', label: 'Items', type: 'count' as const },
  { key: 'maxOutfits', label: 'Outfits', type: 'count' as const },
  { key: 'aiFeatures', label: 'AI Styling & OOTD', type: 'boolean' as const },
  { key: 'importExport', label: 'Import / Export', type: 'boolean' as const },
  { key: 'analytics', label: 'Analytics Dashboard', type: 'boolean' as const },
];

export const PlanComparisonTable = ({
  plans,
  currentPlan,
}: PlanComparisonTableProps) => {
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  const formatValue = (
    plan: LicensePlan,
    key: string,
    type: 'count' | 'boolean',
  ) => {
    const value = (plan.limits as any)[key];
    if (type === 'count') {
      return value === -1 ? '∞' : value.toString();
    }
    return value ? (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-gray-300 mx-auto" />
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs tracking-wider">
              Feature
            </th>
            {sortedPlans.map((plan) => (
              <th
                key={plan.name}
                className={`px-5 py-4 text-center font-bold ${
                  plan.name === currentPlan
                    ? 'text-primary-600 bg-primary-50/40'
                    : 'text-gray-700'
                }`}
              >
                <span className="block text-base">{plan.displayName}</span>
                <span className="block text-xs font-normal text-gray-400 mt-0.5">
                  ${plan.price}/mo
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {featureRows.map((row) => (
            <tr
              key={row.key}
              className="hover:bg-gray-50/50 transition-colors"
            >
              <td className="px-5 py-3.5 text-gray-600 font-medium">
                {row.label}
              </td>
              {sortedPlans.map((plan) => (
                <td
                  key={plan.name}
                  className={`px-5 py-3.5 text-center font-semibold ${
                    plan.name === currentPlan
                      ? 'bg-primary-50/20 text-primary-700'
                      : 'text-gray-700'
                  }`}
                >
                  {formatValue(plan, row.key, row.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
