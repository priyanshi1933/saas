import React, { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../Api/auth";
import { loginSchema, validateWithJoi, type ValidationErrors } from "../Validation/userSchema";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors<keyof typeof form>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: validationErrors, isValid } = validateWithJoi(loginSchema, form);
    setErrors(validationErrors);
    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await loginUser(form.email, form.password);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("organizationId", response.data.organizationId);
      localStorage.setItem("userId", response.data.id);
      navigate("/dashboard");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Run invoices, payments, and subscriptions from one workspace</h1>
          <p>Sign in to manage your agency clients and recurring revenue.</p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Sign in</p>
            <h2>Agency dashboard</h2>
          </div>

          {message && <div className="alert alert-danger py-2">{message}</div>}

          <label className="form-label">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="owner@agency.com"
            />
            <span className="invalid-feedback">{errors.email}</span>
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="Your password"
            />
            <span className="invalid-feedback">{errors.password}</span>
          </label>

          <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>

          <p className="auth-link">
            New agency? <Link to="/register">Create workspace</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Login;
