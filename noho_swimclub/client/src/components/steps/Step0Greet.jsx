import React from "react";
import { ArrowRight } from "lucide-react";

export default function Step0Greet({ next }) {
  return (

      <div>
        <h1 className="wizard-title">Welcome!</h1>
        <p className="wizard-subtitle">
          Begin your membership application or explore other options below.
        </p>

        {/* Main CTA - biggest button */}
        <button
          onClick={next}
          className="button-9 button-huge flex justify-center items-center"
        >
          Continue to Membership Application
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
            Check Out Swim Lessons
          </button>

          <button
            onClick={() => (window.location.href = "/membership")}
            className="back-link"
          >
            Back to Membership Info
          </button>
        </div>
      </div>
 
  );
}
