function Step4Children({ formData, setFormData, next, back }) {
  const addChild = () =>
    setFormData({
      ...formData,
      children: [...formData.children, { firstName: "", lastName: "", dob: "" }],
    });

  const updateChild = (index, key, value) => {
    const updatedChildren = formData.children.map((child, i) =>
      i === index ? { ...child, [key]: value } : child
    );
    setFormData({ ...formData, children: updatedChildren });
  };

  const removeChild = (index) => {
    const updatedChildren = formData.children.filter((_, i) => i !== index);
    setFormData({ ...formData, children: updatedChildren });
  };

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Children</h2>
      <p className="helper-text">
            The children added here are not automatically added to the membership and can be removed later. If you would like to add children now for other purposes you may.
      </p>

      {/* Child cards */}
      {formData.children.map((child, index) => (
        <div key={index} className="child-card">
          <div className="child-card-header">
            <h3 className="child-card-title">Child {index + 1}</h3>
            <button
              onClick={() => removeChild(index)}
              className="remove-child-btn"
            >
              Remove
            </button>
          </div>

          {/* Name row: first + last side by side */}
          <div className="form-row">
            <div className="form-group half">
              <label>First Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="First Name"
                  value={child.firstName}
                  onChange={(e) => updateChild(index, "firstName", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group half">
              <label>Last Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={child.lastName}
                  onChange={(e) => updateChild(index, "lastName", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label>Date of Birth</label>
            <div className="input-wrapper">
              <input
                type="date"
                value={child.dob}
                onChange={(e) => updateChild(index, "dob", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add child button */}
      <button onClick={addChild} className="add-child-btn">
        + Add Child
      </button>

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

export default Step4Children;
