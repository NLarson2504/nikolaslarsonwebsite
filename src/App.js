import logo from './logo.svg';
import './App.css';
import LandingPage from "./components/LandingPage";

function App() {
  return (
      <div className={"w-screen h-screen flex flex-col items-center justify-center fixed"}>
        <LandingPage/>
      </div>
  );
}

export default App;
