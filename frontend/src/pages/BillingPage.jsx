import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { billingApi } from '../services/api';
import { Check, CreditCard, ExternalLink } from 'lucide-react';

const plans = [
  {
    tier: 'free',
    name: 'Free',
    price: '$0',
    features: ['2 projects', '3 uploads/month', '10 MB files', 'Basic results'],
  },
  {
    tier: 'pro',
    name: 'Professional',
    price: '$79/mo',
    priceId: 'pro_monthly',
    features: ['25 projects', '50 uploads/month', '50 MB files', 'Full reports', 'PDF/JSON download'],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: '$249/mo',
    priceId: 'enterprise_monthly',
    features: ['Unlimited projects', 'Unlimited uploads', '100 MB files', 'Priority support', 'Custom rules', 'API access'],
  },
];

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [billingStatus, setBillingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    billingApi.getStatus()
      .then(setBillingStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Check for success/cancel params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      refreshUser();
    }
  }, [refreshUser]);

  const handleUpgrade = async (priceId) => {
    setActionLoading(priceId);
    try {
      const { url } = await billingApi.createCheckout(priceId);
      window.location.href = url;
    } catch (err) {
      alert(err.message || 'Failed to start checkout');
    } finally {
      setActionLoading('');
    }
  };

  const handleManage = async () => {
    setActionLoading('portal');
    try {
      const { url } = await billingApi.getPortal();
      window.location.href = url;
    } catch (err) {
      alert(err.message || 'Failed to open billing portal');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscription</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="text-xl font-bold text-gray-900 capitalize">{billingStatus?.tier || user?.tier}</div>
            {billingStatus?.status && billingStatus.status !== 'none' && (
              <div className={`text-sm mt-1 ${
                billingStatus.status === 'active' ? 'text-green-600' :
                billingStatus.status === 'past_due' ? 'text-red-600' :
                'text-gray-500'
              }`}>
                Status: {billingStatus.status}
              </div>
            )}
            {billingStatus?.periodEnd && (
              <div className="text-sm text-gray-500 mt-0.5">
                Renews: {new Date(billingStatus.periodEnd).toLocaleDateString()}
              </div>
            )}
          </div>
          {billingStatus?.hasSubscription && (
            <button
              onClick={handleManage}
              disabled={!!actionLoading}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {actionLoading === 'portal' ? 'Opening...' : 'Manage Subscription'}
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = (billingStatus?.tier || user?.tier) === plan.tier;
          return (
            <div
              key={plan.tier}
              className={`rounded-xl border p-6 ${isCurrent ? 'border-brand-600 ring-2 ring-brand-600 bg-brand-50' : 'border-gray-200 bg-white'}`}
            >
              {isCurrent && (
                <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full mb-3">Current</span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-1 text-2xl font-bold text-gray-900">{plan.price}</div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {!isCurrent && plan.priceId && (
                <button
                  onClick={() => handleUpgrade(plan.priceId)}
                  disabled={!!actionLoading}
                  className="mt-6 w-full bg-brand-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
                >
                  {actionLoading === plan.priceId ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        Payments processed securely by Stripe. Cancel or change plans anytime.
      </p>
    </div>
  );
}
