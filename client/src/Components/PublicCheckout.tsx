import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
<<<<<<< HEAD
import { completePublicCheckout, getPublicCheckout } from "../Api/auth";
=======
import { completePublicCheckout, createPublicRazorpayCheckout, getPublicCheckout } from "../Api/auth";
>>>>>>> c3eebe6 (first commit)

type CheckoutDetails = {
  token: string;
  resourceType: "invoice" | "subscription";
  clientName: string;
  title: string;
  amount: number;
<<<<<<< HEAD
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);

=======
  currency: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  order_id: string;
  notes: Record<string, string>;
  handler: (response: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
  prefill?: {
    name?: string;
  };
  theme?: {
    color?: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
  }).format(value || 0);

const loadRazorpay = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.body.appendChild(script);
  });

>>>>>>> c3eebe6 (first commit)
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
<<<<<<< HEAD

=======
>>>>>>> c3eebe6 (first commit)
    loadCheckout();
  }, [token]);

  const completeCheckout = async () => {
<<<<<<< HEAD
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
=======
    if (!details) return;

    try {
      setIsPaying(true);
      setMessage("");
      await loadRazorpay();

      const response = await createPublicRazorpayCheckout(token);
      const checkout = response.data.data;

      const Razorpay = window.Razorpay;
      if (!Razorpay) throw new Error("Razorpay Checkout is unavailable");

      const razorpay = new Razorpay({
        ...checkout,
        prefill: {
          name: details.clientName,
        },
        theme: {
          color: "#1f7a5c",
        },
        handler: async (paymentResponse) => {
          try {
            await completePublicCheckout(token, paymentResponse);
            setIsComplete(true);
            setMessage(
              details.resourceType === "subscription"
                ? "Subscription activated. The agency has been notified."
                : "Payment received. The agency has been notified.",
            );
          } catch (error: any) {
            setMessage(error.response?.data?.message || "Could not verify payment");
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });

      razorpay.open();
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || "Could not complete checkout");
>>>>>>> c3eebe6 (first commit)
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
<<<<<<< HEAD
          {message && <div className={`alert ${isComplete ? "alert-info" : "alert-danger"} py-2`}>{message}</div>}
=======
          {message && (
            <div className={`alert ${isComplete ? "alert-info" : "alert-danger"} py-2`}>
              {message}
            </div>
          )}
>>>>>>> c3eebe6 (first commit)

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
<<<<<<< HEAD
                  <strong>{money(details.amount)}</strong>
                </div>
              </div>
              <button className="btn btn-primary w-100" disabled={isPaying || isComplete} onClick={completeCheckout}>
                {isComplete ? "Completed" : isPaying ? "Processing..." : details.resourceType === "subscription" ? "Confirm subscription" : "Pay invoice"}
              </button>
            </>
          ) : (
            <p className="muted">Loading checkout...</p>
=======
                  <strong>{money(details.amount, details.currency)}</strong>
                </div>
              </div>
              <button
                className="btn btn-primary w-100"
                disabled={isPaying || isComplete}
                onClick={completeCheckout}
              >
                {isComplete
                  ? "Completed"
                  : isPaying
                  ? "Opening Razorpay..."
                  : details.resourceType === "subscription"
                  ? "Subscribe with Razorpay"
                  : "Pay with Razorpay"}
              </button>
            </>
          ) : (
            !message && <p className="muted">Loading checkout...</p>
>>>>>>> c3eebe6 (first commit)
          )}

          <p className="auth-link">
            Agency user? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
};

<<<<<<< HEAD
export default PublicCheckout;
=======
export default PublicCheckout;
>>>>>>> c3eebe6 (first commit)
