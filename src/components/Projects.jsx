import mooslixImage from "../downloads/mooslix.png"
import mooslixMobileImage from "../downloads/mooslixmobile.png"
import personalWebsite from "../downloads/personalwebsite.png"
import xpence from "../downloads/xpence.png"
import hardware from "../downloads/hardware.png"
import hexapod from "../downloads/hexapod.jpeg"
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Projects() {
  const titleRef = useRef();
  const projectRefs = useRef([]);

  const projectList = [
    {
      title: "XPence Intentional Investing",
      description: "Designed a dashboard for a FinTech idea aligned with intentional strategy-based investing and AI integrations.",
      link: "https://www.figma.com/proto/5Y2zvJmCukP8tMDsD42X89/mooslix?page-id=754%3A401&node-id=754-402&p=f&viewport=594%2C507%2C0.7&t=na3nZUyxpEqjJO0M-1&scaling=scale-down&content-scaling=fixed",
      media: xpence, // Example image
    },
    {
      title: "Mooslix Mobile App",
      description: "A mobile app to host the services of closed-environment organizations.",
      link: "",
      media: mooslixMobileImage, // Example image
    },
    {
      title: "Mooslix.com",
      description: "A full-stack application that centralizes authentication controls, data insights, and information exports.",
      link: "https://mooslix.com",
      media: mooslixImage, // Example image
    },
    {
      title: "Palm Scanner",
      description: "An infrared scanner integrating machine learning and image processing algorithms.",
      link: "",
      media: hardware, // Example image
    },
    {
      title: "Personal Website",
      description: "My personal portfolio website.",
      link: "",
      media: personalWebsite, // Example image
    },
    {
      title: "Autonomous Hexapod",
      description: "A robotic platform with advanced autonomous capabilities.",
      link: "",
      media: hexapod, // Example image
    },
  ];

  useEffect(() => {
    gsap.fromTo(titleRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      }
    );

    projectRefs.current.forEach((project, index) => {
      if (project) {
        gsap.fromTo(project,
          { y: 80, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: project,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none reverse"
            },
            delay: index * 0.1
          }
        );
      }
    });
  }, []);

  return (
    <div className="w-full h-auto flex flex-col space-y-8 px-8">
      {/* Title */}
      <div ref={titleRef} className="text-7xl font-bold text-white uppercase">Projects</div>

      {/* Project List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {projectList.map((project, index) => (
            <div
                key={index}
                ref={el => projectRefs.current[index] = el}
                className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg hover:bg-white/20 transition-all text-white"
            >
              {/* Media Section */}
              <div className="mb-4">
                <img
                    src={project.media}
                    alt={`${project.title} Preview`}
                    className="w-full h-48 object-cover rounded-md shadow-md"
                />
              </div>

              {/* Project Title and Description */}
              <div className="text-2xl font-semibold mb-2">{project.title}</div>
              <div className="text-sm opacity-75 mb-4">{project.description}</div>

              {/* Link Button */}
              <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${project.link === "" ? "hidden" : "visible"} inline-block px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all`}
              >
                View Project
              </a>
            </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
