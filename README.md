# Splashboard
A full-stack MERN web application for managing pool memberships and consolidating existing management tools into a single platform.

## 🌊 About

Splashboard is a full-stack MERN application designed to centralize pool membership management and replace fragmented tools with a single, user-friendly system. Originally built as a Node.js/Express prototype, the project has evolved into a scalable management platform with secure authentication, real-time guest sign-ups, and configurable season settings.


## 🛠️ Tech Stack
- **Frontend:** React, React Router, Context API
- **Backend:** Node.js, Express  
- **API:** RESTful API  
- **Database:** MongoDB with Mongoose  
- **Caching & Realtime:** Redis (Pub/Sub for live updates)  
- **Authentication:** JWT tokens, role-based access control  



## 💻 Features
Robust authentication and role-based authorization are implemented using JWT tokens and protected server routes.

### Admin Dashboard
Admins can configure season settings such as membership prices, deadlines, and the current working season. The dashboard also supports managing the waitlist, generating draft offer lists, and viewing membership history. Advanced queries and statistics provide deeper insights into user and member data.

### Membership Portal 
Members can apply for new memberships, track their status, and renew annually with a simplified confirmation process. The portal also provides access to guest sign-up features.

### Guest Sign-Up
Splashboard uses Redis caching with a pub/sub system to ensure fast, real-time updates for guest slot availability under high demand. Users can view, edit, and cancel sign-ups with ease.
Planned enhancements include a subscription feature that sends email notifications when slots open, reducing the need for constant monitoring.

## 📊 Data Storage
`User` – Stores user details such as contact information, address, family info, and role flags. Some fields overlap with MembershipRecord to allow flexibility for potential future non-member features.

`MembershipRecord` – Tracks a user’s membership for a given year, including status and related user data.

`GuestSignup` – Represents guest sign-ups for specific days, storing user IDs and the number of guests.

`AppSettings` – Holds persistent state such as the current working season.

`SeasonSettings` – Admin-controlled configuration for per-season parameters, including membership prices and deadlines

## 🏁 How to Start
1. Clone repository to local device in terminal using:
```bash
git clone git@github.com:abigailmurphy/Splashboard.git
cd Splashboard
```
2. Start the backend server and databases:

```bash
cd server
npm install
node index.js
``` 
3. Start the front end:

```bash
cd client
npm install
npm start
```
4. Get started!

## 🔮 Coming Soon!
1. Dockerization for smoother development and testing.
2. A user database seed file for faster setup and exploration.
3. Continued front-end design and styling. 
4. Additional features such as swim lesson sign-up, in-app payment with Strips, and a redesigned announcements page.