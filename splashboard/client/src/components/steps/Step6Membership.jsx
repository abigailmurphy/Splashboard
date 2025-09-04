import { useEffect } from "react";

function Step6Membership({ formData, setFormData, next, back }) {
  // Build initial members list from formData (no membershipType filtering)
  const buildInitialMembers = () => {
    const self = {
      type: "Self",
      firstName: formData.first,
      lastName: formData.last,
    };
    // Start with just Self; user can add spouse/children as needed
    return [self];
  };

  // Initialize membershipPeople once if empty
  useEffect(() => {
    if (!formData.membershipPeople || formData.membershipPeople.length === 0) {
      setFormData((prev) => ({
        ...prev,
        membershipPeople: buildInitialMembers(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep roster when switching type
  const handleTypeChange = (e) => {
    const membershipType = e.target.value;
    setFormData({
      ...formData,
      membershipType, // don't rebuild roster
    });
  };

  const currentMembers = formData.membershipPeople || [];
  const spouseInList = currentMembers.some((m) => m.type === "Spouse");
  const hasProfileSpouse =
    (formData.sfirst && formData.sfirst.trim() !== "") ||
    (formData.slast && formData.slast.trim() !== "") ||
    (formData.semail && formData.semail.trim() !== "");

  // Update fields for a specific member
  const updateMember = (index, field, value) => {
    const updated = [...currentMembers];
    updated[index][field] = value;
    setFormData({ ...formData, membershipPeople: updated });
  };

  // Remove a member
  const removeMember = (index) => {
    const updated = currentMembers.filter((_, i) => i !== index);
    setFormData({ ...formData, membershipPeople: updated });
  };

  // Add spouse FROM PROFILE (Step 3) if present
  const addProfileSpouse = () => {
    if (spouseInList || !hasProfileSpouse) return;
    setFormData({
      ...formData,
      membershipPeople: [
        ...currentMembers,
        {
          type: "Spouse",
          firstName: formData.sfirst || "",
          lastName: formData.slast || "",
          semail: formData.semail || "",
        },
      ],
    });
  };

  // Add brand-new spouse (blank) only if no spouse was entered earlier
  const addNewSpouse = () => {
    if (spouseInList || hasProfileSpouse) return;
    setFormData({
      ...formData,
      membershipPeople: [
        ...currentMembers,
        { type: "Spouse", firstName: "", lastName: "", semail: "" },
      ],
    });
  };

  // Add previously entered child from profile (Step 4)
  const addExistingChild = (child) => {
    if (
      currentMembers.some(
        (m) =>
          m.type === "Child" &&
          m.firstName === child.firstName &&
          m.lastName === child.lastName
      )
    )
      return;

    setFormData({
      ...formData,
      membershipPeople: [
        ...currentMembers,
        {
          type: "Child",
          firstName: child.firstName,
          lastName: child.lastName,
          dob: child.dob,
          id: child._id ? String(child._id) : undefined,
        },
      ],
    });
  };

  // Add brand-new child
  const addNewChild = () => {
    setFormData({
      ...formData,
      membershipPeople: [
        ...currentMembers,
        { type: "Child", firstName: "", lastName: "", dob: "" },
      ],
    });
  };

  // Prepare data before moving to summary
  const handleNext = () => {
    const spouseMember = currentMembers.find((m) => m.type === "Spouse");
    const updatedChildren = currentMembers
      .filter((m) => m.type === "Child")
      .map((c) => ({
        firstName: c.firstName || "",
        lastName: c.lastName || "",
        dob: c.dob || "",
        _id: c.id ? c.id : undefined, // preserve id back into children if present
      }));

    setFormData((prev) => ({
      ...prev,
      sfirst: spouseMember?.firstName || "",
      slast: spouseMember?.lastName || "",
      semail: spouseMember?.semail || "",
      children: updatedChildren,
      membershipPeople: currentMembers,
    }));

    next();
  };

  // Exclude children already in the roster from the "existing children" quick-add row
  const existingChildren =
    formData.children?.filter((child) => {
      return !currentMembers.some(
        (m) =>
          m.type === "Child" &&
          m.firstName === child.firstName &&
          m.lastName === child.lastName
      );
    }) || [];

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Membership Details</h2>

      {/* Membership Type */}
      <div className="form-group">
        <h3 className="section-title">Membership Type</h3>
        <div className="input-wrapper">
          <select
            name="membershipType"
            value={formData.membershipType}
            onChange={handleTypeChange}
          >
            <option value="individual">Individual ($250 per person)</option>
            <option value="family">Family ($580 flat)</option>
          </select>
        </div>
      </div>

      {/* Total */}
      <div className="total-display">
        Total:{" "}
        {formData.membershipType === "individual"
          ? `$${currentMembers.length * 250}`
          : "$580"}
      </div>

      {/* Members List */}
      <h3 className="section-title">Members</h3>
      <div className="space-y-3">
        {currentMembers.map((member, index) => (
          <div key={index} className="child-card">
            <div className="child-card-header">
              <span className="child-card-title">{member.type}</span>
              {member.type !== "Self" && (
                <button
                  onClick={() => removeMember(index)}
                  className="remove-child-btn"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Name Row */}
            <div className="form-row">
              <div className="form-group half">
                <label>First Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={member.firstName || ""}
                    onChange={(e) =>
                      updateMember(index, "firstName", e.target.value)
                    }
                    placeholder="First name"
                  />
                </div>
              </div>
              <div className="form-group half">
                <label>Last Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={member.lastName || ""}
                    onChange={(e) =>
                      updateMember(index, "lastName", e.target.value)
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Spouse Email */}
            {member.type === "Spouse" && (
              <div className="form-group">
                <label>Spouse Email (optional)</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    value={member.semail || ""}
                    onChange={(e) =>
                      updateMember(index, "semail", e.target.value)
                    }
                    placeholder="Spouse email"
                  />
                </div>
              </div>
            )}

            {/* Child DOB */}
            {member.type === "Child" && (
              <div className="form-group">
                <label>Date of Birth</label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    value={member.dob || ""}
                    onChange={(e) => updateMember(index, "dob", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Family Members */}
      <div className="form-section">
        <h3 className="section-title">Add Family Members</h3>
        <div className="add-buttons-row">
          {/* If spouse exists in profile and isn't already in list */}
          {hasProfileSpouse && !spouseInList && (
            <button onClick={addProfileSpouse} className="add-child-btn">
              + Add Spouse from Profile
            </button>
          )}
          {/* Only allow a brand-new spouse if no profile spouse exists and not already in list */}
          {!hasProfileSpouse && !spouseInList && (
            <button onClick={addNewSpouse} className="add-child-btn">
              + Add New Spouse
            </button>
          )}
          <button onClick={addNewChild} className="add-child-btn">
            + Add New Child
          </button>
        </div>
      </div>

      {/* Add Previously Entered Children */}
      {existingChildren.length > 0 && (
        <div className="form-section">
          <p className="font-medium mb-2">Add Previously Entered Children:</p>
          <div className="existing-children-buttons">
            {existingChildren.map((child, idx) => (
              <button
                key={idx}
                onClick={() => addExistingChild(child)}
                className="existing-child-btn"
              >
                + {child.firstName} {child.lastName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="wizard-buttons">
        <button onClick={back} className="back-link">
          Back
        </button>
        <button onClick={handleNext} className="button-9">
          Next
        </button>
      </div>
    </div>
  );
}

export default Step6Membership;
