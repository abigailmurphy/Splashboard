// RegistrationWizard.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useUserProfile from "./hooks/useUserProfile";

import Step0Greet from "./steps/Step0GreetRenew";
import Step1UserInfo from "./steps/Step1UserInfo";
import Step2Address from "./steps/Step2Address";
import Step3Spouse from "./steps/Step3Spouse";
import Step4Children from "./steps/Step4Children";
//import Step5Reason from "./steps/Step5Reason";
import Step6Membership from "./steps/Step6Membership";
import Step7Summary from "./steps/Step7SummaryRenew";

const allSteps = [
  Step0Greet, //TODO: Change to re-apply info
  Step1UserInfo,
  Step2Address,
  Step3Spouse,
  Step4Children,
  //Step5Reason,
  Step6Membership,
  Step7Summary,
];
function ProgressBar({ currentStep }) {
  const stepLabels = [
    "User Info",
    "Address",
    "Spouse",
    "Children",
    "Membership",
    "Summary",
  ];

  return (
    <div className="progress-container">
      {stepLabels.map((label, index) => {
        const stepIndex = index + 1; // offset because Step0 is greet
        const isActive = currentStep === stepIndex;
        const isCompleted = currentStep > stepIndex;

        return (
          <div key={label} className="progress-step">
            <div
              className={`progress-bubble ${
                isActive ? "active" : isCompleted ? "completed" : ""
              }`}
            >
              {stepIndex}
            </div>
            <span className="progress-label">{label}</span>
            {index !== stepLabels.length - 1 && (
              <div className="progress-line"></div>
            )}
          </div>
        );
      })}
    </div>
  );
}


export default function ReApply() {
  const [step, setStep] = useState(0);
  const { user, fetchUser } = useUserProfile();

  const [formData, setFormData] = useState({
    first: "",
    last: "",
    email: "",
    
    sfirst: "",
    slast: "",
    semail:"",
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
    wantsToApply: true,
    
  });
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first: user.name.first || "",
        last: user.name.last || "",
        email: user.email || "",
        cell: user.cell || "",
        cell2: user.cell2 || "",
        homePhone: user.homePhone || "",
        workPhone: user.workPhone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
        sfirst: user.spouse?.sfirst || "",
        slast: user.spouse?.slast || "",
        semail: user.spouse?.semail || "",
        children: user.children || [],
        membershipType: user.membershipType || "individual",
        membershipPeople: user.membershipPeople || [],
      }));
    }
  }, [user]);

 

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
