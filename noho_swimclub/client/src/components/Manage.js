import React, { useState } from "react";
import ManageWaitlist from "./manage/ManageWaitlist";
import ManageMembers from "./manage/ManageMembers";
import ManageOffers from "./manage/ManageOffers";

export default function ManageTabs() {
  const [activeTab, setActiveTab] = useState("members");

  

  return (
    <div className="waitlist-dashboard">
      <h1 className="dashboard-title">Manage</h1>

      {/* Tabs */}
      <div className="tabs">
        
        <button
          className={`tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>
        <button
          className={`tab ${activeTab === "waitlist" ? "active" : ""}`}
          onClick={() => setActiveTab("waitlist")}
        >
          Waitlist
        </button>

        <button
          className={`tab ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => setActiveTab("offers")}
        >
          Offers
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === "offers" && <ManageOffers />}
        {activeTab === "waitlist" && <ManageWaitlist />  }
        {activeTab === "members" && <ManageMembers />  }
      </div>
    </div>
  );
}
