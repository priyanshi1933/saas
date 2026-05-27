import React, { useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { tenantSignup } from "../Api/auth";

const Register = () => {
  const [form, setForm] = useState({
    organizationName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    organizationName: "",
    email: "",
    password: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validate = () => {
    const nextErrors = {
      organizationName: form.organizationName.trim().length < 2 ? "Organization name is required" : "",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "" : "Please enter a valid email",
      password: form.password.length >= 6 ? "" : "Password must be at least 6 characters",
      general: "",
    };
    setErrors(nextErrors);
    return !nextErrors.organizationName && !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await tenantSignup(form.organizationName, form.email, form.password);
      const { token, role, organizationId, userId } = response.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("organizationId", organizationId);
      localStorage.setItem("userId", userId);
      localStorage.setItem("workspaceName", form.organizationName.trim());
      navigate("/dashboard");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || "Could not create workspace",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Agency workspace</p>
          <h1>Create your billing dashboard</h1>
          <p>
            Set up an isolated organization for invoices, client payments, subscriptions, and team access.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Tenant signup</p>
            <h2>Start workspace</h2>
          </div>

          {errors.general && <div className="alert alert-danger py-2">{errors.general}</div>}

          <label className="form-label">
            Organization name
            <input
              type="text"
              name="organizationName"
              value={form.organizationName}
              onChange={handleChange}
              className={`form-control ${errors.organizationName ? "is-invalid" : ""}`}
              placeholder="Pixel & Ledger Studio"
            />
            <span className="invalid-feedback">{errors.organizationName}</span>
          </label>

          <label className="form-label">
            Owner email
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
              placeholder="Minimum 6 characters"
            />
            <span className="invalid-feedback">{errors.password}</span>
          </label>

          <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating workspace..." : "Create workspace"}
          </button>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Register;
