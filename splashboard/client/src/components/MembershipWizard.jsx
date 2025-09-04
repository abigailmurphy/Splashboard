// RegistrationWizard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useUserProfile from "./hooks/useUserProfile";
import axios from "axios";

import Step0Greet from "./steps/Step0Greet";
import Step1UserInfo from "./steps/Step1UserInfo";
import Step2Address from "./steps/Step2Address";
import Step3Spouse from "./steps/Step3Spouse";
import Step4Children from "./steps/Step4Children";
import Step6Membership from "./steps/Step6Membership";
import Step7Summary from "./steps/Step7Summary";

const allSteps = [
  Step0Greet,
  Step1UserInfo,
  Step2Address,
  Step3Spouse,
  Step4Children,
  Step6Membership,
  Step7Summary,
];

function ProgressBar({ currentStep }) {
  const stepLabels = ["User Info", "Address", "Spouse", "Children", "Membership", "Summary"];
  return (
    <div className="progress-container">
      {stepLabels.map((label, index) => {
        const stepIndex = index + 1; // Step0 is greet
        const isActive = currentStep === stepIndex;
        const isCompleted = currentStep > stepIndex;
        return (
          <div key={label} className="progress-step">
            <div className={`progress-bubble ${isActive ? "active" : isCompleted ? "completed" : ""}`}>
              {stepIndex}
            </div>
            <span className="progress-label">{label}</span>
            {index !== stepLabels.length - 1 && <div className="progress-line"></div>}
          </div>
        );
      })}
    </div>
  );
}

export default function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const { user } = useUserProfile();

  const [formData, setFormData] = useState({
    first: "",
    last: "",
    email: "",

    sfirst: "",
    slast: "",
    semail: "",

    // flat UI fields; Step7 will send object {street, city, state, zipCode}
    address: "",
    city: "",
    state: "",
    zipCode: "",

    cell: "",
    cell2: "",
    homePhone: "",
    workPhone: "",

    children: [],
    membershipType: "individual",
    membershipPeople: [],   // lives on MembershipRecord
    notes: "",

    wantsToApply: true,
    season: String(new Date().getFullYear()),
  });

  // 1) Hydrate from User (baseline)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("http://localhost:4000/user/init", {
          params: { season: formData.season },
          withCredentials: true,
        });
        if (res.data?.status && res.data.formDefaults) {
          setFormData(prev => ({ ...prev, ...res.data.formDefaults }));
        }
      } catch (e) {
        // no draft yet is fine; user-only defaults remain
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    

  const steps = allSteps;
  const StepComponent = steps[step];
  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const back = () => setStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="wizard-wrapper">
      <div className="wizard-card large">
        {step > 0 && <ProgressBar currentStep={step} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <StepComponent
              formData={formData}
              setFormData={setFormData}
              next={next}
              back={back}
              isLastStep={step === steps.length - 1}
              isFirstStep={step === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
