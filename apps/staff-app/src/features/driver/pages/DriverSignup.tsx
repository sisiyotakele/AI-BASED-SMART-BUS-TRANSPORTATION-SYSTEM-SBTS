import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaIdCard, FaEnvelope } from "react-icons/fa";
import InputField from "../components/InputField";
import PasswordInput from "../components/PasswordInput";
import Button from "../components/Button";
import "../styles/DriverLogin.css";
function Signup() {
const navigate = useNavigate();
const [form, setForm] = useState({
driverId: "",
email: "",
password: "",
confirmPassword: ""
});
const [message, setMessage] = useState("");
const [success, setSuccess] = useState(false);
const [loading, setLoading] = useState(false);
const handleChange = (
e: ChangeEvent<HTMLInputElement>
) => {
setForm({
  ...form,
  [e.target.name]: e.target.value
});
};
const handleSignup = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setSuccess(false);
  if (
    !form.driverId ||
    !form.email ||
    !form.password ||
    !form.confirmPassword
  ) {
    setMessage("Please fill all fields");
    return;
  }
  if (form.password !== form.confirmPassword) {
    setMessage("Passwords do not match");
    return;
  }
  setMessage("");
  setLoading(true);
  setTimeout(() => {
    setLoading(false);
    setSuccess(true);
    setMessage("Account created successfully!");
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
 }, 1500);
};
return (
<div className="page-container">
  <div className="right-panel">
    <div className="login-card">
      <h1>
        📝 Driver Sign Up
      </h1>
      <form onSubmit={handleSignup}>
<InputField
  name="driverId"
  label="Driver ID"
  placeholder="Enter your driver ID"
  value={form.driverId}
  onChange={handleChange}
  icon={<FaIdCard />}
  error={!!message && !form.driverId}
/>
       <InputField
  name="email"
  label="Email"
  type="email"
  placeholder="Enter your email"
  value={form.email}
  onChange={handleChange}
  icon={<FaEnvelope />}
  error={!!message && !form.email}
/>
        <PasswordInput
  name="password"
  label="Password"
  placeholder="Enter your password"
  value={form.password}
  onChange={handleChange}
  error={!!message && !form.password}
/>
<PasswordInput
  name="confirmPassword"
  label="Confirm Password"
  placeholder="Confirm your password"
  value={form.confirmPassword}
  onChange={handleChange}
  error={!!message && !form.confirmPassword}
/>
        <Button text="Create Account" />
      </form>
      {message && (
        <p
          className={
            success 
            ? "success-message" 
            : "error-message"
          }
        >
          {message}
        </p>
      )}
     <div className="login-action">
  <p>
    Already have an account?
  </p>

  <button
    className="login-button"
    onClick={() => navigate("/")}
  >
    Login
  </button>
</div>
    </div>
  </div>
</div>
);
}
export default Signup;
