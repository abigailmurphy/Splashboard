import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MemberList = ({ userId }) => {
  const navigate = useNavigate();
  const [members, setMemberList] = useState([]);
  const [offers, setOfferList] = useState([]);

  useEffect(() => {
    axios
        .get("http://localhost:4000/admin/offers", { withCredentials: true })
        .then((res) => {
            const list = res.data.offers || [];
            setOfferList(list);
          })
        .catch(console.error);
   

    axios
      .get("http://localhost:4000/admin/members", { withCredentials: true })
      .then((res) => {
        const list = res.data.members || [];
        setMemberList(list);
      })
      .catch(console.error);
  }, []);


  return (
    <section>
      <h2>MemberList (Oldest First)</h2>
      <ul>
        {members.map((user) => (
          <li key={user._id}>
            <strong>
              {user.name.first} {user.name.last}
            </strong>{" "}
           
            <br />
            
          </li>
        ))}
      </ul>
      <h2>OutStanding Offers</h2>
      <ul>
        {offers.map((user) => (
          <li key={user._id}>
            <strong>
              {user.name.first} {user.name.last}
            </strong>{" "}
       
            <br />
            
          </li>
        ))}
      </ul>

    </section>
  );
};

export default MemberList;

