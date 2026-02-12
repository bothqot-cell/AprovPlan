import { Link } from 'react-router-dom';
import { Shield, Zap, FileCheck, TrendingUp, Building, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: FileCheck,
    title: 'AI Plan Analysis',
    desc: 'Upload your floor plans and receive instant compliance feedback against building codes and zoning regulations.',
  },
  {
    icon: Shield,
    title: 'Code Compliance Checks',
    desc: 'Automated checks against IRC standards including setbacks, room dimensions, height limits, and lot coverage.',
  },
  {
    icon: TrendingUp,
    title: 'Approval Readiness Score',
    desc: 'Get a clear score indicating how likely your plans are to pass review — before you submit.',
  },
  {
    icon: Zap,
    title: 'Reduce Rejections',
    desc: 'Catch missing information, code violations, and high-risk rejection indicators early in the process.',
  },
  {
    icon: Building,
    title: 'Government Ready',
    desc: 'Built for eventual adoption by cities and counties to streamline their own permit review workflows.',
  },
  {
    icon: CheckCircle,
    title: 'Downloadable Reports',
    desc: 'Generate PDF and JSON reports to share with clients, consultants, or building departments.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Know if your plans will pass
              <span className="text-brand-200"> before you submit</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-brand-100 leading-relaxed max-w-2xl">
              PermitPro uses AI to review your residential floor plans against building codes and zoning regulations. Get instant feedback, reduce rejections, and accelerate approvals.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="bg-white text-brand-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-50 transition text-center"
              >
                Start Free
              </Link>
              <Link
                to="/pricing"
                className="border border-brand-300 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-600 transition text-center"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-brand-200">No credit card required. 3 free reviews per month.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">How It Works</h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">Three steps to pre-permit confidence</p>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload Plans', desc: 'Upload your PDF or image floor plans to a project workspace.' },
              { step: '2', title: 'AI Analysis', desc: 'Our AI pipeline runs OCR, rule-based checks, and LLM interpretation on your plans.' },
              { step: '3', title: 'Get Results', desc: 'Receive an approval readiness score, compliance flags, and a downloadable report.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {s.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">Built for Professionals</h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">
            Designed for architects, engineers, and developers who need reliable pre-submission review.
          </p>

          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200">
                <f.icon className="h-8 w-8 text-brand-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-brand-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold">Stop guessing. Start knowing.</h2>
          <p className="mt-4 text-brand-100 text-lg">
            Join architects and engineers who review their plans with AI before submitting to building departments.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-block bg-white text-brand-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-50 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
