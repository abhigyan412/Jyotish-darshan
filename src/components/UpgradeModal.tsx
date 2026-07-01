"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface Props {
  reason: string;
  limitType: "message" | "chart" | "feature";
  onClose: () => void;
}

// Updated to match real measured Zima cost data — see cost audit.
// "basic" renamed to "weekly" with corrected limits and price.
const PLANS = [
  {
    key: "weekly",
    name: "Weekly",
    price: "₹99",
    period: "/week",
    features: ["5 charts", "20 messages/week", "Yearly predictions", "Transit analysis"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹1299",
    period: "/month",
    featured: true,
    features: ["50 charts", "250 messages/month", "Yearly predictions", "Transit analysis", "Priority support"],
  },
];

export default function UpgradeModal({ reason, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: string) {
    setLoading(plan);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/sign-in"; return; }

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");

      const periodLabel = plan === "weekly" ? "Weekly" : "Monthly";

      const rzp = new (window as any).Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Jyotish Darshan",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ${periodLabel}`,
        order_id: data.orderId,
        prefill: { email: user.email },
        theme: { color: "#C9A84C" },
        handler: async (response: any) => {
          const verify = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan }),
          });
          if (verify.ok) window.location.href = "/";
          else setError("Payment verification failed. Please contact support.");
        },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .um-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(4, 3, 10, 0.92);
          backdrop-filter: blur(12px);
          display: flex; align-items: flex-start; justify-content: center;
          /* FIX: was align-items:center with no scroll fallback — on short
             mobile viewports this clipped the modal top/bottom with no way
             to reach the cut-off content. Now top-aligned with padding and
             the overlay itself scrolls if the modal is taller than the screen. */
          padding: 2rem 1rem;
          overflow-y: auto;
        }
        .um-modal {
          position: relative;
          width: 100%; max-width: 580px;
          margin: auto 0; /* keeps it vertically centered when it DOES fit, top-aligned when it doesn't */
          background: linear-gradient(160deg, #13112A 0%, #0D0C1A 100%);
          border: 0.5px solid rgba(201,168,76,0.25);
          border-radius: 20px;
          padding: 3rem 2.5rem 2.5rem;
          box-shadow: 0 40px 80px rgba(0,0,0,0.7), inset 0 0.5px 0 rgba(201,168,76,0.15);
          max-height: calc(100vh - 4rem);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .um-close {
          position: sticky; top: 0; float: right;
          margin-top: -1.75rem; margin-right: -1.5rem;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(13,12,26,0.9);
          border: 0.5px solid rgba(201,168,76,0.2);
          color: #9E96B8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size:0.98rem; transition: all 0.2s;
          z-index: 2;
        }
        .um-close:hover { color: #C9A84C; border-color: rgba(201,168,76,0.5); }
        .um-header { text-align: center; margin-bottom: 2rem; clear: both; }
        .um-badge {
          display: inline-block;
          font-family: 'Cinzel', serif; font-size: 0.6rem; letter-spacing: 3px;
          color: #C9A84C;
          border: 0.5px solid rgba(201,168,76,0.3);
          border-radius: 20px; padding: 0.3rem 1rem;
          margin-bottom: 1rem;
        }
        .um-title {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1.5rem; color: #F0EDE4;
          margin-bottom: 0.5rem; line-height: 1.2;
        }
        .um-reason {
          font-family: 'EB Garamond', serif;
          font-size: 1rem; color: #B0A8C8;
          font-style:normal; line-height: 1.6;
        }
        .um-divider {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        .um-divider::before, .um-divider::after {
          content: ''; flex: 1; height: 0.5px;
          background: rgba(201,168,76,0.15);
        }
        .um-divider span { color: #C9A84C; font-size:0.95rem; }
        .um-plans {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1rem; margin-bottom: 1.25rem;
        }
        .um-plan {
          background: rgba(255,255,255,0.02);
          border: 0.5px solid rgba(201,168,76,0.15);
          border-radius: 14px; padding: 1.75rem 1.5rem;
          text-align: center; transition: border-color 0.2s;
          display: flex; flex-direction: column;
        }
        .um-plan:hover { border-color: rgba(201,168,76,0.35); }
        .um-plan.featured {
          background: rgba(201,168,76,0.04);
          border-color: rgba(201,168,76,0.4);
          box-shadow: 0 0 30px rgba(201,168,76,0.06);
        }
        .um-plan-tag {
          font-family: 'Cinzel', serif; font-size:0.95rem;
          letter-spacing: 3px; color: #C9A84C;
          margin-bottom: 1rem;
        }
        .um-plan-price {
          font-family: 'Cinzel Decorative', serif;
          font-size: 2rem; color: #F0EDE4;
          line-height: 1; margin-bottom: 0.25rem;
        }
        .um-plan-period {
          font-family: 'EB Garamond', serif;
          font-size: 0.8rem; color: #9E96B8;
          margin-bottom: 1.25rem;
        }
        .um-plan-divider {
          height: 0.5px; background: rgba(201,168,76,0.1);
          margin-bottom: 1.25rem;
        }
        .um-features {
          list-style: none; text-align: left;
          margin-bottom: 1.5rem; flex: 1;
        }
        .um-features li {
          font-family: 'EB Garamond', serif;
          font-size: 0.9rem; color: #C4BEDD;
          padding: 0.3rem 0;
          display: flex; align-items: center; gap: 0.5rem;
          border-bottom: 0.5px solid rgba(201,168,76,0.06);
        }
        .um-features li:last-child { border-bottom: none; }
        .um-features li::before {
          content: '✦'; color: #C9A84C;
          font-size: 0.45rem; flex-shrink: 0;
        }
        .um-btn {
          width: 100%; padding: 0.75rem;
          background: linear-gradient(135deg, #C9A84C, #E8C97A);
          border: none; border-radius: 8px;
          color: #07060F;
          font-family: 'Cinzel', serif;
          font-size:0.90rem; letter-spacing: 1.5px;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
          margin-top: auto;
        }
        .um-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .um-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .um-btn-ghost {
          width: 100%; padding: 0.75rem;
          background: transparent;
          border: 0.5px solid rgba(201,168,76,0.2);
          border-radius: 10px; color: #9E96B8;
          font-family: 'Cinzel', serif;
          font-size:0.90rem; letter-spacing: 1.5px;
          cursor: pointer; transition: all 0.2s;
        }
        .um-btn-ghost:hover { color: #C9A84C; border-color: rgba(201,168,76,0.4); }
        .um-error {
          background: rgba(239,68,68,0.08);
          border: 0.5px solid rgba(239,68,68,0.25);
          color: #FCA5A5; padding: 0.75rem 1rem;
          border-radius: 8px; font-size:1rem;
          text-align: center; margin-bottom: 1rem;
          font-family: 'EB Garamond', serif;
        }
        @media(max-width: 480px) {
          .um-overlay { padding: 1rem 0.75rem; }
          .um-modal { padding: 2rem 1.25rem 1.75rem; max-height: calc(100vh - 2rem); }
          .um-plans { grid-template-columns: 1fr; }
          .um-title { font-size: 1.2rem; }
          .um-close { margin-right: -0.75rem; }
        }
      `}</style>

      <div className="um-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="um-modal">
          <button className="um-close" onClick={onClose}>✕</button>

          <div className="um-header">
            <div className="um-badge">✦ UPGRADE YOUR PLAN ✦</div>
            <h2 className="um-title">Unlock Full Access</h2>
            <p className="um-reason">{reason}</p>
          </div>

          <div className="um-divider"><span>✦</span></div>

          {error && <div className="um-error">{error}</div>}

          <div className="um-plans">
            {PLANS.map(plan => (
              <div key={plan.key} className={`um-plan${plan.featured ? " featured" : ""}`}>
                <div className="um-plan-tag">{plan.featured ? "✦ MOST POPULAR" : "WEEKLY"}</div>
                <div className="um-plan-price">{plan.price}</div>
                <div className="um-plan-period">{plan.period}</div>
                <div className="um-plan-divider" />
                <ul className="um-features">
                  {plan.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button
                  className="um-btn"
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading !== null}
                >
                  {loading === plan.key ? "Processing…" : `Get ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          <button className="um-btn-ghost" onClick={onClose}>
            Continue with Free Plan
          </button>
        </div>
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </>
  );
}