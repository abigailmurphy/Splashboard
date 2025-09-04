import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ManageWaitlist from "./manage/ManageWaitlist";
import ManageMembers from "./manage/ManageMembers";
import ManageOffers from "./manage/ManageOffers";

export default function ManageTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "members";
  const [activeTab, setActiveTab] = useState(initialTab);

  // keep URL and state in sync
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "members";
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }); // updates ?tab= in the URL
  };

  return (
    <div className="waitlist-dashboard">
     

      <div className="tabs">
        <button
          className={`tab ${activeTab === "members" ? "active" : ""}`}
          onClick={() => handleTabClick("members")}
        >
          Members
        </button>
        <button
          className={`tab ${activeTab === "waitlist" ? "active" : ""}`}
          onClick={() => handleTabClick("waitlist")}
        >
          Waitlist
        </button>
        <button
          className={`tab ${activeTab === "offers" ? "active" : ""}`}
          onClick={() => handleTabClick("offers")}
        >
          Offers
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "offers" && <ManageOffers />}
        {activeTab === "waitlist" && <ManageWaitlist />}
        {activeTab === "members" && <ManageMembers />}
      </div>
    </div>
  );
}
