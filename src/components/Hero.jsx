import Resume from '../downloads/Nikolas-Larson-Resume.pdf'

function Hero() {


  const handleNavClick = (anchor) => {
    const section = document.querySelector(anchor);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
      <div className="w-full h-screen flex flex-col px-8 space-y-8">
          {/* Header */}
          <div className="text-6xl md:text-8xl font-bold text-white uppercase">
              Software Engineer
          </div>
          <div className="text-6xl md:text-8xl font-bold text-white uppercase">
              X
          </div>
          <div className="text-6xl md:text-8xl font-bold text-white uppercase">
              Student
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 flex-grow items-end md:pb-28 pb-48">
              <a
                  href={Resume} // Replace with the actual path to your resume file
                  download="Nikolas-Larson-Resume.pdf" // Optional: Customize the downloaded file name
                  className="h-fit px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white text-lg font-medium hover:bg-white/20 transition-all shadow-lg"
              >
                  Download Resume
              </a>
              <a
                  onClick={() => handleNavClick("#contact")}
                  className="h-fit px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg text-white text-lg font-medium hover:bg-white/20 transition-all shadow-lg cursor-pointer"
              >
                  Contact
              </a>
          </div>
      </div>
  );
}

export default Hero;
