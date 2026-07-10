import React, { useState } from 'react';

/**
 * A short, wide "marquee" band of the companies Nik has worked for. Each cell
 * shows the company (logo, or a text wordmark), and flips like a 3D prism on
 * hover to reveal the role and a two-line description of what the company does.
 *
 * Logos are referenced from /public/assets/icons by path, so a missing file
 * degrades gracefully to the text wordmark (via onError) instead of breaking
 * the build. To add a real logo: drop a transparent PNG in
 * public/assets/icons/ using the exact filename below.
 *
 * Data is from the Notion Experience DB.
 */
// `logoScale` balances the visual size of each logo (they have different
// intrinsic proportions and padding). 1 = base size (max-h-12); tune per logo.
const companies = [
  {
    name: 'Fidelity',
    logo: '/assets/icons/fidelity.png',
    logoScale: 1.25,
    role: 'Applied Technology Intern',
    blurb:
      'One of the world’s largest financial-services firms, managing trillions in assets across brokerage, retirement, and wealth management.',
  },
  {
    name: 'Tarragon Systems',
    logo: '/assets/icons/tarragontext.png', // text version, marquee-only (brand keeps tarragonlogo.jpg)
    logoScale: 0.65,
    role: 'Junior Software Developer',
    blurb:
      'A restaurant-operations platform that automates invoicing, menu costing, and demand forecasting for restaurant groups.',
  },
  {
    name: 'Z9 Security',
    logo: '/assets/icons/z9.png',
    logoScale: 1.25,
    role: 'Software Intern',
    blurb:
      'An access-control company building open, cloud-managed platforms for modern building security and physical access.',
  },
  {
    name: 'MTU Aero Engines',
    logo: '/assets/icons/mtu.png',
    logoScale: 1,
    role: 'Student Intern',
    blurb:
      'Germany’s leading aircraft-engine manufacturer, developing and producing commercial and military propulsion systems.',
  },
];

const ExperienceMarquee = () => {
  return (
    <section
      id="experience"
      className="experience-marquee bg-dark-950 border-t border-white/5"
    >
      <div className="grid grid-cols-2 md:grid-cols-4">
        {companies.map((company) => (
          <CompanyCell key={company.name} company={company} />
        ))}
      </div>
    </section>
  );
};

const CompanyCell = ({ company }) => {
  // Show the logo when present; if the file is missing (404), fall back to the
  // text wordmark so the cell never renders a broken image.
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(company.logo) && !logoFailed;

  return (
    <div className="marquee-cell group border-b border-white/5 md:border-b-0 md:border-r md:last:border-r-0 border-white/5">
      <div className="marquee-prism">
        {/* Front face — logo / wordmark */}
        <div className="marquee-face marquee-face--front flex items-center justify-center px-6 bg-dark-950">
          {showLogo ? (
            <img
              src={company.logo}
              alt={company.name}
              onError={() => setLogoFailed(true)}
              style={{ maxHeight: `${3 * (company.logoScale || 1)}rem` }}
              className="marquee-logo max-w-[78%] object-contain"
            />
          ) : (
            <span className="font-heading font-bold text-xl md:text-2xl text-dark-100 text-center leading-tight">
              {company.name}
            </span>
          )}
        </div>

        {/* Bottom face — role + blurb (rolls up into view on hover) */}
        <div className="marquee-face marquee-face--bottom flex flex-col items-center justify-center px-10 md:px-12 text-center bg-dark-900">
          <h3 className="font-heading font-bold text-base md:text-lg text-dark-50 leading-tight mb-2">
            {company.role}
          </h3>
          <p className="text-xs md:text-sm text-dark-300 leading-snug line-clamp-2">
            {company.blurb}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExperienceMarquee;
