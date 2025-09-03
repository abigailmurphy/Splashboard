import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./Context";

const Register = () => {
  const { setIsLoggedIn, setIsAdmin, setHasOffer, setIsMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromApply = new URLSearchParams(location.search).get("from") === "apply";

  const [form, setForm] = useState({
    first: "",
    last: "",
    email: "",
    password: "",
    confirmPassword: "",
    cell: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null); // {type, text}

  // Derived state: do passwords match?
  const passwordsMatch =
    form.password && form.confirmPassword && form.password === form.confirmPassword;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (flashMessage) setFlashMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      setFlashMessage({ type: "error", text: "Passwords must match." });
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/register", form, {
        withCredentials: true,
      });

      if (res.data.status) {
        setIsLoggedIn(true);
        setIsAdmin(res.data.user.isAdmin);
        setHasOffer(res.data.user.hasOffer);
        setIsMember(res.data.user.isMember);

        setFlashMessage({ type: "success", text: "Account created successfully!" });

        setTimeout(() => {
          navigate(fromApply ? "/membership-wizard" : "/profile");
        }, 1200);
      } else {
        setFlashMessage({ type: "error", text: res.data.message || "Registration failed." });
      }
    } catch (err) {
      console.error(err);
      setFlashMessage({ type: "error", text: "Registration error. Please try again." });
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join us and access exclusive membership features.</p>

        {flashMessage && (
          <div className={`flash ${flashMessage.type}`}>{flashMessage.text}</div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          {/* First Name */}
          <div className="form-group">
            <label>First Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="first"
                required
                value={form.first}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label>Last Name</label>
            <div className="input-wrapper">
              <input
                type="text"
                name="last"
                required
                value={form.last}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </span>
            </div>
          </div>

          {/* Confirm Password with real-time match indicator */}
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`fa ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </span>

              {/* Real-time indicator icon */}
              {form.confirmPassword && (
                <span
                  className={`match-indicator ${
                    passwordsMatch ? "match" : "no-match"
                  }`}
                >
                  {passwordsMatch ? "✓" : "✗"}
                </span>
              )}
            </div>

            {/* New helper text below */}
            {form.confirmPassword && !passwordsMatch && (
              <p className="password-helper error-text">Passwords do not match</p>
            )}
            {form.confirmPassword && passwordsMatch && (
              <p className="password-helper success-text">Passwords match</p>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <input
                type="tel"
                name="cell"
                required
                value={form.cell}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="button-9">
            {fromApply ? "Continue to Waitlist Application" : "Create Account"}
          </button>

          {!fromApply && (
            <p className="register-footer">
              Already have an account?{" "}
              <Link to="/login" className="register-link">
                Log in
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
