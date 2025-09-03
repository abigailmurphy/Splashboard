// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";

import { AuthProvider, useAuth } from "./components/Context";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Contact from "./components/Contact";
import Membership from "./components/Membership";
import Login from "./components/Login";
import Register from "./components/Register";
import Profile from "./components/Profile";
import ManageTabs from "./components/Manage";
import OfferPage from "./components/Offer";
import Thanks from "./components/Thanks";
import MemberList from "./components/Members";
import MembershipPage from "./components/MemberDashboard";
import MembershipWizard from "./components/MembershipWizard";
import ReApply from "./components/ReApply";
import AdminSettingsPage from "./components/AdminSettings";
import GuestSignUpPage from "./components/Guest";
import "react-toastify/dist/ReactToastify.css";

const AppRoutes = () => {
  const [cookies, , removeCookie] = useCookies([]);
  const {
    setIsLoggedIn,
    setIsMember,
    setIsAdmin,
    setRole,
    setHasOffer,
    setHasApplied,
    isLoggedIn,
    isMember,
    isAdmin,
    hasOffer,
    hasApplied
    
  } = useAuth();

  const verifyUser = async () => {
    try {
      const { data } = await axios.get("http://localhost:4000/check", {
        withCredentials: true,
      });
  
      if (!data.status) {
        console.log("No valid auth cookie – user is not logged in");
        setIsLoggedIn(false);
        setIsMember(false);
        setIsAdmin(false);
        setRole("");
        setHasOffer(false);
        setHasApplied(false);
    
      } else {
        setIsLoggedIn(true);
        setIsMember(data.user.isMember);
        setIsAdmin(data.user.isAdmin);
        setHasOffer(data.user.hasOffer);
        setHasApplied(data.user.hasApplied);
  
        if (data.user.isAdmin) setRole("admin");
        else if (data.user.isMember) setRole("member");
        else setRole("waitlist");
  
        //toast(`Hi ${data.user.fullName} 🦄`, { theme: "dark" });
      }
    } catch (err) {
      console.error("Verification error", err);
      setIsLoggedIn(false);
      setIsMember(false);
      setIsAdmin(false);
      setRole("");
      setHasOffer(false);
      setHasApplied(false);
    }
    console.log(hasOffer);
  };
  

  useEffect(() => {
    verifyUser();

  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="contact" element={<Contact />} />
        {<Route path="dashboard" element={<MembershipPage />} />}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {isLoggedIn && (
          <>
            <Route path="profile" element={<Profile />} />
            {/** Admin Routes */}
            {isAdmin && <Route path="manage" element={<ManageTabs />} />}
            {isAdmin && <Route path="members" element={<MemberList />} />}
            {isAdmin && <Route path="settings-admin" element={<AdminSettingsPage />} />}

            {/** Member: no action required */}
            

            
            {isMember && <Route path="guest" element={<GuestSignUpPage />} />}
            {/** Existing member offer (each year) */}
            {isMember && hasOffer && <Route path="reapply" element={<ReApply />} />}


            
            {/** User, not applied or member*/}
            {!hasApplied &&!hasOffer && !isMember && !isAdmin &&(
              <Route path="membership-wizard" element={<MembershipWizard />} />
            )}
            
          </>
        )}
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
