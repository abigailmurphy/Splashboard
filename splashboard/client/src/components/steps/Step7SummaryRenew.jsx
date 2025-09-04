import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context";

function Step7Summary({ formData, back }) {
  const navigate = useNavigate();
  const { setHasApplied } = useAuth();

  const currentMembers = formData.membershipPeople || [];

  // Display-only cost calc
  const totalCost =
    formData.membershipType === "individual"
      ? `$${(currentMembers.length || 0) * 250}`
      : "$580";

  // Build payload exactly like backend expects
  const buildPayload = (action /* "save" | "submit" */) => ({
    season: formData.season || String(new Date().getFullYear()),
    action,
    membershipType: formData.membershipType,

    // contact snapshot saved on MembershipRecord
    address: {
      street: formData.address || "",
      city: formData.city || "",
      state: formData.state || "",
      zipCode: formData.zipCode || "",
    },
    cell: formData.cell || "",
    cell2: formData.cell2 || "",
    homePhone: formData.homePhone || "",
    workPhone: formData.workPhone || "",

    // spouse + children (coerce DOBs)
    sfirst: formData.sfirst || "",
    slast: formData.slast || "",
    semail: formData.semail || "",
    children: (formData.children || []).map((child) => ({
      ...child,
      dob: child.dob ? new Date(child.dob) : null,
    })),

    // MEMBERSHIP ROSTER goes to MembershipRecord
    membershipPeople: (formData.membershipPeople || []).map((p) => ({
      ...p,
      dob: p.dob ? new Date(p.dob) : undefined,
    })),

    // optional notes
    notes: formData.notes || undefined,
  });

  const saveDraft = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/applyMembership",
        buildPayload("save"),
        { withCredentials: true }
      );
      if (res.data.status) {
        alert("Draft saved!");
      } else {
        alert("Error: " + (res.data.message || "Failed to save draft"));
      }
    } catch (err) {
      console.error("Save draft error", err);
      alert("Something went wrong saving draft");
    }
  };

  const submitApplication = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/applyMembership",
        buildPayload("submit"),
        { withCredentials: true }
      );
      if (res.data.status) {
        alert("Membership application submitted!");
        setHasApplied(true); // your Context flag
        navigate("/thankyou");
      } else {
        alert("Error: " + (res.data.message || "Failed to apply"));
      }
    } catch (err) {
      console.error("Submit error", err);
      alert("Something went wrong submitting application");
    }
  };

  return (
    <div className="wizard-card-content">
      <h2 className="register-title">Review Your Information</h2>

      {/* PERSONAL INFO */}
      <div className="summary-section">
        <h3 className="section-title">Personal Information</h3>
        <p><strong>Name:</strong> {formData.first} {formData.last}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Primary Phone:</strong> {formData.cell}</p>
        {formData.cell2 && <p><strong>Secondary Cell:</strong> {formData.cell2}</p>}
        {formData.homePhone && <p><strong>Home Phone:</strong> {formData.homePhone}</p>}
        {formData.workPhone && <p><strong>Work Phone:</strong> {formData.workPhone}</p>}
      </div>

      {/* ADDRESS */}
      <div className="summary-section">
        <h3 className="section-title">Address</h3>
        <p>{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</p>
      </div>

      {/* SPOUSE */}
      {(formData.sfirst || formData.slast || formData.semail) && (
        <div className="summary-section">
          <h3 className="section-title">Spouse Information</h3>
          <p><strong>Name:</strong> {formData.sfirst} {formData.slast}</p>
          {formData.semail && <p><strong>Email:</strong> {formData.semail}</p>}
        </div>
      )}

      {/* CHILDREN */}
      {formData.children?.length > 0 && (
        <div className="summary-section">
          <h3 className="section-title">Children</h3>
          <ul className="list-disc pl-5">
            {formData.children.map((c, i) => (
              <li key={i}>
                {c.firstName} {c.lastName}
                {c.dob && ` — DOB: ${c.dob}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MEMBERSHIP DETAILS */}
      {currentMembers.length > 0 && (
        <div className="summary-section">
          <h3 className="section-title">Membership Roster</h3>
          <p><strong>Type:</strong> {formData.membershipType}</p>
          <ul className="list-disc pl-5">
            {currentMembers.map((p, i) => (
              <li key={i}>
                {p.type}: {p.firstName} {p.lastName}
                {p.dob ? ` (DOB: ${p.dob})` : ""}
                {p.semail ? ` — ${p.semail}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="total-display"><strong>Total Cost:</strong> {totalCost}</p>

      {/* NAVIGATION BUTTONS */}
      <div className="wizard-buttons">
        <button onClick={back} className="back-link">
          Back
        </button>
        <button onClick={saveDraft} className="button-9 bg-gray-500 hover:bg-gray-600">
          Save Draft
        </button>
        <button onClick={submitApplication} className="button-9 bg-green-600 hover:bg-green-700">
          Join the Waitlist
        </button>
      </div>
    </div>
  );
}

export default Step7Summary;
