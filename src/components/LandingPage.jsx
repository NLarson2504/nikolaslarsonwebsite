import TopNavbar from "./TopNavbar";
import StickyCard from "./StickyCard";
import LayeredPlatform from "./LayeredPlatform";

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#121212]">
      <TopNavbar />
      
      <div className="pt-20 flex flex-col lg:flex-row">
        {/* Left Half - Sticky Card */}
        <div className="lg:w-1/2 lg:h-screen">
          <StickyCard />
        </div>
        
        {/* Right Half - 3D Layered Platform */}
        <div className="lg:w-1/2">
          <LayeredPlatform />
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
