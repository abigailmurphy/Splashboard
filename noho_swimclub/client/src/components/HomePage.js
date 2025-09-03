import React from 'react';
import poolFun from "./assets/images/swimhome.jpg";
import "./style.css"; // Your custom styles

const HomePage = () => {
  return (
    <>
     
      <section>
        <article>
          <h1>Fun and Relaxation for All</h1>
          <p>
            Our custom-designed pool was made for both avid and casual family swimmers. Surrounding the pool are lounges, tables with sun umbrellas and chairs, and a few stand-alone sun umbrellas. When you are not swimming, take advantage of our sand volleyball court, ping-pong tables, pool table, kid’s play structure, or just sit, read and enjoy time with friends. It is truly a great escape for the entire family!
          </p>
          <div className="arimg">
          <img src={poolFun} alt="PoolFun" className="louie-deis"/>
          </div>

          <h1>Hours</h1>
          <p>
            &nbsp;&nbsp;&nbsp;<b>Jun 3 - Jun 16:</b> 11:00a - 7:00p
            <br />
            <br />
            &nbsp;&nbsp;&nbsp;<b>Jun 17 - Aug 6:</b> 11:00a - 8:00p
            <br />
            <br />
            &nbsp;&nbsp;&nbsp;<b>Aug 7 - Sep 4:</b> 11:00a - 7:00p
          </p>

          <h1>Lap Swim</h1>
          <p>
            One lap lane is available at all times while the pool is open.
            The designated lap swim hours are only during:
            <br />
            <br />
            &nbsp;&nbsp;&nbsp;<b>Jun 17 - Sep 3:</b> Sat/Sun 10:00a - 11:00a
          </p>

          <h1>Snack Bar</h1>
          <p>
            <b>Jun 4 – Jun 23:</b>
            <br />
            &nbsp;&nbsp;&nbsp;Mon – Fri: 3:00p – 6:30p
            <br />
            &nbsp;&nbsp;&nbsp;Sat – Sun: 12:00p – 6:30p
            <br />
            <br />
            <b>Jun 24 – Sep 4:</b>
            <br />
            &nbsp;&nbsp;&nbsp;12:00p – 6:30p every day
          </p>
        </article>
        <aside>
          <iframe
            src="https://api.wo-cloud.com/content/widget/?geoObjectKey=40261662&language=en&region=US&timeFormat=HH:mm&windUnit=mph&systemOfMeasurement=imperial&temperatureUnit=fahrenheit"
            name="CW2"
            scrolling="no"
            width="290"
            height="318"
            frameBorder="0"
            style={{ border: '1px solid #10658E', borderRadius: '8px' }}
          ></iframe>
        </aside>
      </section>
    </>
  );
};

export default HomePage;
