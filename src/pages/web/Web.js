import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import SiteDetail from '../../components/SiteDetail';
import VisBackgroundComponent from '../../components/VisBackgroundComponent';
import CollectionState from '../../components/CollectionState';
import ProjectCardLink from '../../components/ProjectCardLink';
import useProjects from '../../hooks/useProjects';
import { ReactComponent as DesignIllustration } from '../../assets/images/DesignIllustration.svg';

const Web = () => {
  const { data: sitesData, loading, error } = useProjects('site');

  return (
    <PageTemplate className="web-page">
      {/* Full Page Landing Section */}
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Left Half - Title and Description */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 md:px-16 pt-24 pb-12 md:py-12">
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 md:mb-8 text-dark-50">Web</h1>
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
      <div className="max-w-6xl mx-auto px-4 pt-0 pb-20 -mt-80 md:mt-0 md:py-20">
        {/* Sites Details */}
        <CollectionState
          loading={loading}
          error={error}
          isEmpty={sitesData.length === 0}
          label="sites"
        />
        <div className="grid gap-8 md:gap-12 mb-20">
          {sitesData.map((site) => (
            <ProjectCardLink key={site.id} project={site} basePath="/web">
              <SiteDetail
                title={site.title}
                description={site.description}
                url={site.url || site.brand?.url}
                repositoryUrl={site.repositoryUrl}
                image={site.image}
                features={site.features}
                technologies={site.technologies}
                category={site.category}
                status={site.status}
                className="max-w-4xl mx-auto"
              />
            </ProjectCardLink>
          ))}
        </div>
      </div>
    </PageTemplate>
  );
};

export default Web;