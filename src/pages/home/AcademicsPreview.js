import React from 'react';
import { GraduationCap } from 'lucide-react';
import FeatureContainer from '../../components/FeatureContainer';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import tempSvg from '../../assets/temp.svg';

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
            <img 
              src={tempSvg} 
              alt="Academic visualization" 
              className="w-full h-full object-contain"
            />
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