import React, { useMemo, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { acceptInvitation } from "../Api/auth";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [form, setForm] = useState({
    token: tokenFromUrl,
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await acceptInvitation(form.token, form.email, form.password);
      navigate("/login");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not accept invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel compact">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Team invitation</p>
            <h2>Join workspace</h2>
          </div>

          {message && <div className="alert alert-danger py-2">{message}</div>}

          <label className="form-label">
            Invite token
            <input
              type="text"
              name="token"
              value={form.token}
              onChange={handleChange}
              className="form-control"
              placeholder="Paste invite token"
            />
          </label>

          <label className="form-label">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="form-control"
              placeholder="teammate@example.com"
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="form-control"
              placeholder="Minimum 6 characters"
            />
          </label>

          <button className="btn btn-primary w-100" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Accept invitation"}
          </button>

          <p className="auth-link">
            Already accepted? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default AcceptInvitation;
