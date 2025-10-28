import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import MobileDetail from '../../components/MobileDetail';
import MobileDiagram from '../../diagrams/MobileDiagram';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import { mobileAppsData } from '../../data/projectsData';
import { ReactComponent as MobileIllustration } from '../../assets/images/Mobile.svg';

const Mobile = () => {

  return (
    <PageTemplate className="mobile-page">
      {/* Full Page Landing Section */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Half - Title and Description */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-16 pt-24 pb-12 md:py-12">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 md:mb-8 text-dark-50">Mobile Development</h1>
          <p className="text-lg md:text-2xl text-dark-300 font-sans leading-relaxed">
            Creating exceptional mobile experiences that engage users and drive business growth
            across iOS and Android platforms.
          </p>
        </div>

        {/* Right Half - Visualization with Striped Background */}
        <div className="w-full md:w-1/2 min-h-[300px] md:min-h-0">
          <VisBackgroundComponent className="h-full bg-gradient-to-br from-dark-900/80 to-dark-800/80">
            <MobileIllustration className="w-full h-full" style={{ maxWidth: 'none', width: '100%', height: '100%' }} />
          </VisBackgroundComponent>
        </div>
      </div>

      {/* Mobile Portfolio Section */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20 -mt-80 md:mt-0 md:py-20">
        {/* Mobile Portfolio Gallery */}
        <div className="flex justify-center mb-20">
          <MobileDiagram className="w-full max-w-4xl" />
        </div>

        {/* Mobile Apps Details */}
        <div className="grid gap-8 md:gap-12">
          {mobileAppsData.map((app, index) => (
            <MobileDetail
              key={index}
              title={app.title}
              description={app.description}
              platform={app.platform}
              screenshots={app.screenshots}
              features={app.features}
              technologies={app.technologies}
              appStoreUrl={app.appStoreUrl}
              playStoreUrl={app.playStoreUrl}
              icon={app.icon}
              className="max-w-4xl mx-auto"
            />
          ))}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Mobile;