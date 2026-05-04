import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  targetPlan: string;
  targetPlanDisplayName: string;
  targetPrice: number;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const UpgradeModal = ({
  targetPlan,
  targetPlanDisplayName,
  targetPrice,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: UpgradeModalProps) => {
  if (!isOpen) return null;

  const isDowngrade = targetPlan === 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 text-gray-800">
            <ShieldCheck className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-bold">
              {isDowngrade ? 'Downgrade Plan' : 'Upgrade Plan'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {isDowngrade ? 'Switch to' : 'New plan'}
              </span>
              <span className="text-lg font-bold text-gray-800">
                {targetPlanDisplayName}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">Price</span>
              <span className="text-lg font-bold text-gray-800">
                ${targetPrice}
                {targetPrice > 0 && (
                  <span className="text-sm font-normal text-gray-400">
                    /month
                  </span>
                )}
              </span>
            </div>
            {!isDowngrade && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm font-medium text-gray-700">
                  30 days
                </span>
              </div>
            )}
          </div>

          {isDowngrade && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
              ⚠️ Downgrading will reduce your plan limits. You may lose access to
              some features.
            </p>
          )}

          <p className="text-sm text-gray-500 text-center">
            {isDowngrade
              ? 'Are you sure you want to downgrade?'
              : 'Your plan will be activated immediately.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 ${
              isDowngrade
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-gradient-to-r from-violet-500 to-indigo-600 hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : isDowngrade ? (
              'Confirm Downgrade'
            ) : (
              'Confirm Upgrade'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
