import ProfilePhoto from "../assets/profilePhoto.jpg";
import {FaGithub, FaInstagram, FaLinkedinIn} from "react-icons/fa";

function Card() {
  return (
    <div className="md:w-[28rem] xl:w-[32rem] h-full px-16 py-14 flex justify-center items-center">
      <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center space-y-6 shadow-lg">
        {/* Profile Photo */}
        <img
          src={ProfilePhoto}
          alt="Profile"
          className="w-full h-72 rounded-2xl object-cover"
        />
        {/* Name */}
        <div className="font-medium text-white text-3xl">Nikolas Larson</div>
        {/* Description */}
        <div className="flex-grow w-full flex justify-center items-center">
          <div className="text-base opacity-75 font-medium text-white text-center w-fit px-2">
            A full-stack software engineer passionate about leveraging technology to drive business
            innovation and promote sustainability.
          </div>
        </div>
        {/* Social Icons */}
        <div className="h-fit w-full text-white text-2xl space-x-4 flex justify-center">
          <a href={"https://www.linkedin.com/in/nikolaslarson/"} className="p-2 hover:bg-white/20 w-fit transition rounded-lg cursor-pointer aspect-square">
            <FaLinkedinIn />
          </a>
          <a href={"https://www.instagram.com/nikolas__larson/"} className="p-2 hover:bg-white/20 w-fit transition rounded-lg cursor-pointer aspect-square">
            <FaInstagram />
          </a>
          <a href={"https://github.com/NLarson2504"} className="p-2 hover:bg-white/20 w-fit transition rounded-lg cursor-pointer aspect-square">
            <FaGithub />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Card;
