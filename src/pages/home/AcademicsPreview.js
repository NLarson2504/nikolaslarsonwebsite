import React from 'react';
import { GraduationCap } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';

const AcademicsPreview = () => {
  return (
    <section 
      id="academics"
      className="academics-preview h-[650px] bg-dark-950 border-t border-white/5"
    >
      <div className="h-full flex">
        {/* Left Half - Visual Background */}
        <div className="w-1/2">
          <VisBackgroundComponent className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">🎓</div>
              <h3 className="text-2xl font-heading font-bold text-white/30">
                Academic Excellence
              </h3>
              <p className="text-white/20 font-sans">
                Research & Education
              </p>
            </div>
          </VisBackgroundComponent>
        </div>

        {/* Right Half - Feature Container */}
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md">
            <FeatureContainer
              categoryIcon={GraduationCap}
              category="Academics"
              title="Research & Educational Projects"
              description="Academic research in computer science, machine learning, and software engineering. Contributing to educational initiatives, publishing research papers, and mentoring students in technology fields."
              link="/academics"
              linkTitle="View Academic Work"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AcademicsPreview;