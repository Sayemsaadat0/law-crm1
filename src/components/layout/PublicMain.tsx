import { Outlet } from "react-router-dom";
import Navbar from "../core/Navbar";
// import Navbar from "../Shared/Navbar";
// import Footar from "../Shared/Footar";

const PublicMain = () => {
    return (
        <div>
          <Navbar />
          <Outlet></Outlet> 
          {/* <Footar></Footar> */}
        </div>
    );
};

export default PublicMain;