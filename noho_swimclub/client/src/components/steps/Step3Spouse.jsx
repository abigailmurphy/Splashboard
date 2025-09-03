function Step3Spouse({ formData, setFormData, next, back }) {
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Spouse Information</h2>

      {/* Name row: first and last side-by-side */}
      <div className="form-row">
        <div className="form-group half">
          <label>Spouse First Name</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="sfirst"
              placeholder="First Name"
              value={formData.sfirst}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group half">
          <label>Spouse Last Name</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="slast"
              placeholder="Last Name"
              value={formData.slast}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Email field (optional) */}
      <div className="form-group">
        <label>Spouse Email (optional)</label>
        <div className="input-wrapper">
          <input
            type="email"
            name="semail"
            placeholder="example@email.com"
            value={formData.semail}
            onChange={handleChange}
          />
          
        </div>
        <p className="helper-text">
            Adding an email will allow the spouse to be added to the email list as well.
          </p>
      </div>

      {/* Navigation buttons */}
      <div className="wizard-buttons">
        <button onClick={back} className="back-link">
          Back
        </button>
        <button onClick={next} className="button-9">
          Next
        </button>
      </div>
    </div>
  );
}

export default Step3Spouse;
