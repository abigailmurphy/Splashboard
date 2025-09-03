function Step2Address({ formData, setFormData, next, back }) {
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Address and Additional Contact</h2>

      {/* Address Section */}
      <div className="form-section">
        <h3 className="section-title">Address</h3>

        <div className="form-group">
          <label>Street Address</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>City</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group half">
            <label>State</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Zip Code</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="zipCode"
              placeholder="12345"
              value={formData.zipCode}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Phone Section */}
      <div className="form-section">
        <h3 className="section-title">Phone Numbers</h3>

        <div className="form-group">
          <label>Primary Cell Phone</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="cell"
              placeholder="(123) 456-7890"
              value={formData.cell}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Secondary Cell Phone (Optional)</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="cell2"
              placeholder="(123) 456-7890"
              value={formData.cell2}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Home Phone</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="homePhone"
              placeholder="(123) 456-7890"
              value={formData.homePhone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Work Phone</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="workPhone"
              placeholder="(123) 456-7890"
              value={formData.workPhone}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
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

export default Step2Address;
