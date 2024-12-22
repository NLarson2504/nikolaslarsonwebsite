import z9Mobile from "../downloads/z9security.png"
import tarragonMobile from "../downloads/tarragonmobile.png"
import tarragonWeb from "../downloads/tarragonweb.png"

function Experience() {
  // Example experience data
  const experienceList = [
    {
      role: "Software Engineer Intern",
      company: "Tarragon Systems, Cambridge, MA",
      duration: "July 2024 - Present",
      description: "• Improved the prediction engine’s open set recognition accuracy by 53% within one month through hyperparameter optimization, saving customers over $100,000 annually from over-ordering inventory\n" +
                   "• Developed a mobile application for iOS and Android with Google OAuth 2.0 and Rest API’s in under 3 weeks, reducing inventory-taking duration by 75% for dozens of customers",
      workSamples: [
        { image: tarragonMobile },
        { image: tarragonWeb },
      ],
    },
    {
      role: "Software Engineer Intern",
      company: "Z9 Security, Carrboro, NC",
      duration: "January 2024 - February 2024",
      description: "• Designed and developed an Android application for the Google Play Store using Kotlin, XML, APIs, and BLE\n" +
                   "• Collaborated with hardware and server-side engineers on firmware for a Fortune 200 company\n" +
                   "• Reviewed elliptic-curve encryption programs and cybersecurity frameworks for secure data transmission",
      workSamples: [
        { image: z9Mobile },
      ],
    },
    {
      role: "Technical Engineer Intern",
      company: "Merritt Precision Products, subsidiary of Mearthane Products, Apex, NC",
      duration: "May 2023 - August 2023",
      description: "• Documented dozens of quality control protocols, product schematics, and calibration records to pass ISO-9001\n" +
                   "• Managed workflows through Smartsheets, Microsoft Visio diagrams, and other organizational apparatuses\n" +
                   "• Revamped the learning management system with video tutorials to teach non-English speaking employees operational processes, increasing scheduling flexibility and machine uptime",
      workSamples: [],
    },
    {
      role: "Mechatronics Student Intern",
      company: "MTU Aero Engines, Munich, Germany",
      duration: "August 2022",
      description: "• Learned professional engineering workflows and practices around industrial lathes, drills, and CNCs\n" +
                   "• Engaged with sustainability initiatives within the workplace and the company's goal of “zero waste aviation”",
      workSamples: [],
    },
  ];

  return (
    <div className="w-full h-auto flex flex-col space-y-8 px-8 py-16">
      {/* Section Title */}
      <div className="text-7xl font-bold text-white uppercase">Experience</div>

      {/* Experience List */}
      <div className="flex flex-col space-y-6">
        {experienceList.map((experience, index) => (
          <div
            key={index}
            className="p-6 bg-white/10 backdrop-blur-md rounded-lg shadow-lg hover:bg-white/20 transition-all text-white"
          >
            <div className="text-2xl font-semibold">{experience.role}</div>
            <div className="text-lg opacity-75">{experience.company}</div>
            <div className="text-sm opacity-50">{experience.duration}</div>
            <div className="mt-2 text-base opacity-75 whitespace-pre-line">{experience.description}</div>

            {/* Work Samples */}
            {experience.workSamples.length > 0 && (
              <div className="mt-4">
                <div className="space-x-2 flex">
                  {experience.workSamples.map((sample, idx) => (
                    <img
                      key={idx}
                      src={sample.image}
                      alt={`Work Sample ${idx + 1}`}
                      className="w-fit h-40 object-cover rounded-lg shadow-md hover:shadow-lg transition-all"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Experience;
