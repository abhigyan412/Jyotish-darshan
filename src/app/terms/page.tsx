import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Jyotish Darshan",
  description: "Terms of Service for Jyotish Darshan — Vedic Kundli AI Chart Interpretation",
};

export default function TermsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600&family=EB+Garamond:wght@400;500&display=swap');
        :root{--gold:#C9A84C;--gold-dim:rgba(201,168,76,0.35);--lbg:#07060F;--lsurface:#111026;--ltext:#F0EDE4;--lmuted:#C4BEDD;--ldim:#9E96B8;}
        .pp *{margin:0;padding:0;box-sizing:border-box;}
        .pp{background:var(--lbg);color:var(--ltext);font-family:'EB Garamond',Georgia,serif;font-size:18px;line-height:1.8;min-height:100vh;}
        .pp-nav{padding:1.2rem 3rem;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid var(--gold-dim);}
        .pp-logo{font-family:'Cinzel Decorative',serif;font-size:1rem;color:var(--gold);letter-spacing:2px;text-decoration:none;}
        .pp-back{font-family:'Cinzel',serif;font-size:0.85rem;letter-spacing:2px;color:#C4BEDD;text-decoration:none;transition:color 0.2s;}
        .pp-back:hover{color:var(--gold);}
        .pp-wrap{max-width:760px;margin:0 auto;padding:4rem 2rem 6rem;}
        .pp-label{font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin-bottom:1rem;display:block;}
        .pp-title{font-family:'Cinzel Decorative',serif;font-size:clamp(1.8rem,4vw,2.8rem);color:var(--ltext);margin-bottom:0.5rem;line-height:1.2;}
        .pp-date{font-size:0.9rem;color:var(--ldim);margin-bottom:3rem;padding-bottom:2rem;border-bottom:0.5px solid rgba(201,168,76,0.15);}
        .pp-h2{font-family:'Cinzel',serif;font-size:1rem;letter-spacing:1px;color:var(--gold);margin:2.5rem 0 1rem;}
        .pp-p{color:var(--lmuted);margin-bottom:1rem;font-size:1rem;}
        .pp-ul{color:var(--lmuted);padding-left:1.5rem;margin-bottom:1rem;}
        .pp-ul li{margin-bottom:0.4rem;font-size:1rem;}
        .pp-ul li::marker{color:var(--gold);}
        .pp-footer{border-top:0.5px solid var(--gold-dim);padding:2rem 3rem;text-align:center;font-size:0.8rem;color:var(--ldim);font-family:'Cinzel',serif;letter-spacing:1px;}
      `}</style>

      <div className="pp">
        <nav className="pp-nav">
          <Link href="/" className="pp-logo">✦ Jyotish Darshan</Link>
          <Link href="/" className="pp-back">← Back to Home</Link>
        </nav>

        <div className="pp-wrap">
          <span className="pp-label">✦ Legal</span>
          <h1 className="pp-title">Terms of Service</h1>
          <p className="pp-date">Last updated: June 30, 2026</p>

          <p className="pp-p">
            By accessing or using Jyotish Darshan at jyotishdarshan.pro, you agree to be bound by these Terms of Service. Please read them carefully before using our service.
          </p>

          <h2 className="pp-h2">1. Service Description</h2>
          <p className="pp-p">
            Jyotish Darshan provides AI-powered Vedic astrology (Jyotish) chart generation and interpretation services. Our platform uses classical Lahiri Ayanamsa calculations combined with AI language models to provide chart readings.
          </p>

          <h2 className="pp-h2">2. Important Disclaimer</h2>
          <p className="pp-p" style={{ background: "rgba(201,168,76,0.05)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "1rem 1.25rem" }}>
            Jyotish Darshan provides Vedic astrological readings for <strong style={{ color: "var(--gold)" }}>self-reflection and informational purposes</strong>. While our calculations follow classical Jyotish methodology, astrological insights are interpretive in nature and should complement, not replace, professional advice in medical, legal, financial, or psychological matters. We encourage you to use these readings as one perspective among many when making important life decisions.
          </p>

          <h2 className="pp-h2">3. User Accounts</h2>
          <ul className="pp-ul">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be at least 13 years old to use the service</li>
            <li>One account per person — multiple accounts are not permitted</li>
          </ul>

          <h2 className="pp-h2">4. Subscription & Payments</h2>
          <ul className="pp-ul">
            <li>Subscriptions are valid for 30 days from the date of payment</li>
            <li>To continue uninterrupted access, you must manually renew before your plan expires</li>
            <li>Your account automatically reverts to the Free plan when your paid period ends</li>
            <li>Refunds are not provided once a payment is processed</li>
            <li>We reserve the right to change pricing with 30 days notice</li>
            <li>Payments are processed by Razorpay — subject to their terms</li>
          </ul>

          <h2 className="pp-h2">5. Free Plan Limitations</h2>
          <p className="pp-p">
            The free plan includes 3 saved charts and 20 AI messages per month. These limits reset on the first day of each calendar month. We reserve the right to modify free plan limits at any time.
          </p>

          <h2 className="pp-h2">6. Acceptable Use</h2>
          <p className="pp-p">You agree not to:</p>
          <ul className="pp-ul">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to reverse engineer or scrape our AI models</li>
            <li>Share your account credentials with others</li>
            <li>Use automated tools to generate excessive API requests</li>
            <li>Resell or redistribute chart readings without our permission</li>
          </ul>

          <h2 className="pp-h2">7. Intellectual Property</h2>
          <p className="pp-p">
            The Jyotish Darshan platform, including its design, code, and AI models, is our intellectual property. Chart readings generated for you are for your personal use only. You may not redistribute or commercialize readings without written permission.
          </p>

          <h2 className="pp-h2">8. Limitation of Liability</h2>
          <p className="pp-p">
            To the maximum extent permitted by law, Jyotish Darshan shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid us in the 3 months preceding the claim.
          </p>

          <h2 className="pp-h2">9. Service Availability</h2>
          <p className="pp-p">
            We strive for high availability but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience downtime. We are not liable for any losses due to service unavailability.
          </p>

          <h2 className="pp-h2">10. Termination</h2>
          <p className="pp-p">
            We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting us at support@jyotishdarshan.pro.
          </p>

          <h2 className="pp-h2">11. Governing Law</h2>
          <p className="pp-p">
            These terms are governed by the laws of India.
          </p>

          <h2 className="pp-h2">12. Contact</h2>
          <p className="pp-p">
            For any questions about these terms, contact us at:<br />
            <a href="mailto:support@jyotishdarshan.pro" style={{ color: "var(--gold)", textDecoration: "none" }}>support@jyotishdarshan.pro</a>
          </p>
        </div>

        <footer className="pp-footer">
          © 2026 Jyotish Darshan · <Link href="/privacy" style={{ color: "var(--gold)", textDecoration: "none" }}>Privacy Policy</Link>
        </footer>
      </div>
    </>
  );
}