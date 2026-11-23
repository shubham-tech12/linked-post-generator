import React, { useState } from 'react';
import {
  X,
  Check,
  Crown,
  Sparkles,
  Zap,
  CreditCard,
  ShieldCheck,
  Globe,
  ExternalLink,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onUpgradeToPro: () => void;
  onDowngradeToFree: () => void;
  remainingFreeUses: number;
  userEmail?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onUpgradeToPro,
  onDowngradeToFree,
  remainingFreeUses,
  userEmail = '',
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleStripeCheckout = () => {
    const stripeLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK?.trim();

    if (!stripeLink) {
      const demoActivate = window.confirm(
        'Stripe Payment Link (VITE_STRIPE_PAYMENT_LINK) is not added in Vercel yet.\n\nClick OK to test Instant Pro Activation in Demo Mode, or Cancel to configure Stripe first.'
      );
      if (demoActivate) {
        onUpgradeToPro();
      }
      return;
    }

    setIsRedirecting(true);
    const url = new URL(stripeLink);
    if (userEmail) {
      url.searchParams.set('prefilled_email', userEmail);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#111827] border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Globe className="w-3.5 h-3.5" /> Global Creator Plans
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Upgrade Your LinkedIn Growth
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isPro
              ? 'You are currently enjoying Unlimited Pro Creator access!'
              : `You have ${remainingFreeUses} of 3 free AI generations left today.`}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan Card */}
          <div
            className={`rounded-2xl p-6 border flex flex-col justify-between ${
              !isPro
                ? 'bg-[#0B0F19] border-indigo-500/50'
                : 'bg-[#0B0F19]/70 border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-200">Free Starter</h3>
                {!isPro && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Current Plan
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1 my-4">
                <span className="text-3xl font-extrabold text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-300 mt-5">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3 AI Post Generations per day</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live LinkedIn Feed Preview & Formatting</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-Click Copy & Direct LinkedIn Share</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Save up to 5 Draft Posts</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80">
              {isPro ? (
                <button
                  onClick={onDowngradeToFree}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Switch to Free Plan
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/60 text-slate-400 text-sm font-medium cursor-not-allowed"
                >
                  Active Plan
                </button>
              )}
            </div>
          </div>

          {/* Pro Plan Card (Stripe Checkout) */}
          <div className="relative rounded-2xl p-6 bg-gradient-to-b from-indigo-950/60 to-[#0B0F19] border-2 border-indigo-500/70 flex flex-col justify-between shadow-lg shadow-indigo-500/15">
            <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase tracking-wider">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Crown className="w-5 h-5 text-amber-400" /> Pro Creator
                </h3>
                {isPro && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 my-4">
                <span className="text-3xl font-extrabold text-white">$21</span>
                <span className="text-xs text-slate-400">/ month • Cancel anytime</span>
              </div>

              <ul className="space-y-3 text-sm text-slate-200 mt-5">
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> 1-Second AI Post Generations
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Unlimited</strong> 3 Viral Hook Variations
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>One-Click AI Refine (Shorter, Punchier, Stats)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Cloud Saved Posts Library</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5">
              {isPro ? (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition cursor-pointer"
                >
                  ✓ Pro Plan Active — Continue Creating
                </button>
              ) : (
                <>
                  <button
                    onClick={handleStripeCheckout}
                    disabled={isRedirecting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#635BFF] hover:bg-[#5249f5] text-white text-sm font-bold shadow-lg shadow-[#635BFF]/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isRedirecting ? 'Redirecting to Stripe...' : 'Pay $21/mo with Stripe'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cards, Apple Pay & Google Pay supported worldwide</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};