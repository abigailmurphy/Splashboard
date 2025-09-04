import React from "react";
import "./home.css";
import swimclub from "./assets/images/swimclub.jpg";

export default function HomePage() {
  return (
    <section className="home">
      <div className="home-grid">

        {/* (welcome/context) */}
        <div className="card card--span2">
          <h2 className="card-title">Fun and Relaxation for All</h2>
          <p className="card-text">
            Our custom-designed pool was made for both avid and casual family swimmers. Surrounding the pool are lounges, tables with sun umbrellas and chairs, and a few stand-alone sun umbrellas. When you are not swimming, take advantage of our sand volleyball court, ping-pong tables, pool table, kid’s play structure, or just sit, read and enjoy time with friends. It is truly a great escape for the entire family!
          </p>
          <img className="card-image" src={swimclub} alt="Swim Club" />
        </div>
        {/* Weather */}
        <div className="card card--wave">
          <h2 className="card-title">Weather</h2>
          <div className="embed-wrap">
            <iframe
              title="Weather"
              src="https://api.wo-cloud.com/content/widget/?geoObjectKey=40261662&language=en&region=US&timeFormat=HH:mm&windUnit=mph&systemOfMeasurement=imperial&temperatureUnit=fahrenheit"
              width="100%"
              height="318"
              frameBorder="0"
            />
          </div>
        </div>

        {/* Lap Swim */}
        <div className="card ">
          <h2 className="card-title">Lap Swim</h2>
          <p className="card-text center">
            One lap lane is available at all times while the pool is open.
            The designated lap swim hours are only during:
          </p>
          <div className="pill">Jun 17 - Sep 3 · Sat/Sun · 10:00a–11:00a</div>
        </div>

        

        {/* Hours */}
        <div className="card card--wave">
          <h2 className="card-title">Hours</h2>
          <ul className="hours-list">
            <li><b>Jun 3 – Jun 16</b> <span>11:00a – 7:00p</span></li>
            <li><b>Jun 17 – Aug 6</b> <span>11:00a – 8:00p</span></li>
            <li><b>Aug 7 – Sep 4</b> <span>11:00a – 7:00p</span></li>
          </ul>
        </div>

        {/* Quick actions (example) */}
        <div className="card">
          <h2 className="card-title">Quick Actions</h2>
          <div className="actions">
            <a className="btn" href="/guest">Reserve Guest Pass</a>
            <a className="btn btn--secondary" href="/announcements">View Announcements</a>
          </div>
        </div>

      </div>
    </section>
  );
}
