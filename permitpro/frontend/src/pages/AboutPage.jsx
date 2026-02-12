import { Building2, Users, Clock, DollarSign } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Vision */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Our Vision</h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Building permit review is one of the last major bottlenecks in construction.
            Architects wait weeks for feedback. Cities are overwhelmed with submissions.
            Rejection rates are high because plans arrive with preventable errors.
          </p>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            PermitPro exists to solve both sides of this problem — helping professionals
            submit better plans, and helping governments review them faster.
          </p>
        </div>

        {/* Problem / Solution */}
        <div className="mt-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">The Problem</h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                Average permit review takes 4-12 weeks in most jurisdictions
              </li>
              <li className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                Each rejection cycle costs thousands in delays and re-design
              </li>
              <li className="flex items-start gap-3">
                <Users className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                Building departments are understaffed and backlogged
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Our Solution</h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                AI pre-review catches errors before submission
              </li>
              <li className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                Structured, auditable analysis for transparency
              </li>
              <li className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                Built to scale into a tool cities can deploy themselves
              </li>
            </ul>
          </div>
        </div>

        {/* Government angle */}
        <div className="mt-16 bg-brand-50 rounded-2xl p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-brand-900">For Government</h2>
          <p className="mt-4 text-brand-800 leading-relaxed">
            PermitPro is designed from the ground up for eventual adoption by cities and counties.
            Our analysis pipeline produces auditable, explainable results — not black-box decisions.
            Every compliance flag references a specific code section. Every recommendation is traceable.
          </p>
          <p className="mt-4 text-brand-800 leading-relaxed">
            We envision a future where building departments can offer PermitPro as a pre-submission
            tool to applicants, dramatically reducing the number of incomplete or non-compliant
            submissions that enter the review queue.
          </p>
          <div className="mt-6">
            <a
              href="mailto:government@permitpro.ai"
              className="inline-block bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 transition"
            >
              Government Partnerships
            </a>
          </div>
        </div>

        {/* Affordability */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Affordable by Design</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Permit delays disproportionately hurt small builders and homeowners. Our free tier
            ensures that anyone can get basic plan review feedback. Our paid tiers are priced
            to be accessible to solo practitioners, not just large firms.
          </p>
        </div>
      </div>
    </div>
  );
}
