import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaIdCard } from "react-icons/fa";
import InputField from "../components/InputField";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import "../styles/DriverLogin.css";
function DriverLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    driverId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ FIXED
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };
 const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.driverId || !form.password) {
    setError("Please enter Driver ID and Password");
    return;
  }

  setLoading(true);

  setTimeout(() => {

    const correctDriverId = "drv123";
    const correctPassword = "123456";

    if (
      form.driverId === correctDriverId &&
      form.password === correctPassword
    ) {

      // save login session
      localStorage.setItem(
        "driver",
        JSON.stringify({
          driverId: form.driverId,
          loggedIn: true
        })
      );

      setError("");
      navigate("/dashboard");

    } else {

      setError("Invalid Driver ID or Password");

    }

    setLoading(false);

  }, 1000);
};
  return (
    <div className="page-container">
      <div className="left-panel">
        <img src="/logo.png" className="logo" />
        <div className="hero-content">
          <h1>
            Sheger Bus System
            
          </h1>
          <p>
            AI-powered transportation system
            for smarter and safer journeys.
          </p>
        </div>
        <div className="feature-container">
          <div className="feature-card">
            <h3>Live Tracking</h3>
            <p>Track buses in real time</p>
          </div>
          <div className="feature-card">
            <h3>AI Traffic</h3>
            <p>Smart route prediction</p>
          </div>
          <div className="feature-card">
            <h3>Safe Trips</h3>
            <p>Better passenger experience</p>
          </div>
        </div>
      </div>
      <div className="right-panel">
        <div className="login-card">
          <h2>Driver Login</h2>
          <p className="welcome-text">
            Welcome back! Please login to continue.
          </p>
          <div className="error-text">
            {error}
          </div>
          <form onSubmit={handleLogin}>
            <InputField
              name="driverId"
              label="Driver ID"
              placeholder="Enter your driver ID"
              value={form.driverId}
              onChange={handleChange}
              icon={<FaIdCard />}
              error={!!error && !form.driverId}
            />
            <PasswordInput
              name="password"
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={!!error && !form.password}
            />
            <div 
  className="forgot-password"
  onClick={() => navigate("/forgot-password")}
>
  Forgot Password?
</div>
            <Button
              text={loading ? "Logging in..." : "Login"}
              disabled={loading}
            />
          </form>
          <div className="signup-text">
            Don't have an account?
            <span onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DriverLogin;