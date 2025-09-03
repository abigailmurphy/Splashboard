// src/components/ThankYouPage.js
import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

const ThankYouPage = ({ userId }) => {
  const navigate = useNavigate();

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

  return (
    <section>
      <article>
        <h1>Thank you for joining our waitlist!</h1>
        <Link to="/profile">PENDING</Link>

        <button onClick={handleDelete}>Remove from Waitlist</button>
        <p>
          * Note that if you decide to remove yourself from the waitlist you
          will have to reapply and be put at the bottom of the list *
        </p>
      </article>

      <article>
        <h1>Membership</h1>
        <p>
          Swim Club membership is full for 2022, as we have been every year
          since 1985. All 2022 members and those top 10-15 people on the
          waitlist will receive an email with information for renewal/membership
          in mid-March of 2023 for the 2023 season. On or about April 5, another
          set of membership offers will be sent based on the number of openings
          we have. If we still have openings, another set of membership offers
          will be sent on or about April 26 until we are full.
        </p>
      </article>
    </section>
  );
};

export default ThankYouPage;
