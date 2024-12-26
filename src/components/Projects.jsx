import mooslixImage from "../downloads/mooslix.png"
import mooslixMobileImage from "../downloads/mooslixmobile.png"
import personalWebsite from "../downloads/personalwebsite.png"


function Projects() {
  // Example project data
  const projectList = [
    {
      title: "Mooslix Hardware",
      description: "An infrared scanner integrating machine learning and image processing algorithms.",
      link: "",
      media: "https://via.placeholder.com/400x300?text=Hexapod+Preview", // Example image
    },
    {
      title: "Mooslix.com",
      description: "A full-stack application that centralizes authentication controls, data insights, and information exports.",
      link: "https://mooslix.com",
      media: mooslixImage, // Example image
    },
    {
      title: "Mooslix Mobile App",
      description: "A mobile app to host the services of closed-environment organizations.",
      link: "",
      media: mooslixMobileImage, // Example image
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
      media: "https://via.placeholder.com/400x300?text=Hexapod+Preview", // Example image
    },
  ];

  return (
    <div className="w-full h-auto flex flex-col space-y-8 px-8">
      {/* Title */}
      <div className="text-7xl font-bold text-white uppercase">Projects</div>

      {/* Project List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {projectList.map((project, index) => (
          <div
            key={index}
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
