import React from "react";
import { ArrowRight } from "lucide-react";

export default function Step0Greet({ next }) {
  return (

      <div>
        <h1 className="wizard-title">Welcome!</h1>
        <p className="wizard-subtitle">
          Please indicate below if you would like to continue your membership for the upcoming season. 
          If you would like to continue your membership for this coming year, please follow the steps to confirm your information and pay. 

          The deadline to confirm is APRIL 1st. After this date, we will open up memberships to the waitlist.
        </p>

        {/* Main CTA - biggest button */}
        <button
          onClick={next}
          className="button-9 button-huge flex justify-center items-center"
        >
          Continue to Membership Renewal
          <ArrowRight className="ml-3" size={28} />
        </button>

        {/* Divider */}
        <div className="divider">
          <span>or</span>
        </div>

        {/* Secondary actions */}
        <div className="wizard-secondary">
          <button
            onClick={() => (window.location.href = "/lessons")}
            className="button-3 button-gradient w-full"
          >
            I will not be continuing this year.
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="back-link"
          >
            Back to Home
          </button>
        </div>
      </div>
 
  );
}
