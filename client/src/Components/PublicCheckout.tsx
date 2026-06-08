import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { completePublicCheckout, getPublicCheckout } from "../Api/auth";

type CheckoutDetails = {
  token: string;
  resourceType: "invoice" | "subscription";
  clientName: string;
  title: string;
  amount: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);

const PublicCheckout = () => {
  const { token = "" } = useParams();
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [message, setMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        const response = await getPublicCheckout(token);
        setDetails(response.data.data);
      } catch (error: any) {
        setMessage(error.response?.data?.message || "Checkout link is unavailable");
      }
    };

    loadCheckout();
  }, [token]);

  const completeCheckout = async () => {
    try {
      setIsPaying(true);
      await completePublicCheckout(token);
      setIsComplete(true);
      setMessage(
        details?.resourceType === "subscription"
          ? "Subscription confirmed. The agency has been notified."
          : "Payment received. The agency has been notified.",
      );
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Could not complete checkout");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="checkout-panel">
        <div className="checkout-hero">
          <p className="eyebrow">Secure client checkout</p>
          <h1>{details?.resourceType === "subscription" ? "Subscribe to your plan" : "Pay your invoice"}</h1>
          <p>Complete the payment from this client page. No agency workspace login is required.</p>
        </div>

        <section className="auth-card checkout-card">
          {message && <div className={`alert ${isComplete ? "alert-info" : "alert-danger"} py-2`}>{message}</div>}

          {details ? (
            <>
              <div>
                <p className="eyebrow">{details.resourceType}</p>
                <h2>{details.title}</h2>
              </div>
              <div className="checkout-summary">
                <div>
                  <span>Client</span>
                  <strong>{details.clientName}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{money(details.amount)}</strong>
                </div>
              </div>
              <button className="btn btn-primary w-100" disabled={isPaying || isComplete} onClick={completeCheckout}>
                {isComplete ? "Completed" : isPaying ? "Processing..." : details.resourceType === "subscription" ? "Confirm subscription" : "Pay invoice"}
              </button>
            </>
          ) : (
            <p className="muted">Loading checkout...</p>
          )}

          <p className="auth-link">
            Agency user? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
};

export default PublicCheckout;
