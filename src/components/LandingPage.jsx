import Nav from "./Nav";
import Card from "./Card";
import Hero from "./Hero";
import Projects from "./Projects";
import { ReactComponent as BGLines } from "../assets/bg-lines.svg";
import Experience from "./Experience";
import Skills from "./Skills";
import Contact from "./Contact";

function LandingPage() {
  const handleScroll = (e) => {
    const rightSection = document.querySelector("#right-section");
    if (rightSection) {
      rightSection.scrollTop += e.deltaY; // Synchronize scrolling
      e.preventDefault(); // Prevent default scrolling behavior on the body
    }
  };

  return (
    <div
      className="h-screen w-full bg-[#121212] flex fixed overflow-y-auto overflow-clip"
      onWheel={handleScroll} // Attach scroll event listener
    >
      <div className="flex-grow h-full flex-col md:flex-row flex z-10">
        {/* Left Side */}
        <Nav />
        <Card />

        {/* Right Side */}
        <div
          id="right-section"
          className="flex-1 h-full px-8 overflow-y-scroll overflow-x-clip space-y-20"
        >
          <section id="hero" className={"pt-14"}>
            <Hero />
          </section>
          <section id="projects" className={"pt-14"} >
            <Projects />
          </section>
          <section id="experience">
            <Experience />
          </section>
          <section id="skills">
            <Skills />
          </section>
          <section id="contact" className={"pb-14"}>
            <Contact />
          </section>
        </div>
      </div>
      <div className="absolute opacity-30">
        <BGLines className="w-screen h-screen z-0" />
      </div>
    </div>
  );
}

export default LandingPage;
