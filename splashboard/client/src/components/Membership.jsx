import {React, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Context"; // update path if needed
import axios from "axios";

function fmtDate(
  d,
  {
    withTime = false,
    withSeconds = false,
    timeZone = "America/New_York",
    locale,
  } = {}
) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);

  const base = { year: "numeric", month: "long", day: "numeric", timeZone };
  const time = withTime
    ? {
        hour: "numeric",
        minute: "2-digit",
        ...(withSeconds ? { second: "2-digit" } : {}),
        timeZoneName: "short",
      }
    : {};

  return new Intl.DateTimeFormat(locale, { ...base, ...time }).format(dt);
}

const MembershipInfo = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // this should reflect your actual auth hook/context
  const [season, setSeason] = useState(String(new Date().getFullYear()+1));
  const [cost, setCost] = useState({ individualPerPerson: 260, familyFlat: 620 });
  const [deadlines, setDeadlines] = useState({
    offerResponseDays: 14,
    returnResponseDays: 21,
    hardOfferDeadline: "",
    hardReturnDeadline: "",
  });

  useEffect(() => {
    axios.get(`http://localhost:4000/settings/public?season=${season}`).then(r => {
      if (r.data?.cost) setCost(r.data.cost);
      if (r.data?.deadlines) setDeadlines({
        offerResponseDays: r.data.deadlines.offerResponseDays ?? 14,
        returnResponseDays: r.data.deadlines.returnResponseDays ?? 21,
        hardOfferDeadline: r.data.deadlines.hardOfferDeadline ? r.data.deadlines.hardOfferDeadline.slice(0,10) : "",
        hardReturnDeadline: r.data.deadlines.hardReturnDeadline ? r.data.deadlines.hardReturnDeadline.slice(0,10) : "",
      });
    });
  }, [season]);

  const handleApplyClick = () => {
    if (isLoggedIn) {
      navigate("/membership-wizard");
    } else {
      navigate("/login?from=apply");
    }
  };

  return (
    <section>
      <article>
        <h1>Membership</h1>
        <p>
          Swim Club membership is full for {season}, as we have been every year since 1985.
          All {season} members and those top 10–15 people on the waitlist will receive an email
          with information for renewal/membership in mid-March of {String(parseInt(season)+1)} for the {String(parseInt(season)+1)} season.
          On or about {fmtDate(deadlines.hardReturnDeadline)}, another set of membership offers will be sent based on the
          number of openings we have. If we still have openings, another set of membership
          offers will be sent on or about {deadlines.hardOfferDeadline} until we are full.
        </p>
        <h1>Apply for Membership Waitlist</h1>
        <p>
          <b>Individual: </b> ${cost.individualPerPerson}
          <br />
          <b>Family:</b> ${cost.familyFlat} (A family is defined as members of a family living at the
          same address on a year-round basis)
        </p>

        <button className="button-9" role="button" onClick={handleApplyClick}>
          Apply
        </button>
      </article>
    </section>
  );
};

export default MembershipInfo;
