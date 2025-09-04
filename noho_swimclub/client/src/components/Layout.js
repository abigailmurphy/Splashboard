import React, { useEffect, useRef } from "react";
import { Link, Outlet } from "react-router-dom";
import "./style.css";
import { useAuth } from "./Context";
import { toast, ToastContainer } from "react-toastify";

// Import Material UI Icon
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';



const Layout = () => {
  const { isLoggedIn, isAdmin, isMember, hasOffer } = useAuth();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!hasShownToast.current && isLoggedIn && hasOffer && !isMember && !isAdmin) {
      toast.info("🎉 You have a new membership offer!", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
      hasShownToast.current = true;
    } else if (!hasShownToast.current && isLoggedIn && hasOffer && isMember && !isAdmin) {
      toast.info("It is time to renew your membership.", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
      hasShownToast.current = true;
    }
  }, [isLoggedIn, hasOffer, isMember, isAdmin]);

  return (
    <div>
      <header className="header-style">
        
        <nav className="flex-navigate">
        <div className="ml-auto">
            <Link to="/">
              <HomeIcon style={{ fontSize: "35px" }} />
            </Link>
          </div>
        
          <Link to="/announcements">Announcements</Link>

          {!isAdmin && <Link to="/dashboard">Membership</Link>}

          {isLoggedIn && hasOffer && isMember && !isAdmin && (
            <Link to="/reapply" className="offer-link">
              Membership
              <span className="offer-badge"></span>
            </Link>
          )}

          {(isAdmin || isMember) && <Link to="/guest">Guests</Link>}
          {isLoggedIn && isAdmin &&
          <div className="dropdown">
          <button className="dropbtn">
            <Link to="/manage">Dashboard</Link>
            <ArrowDropDownIcon fontSize="medium" />

          </button>
          <div className="dropdown-content">
          <Link to="/manage?tab=members">Manage: Members</Link>
          <Link to="/manage?tab=waitlist">Manage: Waitlist</Link>
          <Link to="/manage?tab=offers">Manage: Offers</Link>
           
          </div>
        </div>
          
          }
          {!isAdmin && <Link to="/contact">Contact</Link>}

          {isLoggedIn && !isAdmin && <Link to="/profile"><AccountCircleIcon style={{ fontSize: "35px",paddingRight:"10px" }} /> </Link>}
          {isLoggedIn && isAdmin && (
            <div className="dropdown">
              <button className="dropbtn">
              
                <SettingsIcon style={{ fontSize: "28px" }} /> 
                <ArrowDropDownIcon fontSize="medium" /></button>
              <div className="dropdown-content">
                <Link to="/settings-admin">General</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/settings-admin">Deadlines</Link>
                <Link to="/settings-admin">Guest Caps</Link>
                <Link to="/settings-admin">Pricing</Link>
              </div>
            </div>
          )}
          {!isLoggedIn && <Link to="/login">Login</Link>}

          
          
        </nav>

        <div className="header text">
          <h1>Splashboard</h1>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="footer-words">
          <p>@ 2023 Abbie Murphy</p>
        </div>
        <div className="footer-social">
          <a href="#" className="fa fa-facebook"></a>
          <a href="#" className="fa fa-instagram"></a>
          <a href="#" className="fa fa-linkedin"></a>
          <a href="#" className="fa fa-youtube"></a>
          <a href="#" className="fa fa-twitter"></a>
        </div>
      </footer>
      <ToastContainer />
    </div>
  );
};

export default Layout;
