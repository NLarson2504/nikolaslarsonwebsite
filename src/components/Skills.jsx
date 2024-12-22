import {FaJs, FaPython, FaJava, FaReact, FaNodeJs, FaDocker, FaGit, FaFigma, FaJira} from "react-icons/fa";
import { FaFlask, FaGoogle, FaHtml5, FaR} from "react-icons/fa6";
import {BiLogoPostgresql} from "react-icons/bi";
import {SiExpo, SiFirebase, SiGooglebigquery, SiKotlin, SiMiro, SiPostman, SiVercel, SiVite} from "react-icons/si";
import {TbBrandReactNative} from "react-icons/tb";

function Skills() {
  // Example skills data
const skillsData = {
  "Programming Languages": [
    { name: "JavaScript", icon: <FaJs />, descriptor: "Dynamic Web Development" },
    { name: "Python", icon: <FaPython />, descriptor: "Data Science & Machine Learning" },
    { name: "Java", icon: <FaJava />, descriptor: "Enterprise-Grade Applications" },
    { name: "Kotlin", icon: <SiKotlin />, descriptor: "Modern Android Development" },
    { name: "R", icon: <FaR />, descriptor: "Statistical Analysis & Visualization" },
    { name: "PostgreSQL", icon: <BiLogoPostgresql />, descriptor: "Relational Database Management" },
    { name: "HTML & CSS", icon: <FaHtml5 />, descriptor: "Responsive Web Design" },
  ],
  Frameworks: [
    { name: "React", icon: <FaReact />, descriptor: "Modern UI Development" },
    { name: "Node.js", icon: <FaNodeJs />, descriptor: "Scalable Server-Side Apps" },
    { name: "Flask", icon: <FaFlask />, descriptor: "Lightweight Python Web Apps" },
    { name: "React Native", icon: <TbBrandReactNative/>, descriptor: "Cross-Platform Mobile Apps" },
    { name: "Expo", icon: <SiExpo />, descriptor: "Rapid React Native Development" },
    { name: "Vite", icon: <SiVite/>, descriptor: "Fast Frontend Build Tools" },
  ],
  Tools: [
    { name: "Git", icon: <FaGit />, descriptor: "Version Control & Collaboration" },
    { name: "Docker", icon: <FaDocker />, descriptor: "Containerized Environments" },
    { name: "Postman", icon: <SiPostman/>, descriptor: "API Development & Testing" },
    { name: "Figma", icon: <FaFigma />, descriptor: "Collaborative UI/UX Design" },
    { name: "Google Cloud", icon: <FaGoogle />, descriptor: "Scalable Cloud Services" },
    { name: "Firebase", icon: <SiFirebase/>, descriptor: "Realtime Databases & Hosting" },
    { name: "BigQuery", icon: <SiGooglebigquery/>, descriptor: "Big Data Analytics" },
    { name: "Jira", icon: <FaJira />, descriptor: "Project Management & Tracking" },
    { name: "Miro", icon: <SiMiro/>, descriptor: "Collaborative Diagramming" },
    { name: "Vercel", icon: <SiVercel/>, descriptor: "Frontend Deployment Platform" },
    { name: "EAS", icon: <SiExpo/>, descriptor: "Mobile Development Ecosystem" },
  ],
};

  return (
    <div className="w-full h-auto flex flex-col space-y-8 px-8 py-16">
      {/* Section Title */}
      <div className="text-7xl font-bold text-white uppercase">Skills</div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 gap-8">
        {Object.keys(skillsData).map((category, index) => (
          <div
            key={index}
            className="py-6 text-white"
          >
            {/* Category Title */}
            <div className="text-2xl font-semibold mb-4">{category}</div>

            {/* Skills List */}
            <div className="grid grid-cols-2 gap-4">
              {skillsData[category].map((skill, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-lg hover:bg-white/20 transition-all text-white flex space-x-4 items-center content-center"
                >
                  <div className="text-4xl">{skill.icon}</div>
                  <div>
                    <div className="font-medium text-lg">{skill.name}</div>
                    <div className="text-sm opacity-75">{skill.descriptor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Skills;
