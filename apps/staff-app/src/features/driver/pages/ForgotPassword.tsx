import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import InputField from "../components/InputField";
import Button from "../components/Button";
function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email");
      return;
    }
    setMessage("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage("Reset link sent to your email ✅");
    }, 1500);
  };
  return (
    <div className="page-container">
      <div className="right-panel">
        <div className="login-card">
          <h2>Forgot Password</h2>
          <p className="welcome-text">
            Enter your email to reset password
          </p>
          <form onSubmit={handleSubmit}>
            <InputField
              name="email"
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              icon={<FaEnvelope />}
            />

            <Button
              text={loading ? "Sending..." : "Send Reset Link"}
              disabled={loading}
            />

          </form>

          {message && (
            <div className="success-text">
              {message}
            </div>
          )}

          <div
            className="signup-text"
            onClick={() => navigate("/")}
          >
            ← Back to Login
          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;