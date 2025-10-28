import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import SiteDetail from '../../components/SiteDetail';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import { sitesData } from '../../data/projectsData';
import { ReactComponent as DesignIllustration } from '../../assets/images/DesignIllustration.svg';

const Design = () => {

  return (
    <PageTemplate className="design-page">
      {/* Full Page Landing Section */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Half - Title and Description */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-16 pt-24 pb-12 md:py-12">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 md:mb-8 text-dark-50">Web Design & Development</h1>
          <p className="text-lg md:text-2xl text-dark-300 font-sans leading-relaxed">
            Creating beautiful, functional, and user-centered digital experiences
            that drive engagement and deliver results.
          </p>
        </div>

        {/* Right Half - Visualization with Striped Background */}
        <div className="w-full md:w-1/2 min-h-[300px] md:min-h-0">
          <VisBackgroundComponent className="h-full bg-gradient-to-br from-dark-900/80 to-dark-800/80">
            <DesignIllustration className="w-full h-full" style={{ maxWidth: 'none', width: '80%', height: '80%' }} />
          </VisBackgroundComponent>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Sites Details */}
        <div className="grid gap-8 md:gap-12 mb-20">
          {sitesData.map((site, index) => (
            <SiteDetail
              key={index}
              title={site.title}
              description={site.description}
              url={site.url}
              repositoryUrl={site.repositoryUrl}
              image={site.image}
              features={site.features}
              technologies={site.technologies}
              category={site.category}
              status={site.status}
              className="max-w-4xl mx-auto"
            />
          ))}
        </div>

        {/* Design Philosophy */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-heading font-bold text-dark-50 mb-8">
            Design Philosophy
          </h2>
          <p className="text-xl text-dark-300 mb-12 font-sans">
            Every design decision is made with purpose, considering user needs,
            business goals, and technical constraints to deliver exceptional experiences.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">User-Centered</h3>
              <p className="text-dark-300">
                Research-driven designs that prioritize user needs and behaviors
                to create intuitive experiences.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">Responsive</h3>
              <p className="text-dark-300">
                Adaptive layouts that work seamlessly across all devices
                and screen sizes.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-heading font-bold text-dark-50 mb-4">Performance</h3>
              <p className="text-dark-300">
                Optimized designs that load fast and provide smooth
                interactions for better user satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Design;