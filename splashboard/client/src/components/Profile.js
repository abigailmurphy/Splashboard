// src/components/Profile.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast, ToastContainer } from "react-toastify";
import { useAuth } from "./Context";
import useUserProfile from "./hooks/useUserProfile";
import axios from "axios";



export default function Profile() {
  const navigate = useNavigate();
  const [, , removeCookie] = useCookies(["jwt"]);
  const {
    setIsLoggedIn,
    setRole,
    setIsAdmin,
    setIsMember,
    setHasOffer,
    setHasApplied,
  } = useAuth();

  const {
    user,
    form,
    handleFormChange,
    handleSave,
  } = useUserProfile();

  const [editMode, setEditMode] = useState(false);

  const logOut = async () => {
    try {
      await axios.post("http://localhost:4000/logout", {}, { withCredentials: true });
      removeCookie("jwt");
      setIsLoggedIn(false);
      setRole("");
      setIsAdmin(false);
      setIsMember(false);
      setHasOffer(false);
      setHasApplied(false);
      toast.info("You have been logged out.", { theme: "dark" });
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed", { theme: "dark" });
    }
  };
  

  
  if (!user) return <p>Loading profile...</p>;

  return (
    <>
      <div className="private">
        <h1>Profile Page</h1>

        {editMode ? (
          <>
            <label>
              First:
              <input
                type="text"
                name="first"
                value={form.first}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Last:
              <input
                type="text"
                name="last"
                value={form.last}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
              />
            </label>
            <button
              onClick={async () => {
                await handleSave();
                setEditMode(false);
              }}
            >
              Save
            </button>
            <button onClick={() => setEditMode(false)}>Cancel</button>
          </>
        ) : (
          <>
            

            <p><strong>First Name:</strong> {user.name?.first}</p>
            <p><strong>Last Name:</strong> {user.name?.last}</p>
            <p><strong>Email:</strong> {user.email}</p>

            <p><strong>Spouse First Name:</strong> {user.spouse?.sfirst}</p>
            <p><strong>Spouse Last Name:</strong> {user.spouse?.slast}</p>

            <p><strong>Address:</strong> {user.address?.street ??"-"}</p>
            <p><strong>City:</strong> {user.address?.city ??"-"}</p>
            <p><strong>State:</strong> {user.address?.state??"-"}</p>
            <p><strong>Zip Code:</strong> {user.address?.zipCode??"-"}</p>

            <p><strong>Cell Phone:</strong> {user.cell}</p>
            <p><strong>Cell Phone 2:</strong> {user.cell2}</p>
            <p><strong>Home Phone:</strong> {user.homePhone}</p>
            <p><strong>Work Phone:</strong> {user.workPhone}</p>

            <p><strong>Children:</strong> {user.children?.join(", ")}</p>
            <p><strong>Membership Type:</strong> {user.membershipType}</p>

            <p><strong>Is Admin:</strong> {user.isAdmin ? "Yes" : "No"}</p>
            <p><strong>Has Offer:</strong> {user.hasOffer ? "Yes" : "No"}</p>
            <p><strong>Has Paid:</strong> {user.hasPaid ? "Yes" : "No"}</p>
            <p><strong>Is Member:</strong> {user.isMember ? "Yes" : "No"}</p>

            <p><strong>Years of Membership:</strong> {user.years?.join(", ")}</p>
            <button onClick={() => setEditMode(true)}>Edit Profile</button>
          </>
        )}

        <button onClick={logOut}>Log out</button>
      </div>
      <ToastContainer />
    </>
  );
}
