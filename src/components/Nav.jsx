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
    <div className="h-full w-24 flex flex-col items-center justify-center z-10">
      <div className="h-fit w-16 p-3 flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-lg space-y-4">
        {navItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleNavClick(item.anchor)}
            className="w-full aspect-square rounded-xl relative group transition flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <div className="text-white text-2xl">{item.icon}</div>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#3e3e3e] text-white text-sm px-2 py-1 rounded-md shadow-lg invisible group-hover:visible transition-opacity">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Nav;
