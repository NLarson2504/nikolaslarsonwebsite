import { FaHome, FaProjectDiagram, FaBriefcase, FaTools, FaEnvelope } from "react-icons/fa";

function Nav() {
  const navItems = [
    { label: "Home", icon: <FaHome />, anchor: "#hero" },
    { label: "Projects", icon: <FaProjectDiagram />, anchor: "#projects" },
    { label: "Experience", icon: <FaBriefcase />, anchor: "#experience" },
    { label: "Skills", icon: <FaTools />, anchor: "#skills" },
    { label: "Contact", icon: <FaEnvelope />, anchor: "#contact" },
  ];

  const handleNavClick = (anchor) => {
    const section = document.querySelector(anchor);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-2 md:static h-24 w-full md:h-full md:w-24 flex flex-col items-center justify-center z-10">
      <div className="h-16 md:h-fit w-fit md:w-16 p-3 flex flex-row md:flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-lg space-x-4 space-y-0 md:space-x-0 md:space-y-4">
        {navItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavClick(item.anchor)}
            className="h-full md:w-full aspect-square rounded-xl relative group transition flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <div className="text-white text-2xl">{item.icon}</div>
            <div className="absolute md:left-full md:ml-2 top-full md:mt-0 mt-2 md:top-1/2 md:-translate-y-1/2 bg-[#3e3e3e] text-white text-sm px-2 py-1 rounded-md shadow-lg invisible group-hover:visible transition-opacity">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Nav;
