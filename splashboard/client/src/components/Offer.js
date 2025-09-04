// src/components/ThankYouPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useUserProfile from "./hooks/useUserProfile";

const OfferPage = ({ userId }) => {
  const navigate = useNavigate();
  const {
    user,
    
    handleAcceptMembership,
  } = useUserProfile();

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to forfeit your spot on the waitlist?"
    );

    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:4000/users/${userId}`);
        alert("You have been removed from the waitlist.");
        navigate("/membership");
      } catch (err) {
        console.error("Failed to remove from waitlist:", err);
        alert("There was a problem removing you from the waitlist.");
      }
    }
  };
  const handleDefer = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to forfeit your spot on the waitlist?"
    );

    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:4000/users/${userId}`);
        alert("You have been removed from the waitlist.");
        navigate("/membership");
      } catch (err) {
        console.error("Failed to remove from waitlist:", err);
        alert("There was a problem removing you from the waitlist.");
      }
    }
  };

  return (
    <section>
      <article>
        <h1>Congradulations! You have a membership offer! </h1>
        <p>Please note that if you reject this membership you will be taken off of the waitlist. If you would like to be put back on, you will have to re-apply.
        </p>
        <p>Membership request: <strong>OFFER</strong>.</p>
        <p>
            If you accept, your membership cost is:{" "}
            <strong>
                {user?.membershipType === "individual"
                ? "$250"
                : user?.membershipType === "family"
                ? "$580"
                : "Unknown"}
            </strong>
        </p>

        <button onClick={handleAcceptMembership}>
          Accept Membership
        </button>
        <button onClick={handleDelete}>
          Reject Membership
        </button>
        
        
      </article>
    </section>
  );
};

export default OfferPage;
