import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Jyotish Darshan",
  description: "Privacy Policy for Jyotish Darshan — Vedic Kundli AI Chart Interpretation",
};

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600&family=EB+Garamond:wght@400;500&display=swap');
        :root{--gold:#C9A84C;--gold-dim:rgba(201,168,76,0.35);--lbg:#07060F;--lsurface:#111026;--ltext:#F0EDE4;--lmuted:#C4BEDD;--ldim:#9E96B8;}
        .pp *{margin:0;padding:0;box-sizing:border-box;}
        .pp{background:var(--lbg);color:var(--ltext);font-family:'EB Garamond',Georgia,serif;font-size:18px;line-height:1.8;min-height:100vh;}
        .pp-nav{padding:1.2rem 3rem;display:flex;align-items:center;justify-content:space-between;border-bottom:0.5px solid var(--gold-dim);}
        .pp-logo{font-family:'Cinzel Decorative',serif;font-size:1rem;color:var(--gold);letter-spacing:2px;text-decoration:none;}
        .pp-back{font-family:'Cinzel',serif;font-size:0.75rem;letter-spacing:2px;color:var(--ldim);text-decoration:none;transition:color 0.2s;}
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
          <h1 className="pp-title">Privacy Policy</h1>
          <p className="pp-date">Last updated: June 30, 2026</p>

          <p className="pp-p">
            Jyotish Darshan ("we", "our", or "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our Vedic astrology service at jyotishdarshan.pro.
          </p>

          <h2 className="pp-h2">1. Information We Collect</h2>
          <p className="pp-p">We collect the following information when you use our service:</p>
          <ul className="pp-ul">
            <li><strong>Account information</strong> — your email address when you sign up via Google OAuth or magic link</li>
            <li><strong>Birth details</strong> — name, date of birth, time of birth, and place of birth that you provide to generate your Kundli</li>
            <li><strong>Chat messages</strong> — your questions and AI responses stored to provide conversation history</li>
            <li><strong>Payment information</strong> — processed securely by Razorpay; we do not store card details</li>
            <li><strong>Usage data</strong> — number of messages sent, charts generated, for plan limit enforcement</li>
          </ul>

          <h2 className="pp-h2">2. How We Use Your Information</h2>
          <ul className="pp-ul">
            <li>To generate your Vedic Kundli chart and provide AI interpretations</li>
            <li>To save and retrieve your charts and conversation history</li>
            <li>To enforce subscription plan limits</li>
            <li>To process payments via Razorpay</li>
            <li>To send transactional emails (sign-in links, payment confirmations)</li>
            <li>To improve the accuracy and quality of our AI readings</li>
          </ul>

          <h2 className="pp-h2">3. Data Storage & Security</h2>
          <p className="pp-p">
            Your data is stored securely on Supabase (PostgreSQL database) with row-level security enabled. All data is encrypted in transit using HTTPS/TLS. We do not sell, rent, or share your personal information with third parties for marketing purposes.
          </p>

          <h2 className="pp-h2">4. Third-Party Services</h2>
          <p className="pp-p">
            We use trusted third-party infrastructure providers to operate our service securely. These providers process data only as necessary to deliver the service and are bound by their own privacy policies. We do not share your personal information with third parties for advertising or marketing purposes.
          </p>

          <h2 className="pp-h2">5. Your Rights</h2>
          <p className="pp-p">You have the right to:</p>
          <ul className="pp-ul">
            <li>Access all personal data we hold about you</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Export your chart and conversation data</li>
            <li>Opt out of any non-transactional communications</li>
          </ul>
          <p className="pp-p">
            To exercise any of these rights, contact us at: <a href="mailto:support@jyotishdarshan.pro" style={{ color: "var(--gold)", textDecoration: "none" }}>support@jyotishdarshan.pro</a>
          </p>

          <h2 className="pp-h2">6. Cookies</h2>
          <p className="pp-p">
            We use essential cookies only — for authentication sessions. We do not use tracking or advertising cookies.
          </p>

          <h2 className="pp-h2">7. Children's Privacy</h2>
          <p className="pp-p">
            Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13.
          </p>

          <h2 className="pp-h2">8. Changes to This Policy</h2>
          <p className="pp-p">
            We may update this policy from time to time. We will notify you of significant changes by email or by posting a notice on our website. Continued use of the service after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="pp-h2">9. Contact</h2>
          <p className="pp-p">
            For any privacy-related questions or concerns, contact us at:<br />
            <a href="mailto:support@jyotishdarshan.pro" style={{ color: "var(--gold)", textDecoration: "none" }}>support@jyotishdarshan.pro</a>
          </p>
        </div>

        <footer className="pp-footer">
          © 2026 Jyotish Darshan · <Link href="/terms" style={{ color: "var(--gold)", textDecoration: "none" }}>Terms of Service</Link>
        </footer>
      </div>
    </>
  );
}