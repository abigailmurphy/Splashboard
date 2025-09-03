// src/components/Layout.js
import React from "react";
import { Link, Outlet } from "react-router-dom";
import "./style.css";
import logo from "./assets/images/w1920.png";
import { useAuth } from "./Context";
import { useEffect,useRef } from "react";
import { toast, ToastContainer } from "react-toastify";


const Layout = () => {
  const { isLoggedIn, isAdmin, isMember, hasOffer, hasApplied, role } = useAuth();
  const hasShownToast = useRef(false);
  useEffect(() => {
    if (!hasShownToast.current && isLoggedIn && hasOffer && !isMember && !isAdmin) {
      toast.info("🎉 You have a new membership offer!", {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
      });
      hasShownToast.current = true;
    }
    else if (!hasShownToast.current && isLoggedIn && hasOffer && isMember && !isAdmin) {
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
        <img src={logo} alt="CC logo" />
        <div className="texts">
          <h1>Northampton Swim Club</h1>
        </div>

        <nav className="flex-navigate">
          <Link to="/">Home</Link>
          <Link to="/announcements">Announcements</Link>

          {/** Membership Tab Options */}
          {!isAdmin && <Link to="/dashboard">Membership</Link>}

          
          {isLoggedIn && hasOffer && isMember && !isAdmin && (
            <Link to="/reapply" className="offer-link">
              Membership
              <span className="offer-badge"></span>
            </Link>
          )}

          
          

         



          {isLoggedIn && isAdmin && <Link to="/manage">Manage Waitlist</Link>}
          {isLoggedIn && isAdmin && <Link to="/members">View Members</Link>}
          
          
          <Link to="/contact">Contact</Link>

          {isLoggedIn && !isAdmin &&<Link to="/profile">Profile</Link>}
          {isLoggedIn && isAdmin &&<Link to="/settings-admin">Settings</Link>}
          
          {!isLoggedIn && <Link to="/login">Login</Link>}
        </nav>
        
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="footer-words">
          <p>@ 2023 Brandeis University</p>
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
