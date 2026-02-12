import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Try AI plan review with basic limits.',
    features: [
      '2 projects',
      '3 uploads per month',
      '10 MB max file size',
      'Basic compliance flags',
      'Approval readiness score',
    ],
    cta: 'Start Free',
    ctaLink: '/register',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$79',
    period: '/month',
    yearlyPrice: '$790/year (save $158)',
    desc: 'For architects and engineers with active projects.',
    features: [
      '25 projects',
      '50 uploads per month',
      '50 MB max file size',
      'Detailed compliance reports',
      'PDF & JSON report download',
      'Full rule-by-rule breakdown',
      'AI interpretation summary',
    ],
    cta: 'Start Professional',
    ctaLink: '/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$249',
    period: '/month',
    yearlyPrice: '$2,490/year (save $498)',
    desc: 'For firms and government departments.',
    features: [
      'Unlimited projects',
      'Unlimited uploads',
      '100 MB max file size',
      'Everything in Professional',
      'Priority support',
      'Custom rule sets',
      'API access (coming soon)',
      'White-label option',
    ],
    cta: 'Contact Sales',
    ctaLink: '/register',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you need more capacity and detailed reports.
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 flex flex-col ${
                tier.highlight
                  ? 'border-brand-600 ring-2 ring-brand-600 bg-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {tier.highlight && (
                <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full self-start mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500">{tier.period}</span>
              </div>
              {tier.yearlyPrice && (
                <p className="text-sm text-brand-600 mt-1">{tier.yearlyPrice}</p>
              )}
              <p className="mt-3 text-gray-600 text-sm">{tier.desc}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaLink}
                className={`mt-8 block text-center py-3 rounded-lg font-semibold text-sm transition ${
                  tier.highlight
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need a custom plan for your municipality or large firm?{' '}
            <a href="mailto:sales@permitpro.ai" className="text-brand-600 font-medium hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
