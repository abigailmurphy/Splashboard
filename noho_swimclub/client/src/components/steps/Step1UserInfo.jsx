import React from "react";

export default function Step1UserInfo({ formData, setFormData, next, back }) {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Confirm Your Information</h2>

      <div className="form-row">
      {/* First Name */}
      <div className="form-group half">
        <label>First Name</label>
        <div className="input-wrapper">
          <input
            type="text"
            name="first"
            placeholder="First Name"
            value={formData.first}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Last Name */}
      <div className="form-group half">
        <label>Last Name</label>
        <div className="input-wrapper">
          <input
            type="text"
            name="last"
            placeholder="Last Name"
            value={formData.last}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>

      {/* Email (disabled) */}
      <div className="form-group">
        <label>Email</label>
        <div className="input-wrapper">
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="disabled-input"
          />
          
        </div>
        <p className="helper-text">
            Email cannot be changed here. Update your profile if this is incorrect.
          </p>
      </div>

      {/* Navigation Buttons */}
      <div className="wizard-buttons">
        <button onClick={back} className="back-link">
          Back
        </button>
        <button onClick={next} className="button-9 button-huge flex justify-center items-center">
          Next
        </button>
      </div>
    </div>
  );
}
