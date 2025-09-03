import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useAuth } from "./Context";

function Login() {
  const { setIsLoggedIn, setIsAdmin, setHasOffer, setIsMember, setHasApplied } = useAuth();
  const location = useLocation();
  const fromApply = new URLSearchParams(location.search).get("from") === "apply";
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const generateError = (error) =>
    toast.error(error, { position: "bottom-right" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/login",
        values,
        { withCredentials: true }
      );

      if (data.status) {
        setIsLoggedIn(true);
        setIsAdmin(data.user.isAdmin);
        setHasOffer(data.user.hasOffer);
        setIsMember(data.user.isMember);
        setHasApplied(data.user.hasApplied);
        navigate(fromApply ? "/membership-wizard" : "/");
      } else if (data.errors) {
        const { email, password } = data.errors;
        if (email) generateError(email);
        else if (password) generateError(password);
      }
    } catch (ex) {
      console.log("Login error:", ex);
      generateError("Login failed. Please try again.");
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2 className="register-title">Login to your Account</h2>
        <p className="register-subtitle">
          Access your profile and manage your membership.
        </p>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                name="email"
                placeholder="Email"
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Password with eye toggle */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })
                }
                required
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
              </span>
            </div>

            {/* Forgot Password Link */}
            <p className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </p>
          </div>

          <button type="submit" className="button-9">
            Login
          </button>

          <p className="register-footer">
            Don’t have an account?{" "}
            <Link
              to={fromApply ? "/register?from=apply" : "/register"}
              className="register-link"
            >
              Register
            </Link>
          </p>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}

export default Login;
