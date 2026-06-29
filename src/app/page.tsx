import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export const metadata = {
  title: "Jyotish Darshan — Vedic Kundli · AI Chart Interpretation",
  description: "Generate your Vedic Kundli in seconds. AI explains every planet, yoga, and dasha in plain personal language — like having a master Jyotishi on call.",
};

const BUBBLES = [
  { s: "♈", l: 5, sz: 48, d: 0, dur: 22, o: 0.07 },
  { s: "♉", l: 12, sz: 36, d: 3, dur: 28, o: 0.05 },
  { s: "♊", l: 22, sz: 56, d: 7, dur: 19, o: 0.08 },
  { s: "♋", l: 33, sz: 40, d: 1, dur: 25, o: 0.06 },
  { s: "♌", l: 45, sz: 64, d: 5, dur: 32, o: 0.07 },
  { s: "♍", l: 55, sz: 42, d: 9, dur: 21, o: 0.05 },
  { s: "♎", l: 65, sz: 52, d: 2, dur: 27, o: 0.08 },
  { s: "♏", l: 75, sz: 38, d: 6, dur: 23, o: 0.06 },
  { s: "♐", l: 85, sz: 60, d: 4, dur: 30, o: 0.07 },
  { s: "♑", l: 92, sz: 34, d: 8, dur: 18, o: 0.05 },
  { s: "♒", l: 18, sz: 50, d: 11, dur: 26, o: 0.06 },
  { s: "♓", l: 38, sz: 44, d: 13, dur: 20, o: 0.07 },
  { s: "♈", l: 8, sz: 28, d: 15, dur: 35, o: 0.04 },
  { s: "♌", l: 28, sz: 70, d: 10, dur: 40, o: 0.04 },
  { s: "♎", l: 48, sz: 32, d: 17, dur: 33, o: 0.05 },
  { s: "♐", l: 70, sz: 58, d: 12, dur: 38, o: 0.04 },
  { s: "♓", l: 88, sz: 46, d: 14, dur: 29, o: 0.05 },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600&family=EB+Garamond:wght@400;500&display=swap');
        :root{--gold:#C9A84C;--gold-light:#E8C97A;--gold-dim:rgba(201,168,76,0.35);--lbg:#07060F;--lbg2:#0D0C1A;--lsurface:#111026;--lsurface2:#181730;--ltext:#F0EDE4;--lmuted:#C4BEDD;--ldim:#9E96B8;}
        .lp *{margin:0;padding:0;box-sizing:border-box;}
        .lp{background:var(--lbg);color:var(--ltext);font-family:'EB Garamond',Georgia,serif;font-size:18px;line-height:1.7;overflow-x:hidden;min-height:100vh;}
        .lp-rashis{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
        .lp-bubble{position:absolute;bottom:-120px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:0.5px solid rgba(201,168,76,0.15);animation:rashiFloat linear infinite;color:rgba(201,168,76,0.8);font-family:'Segoe UI Symbol','Apple Color Emoji',serif;user-select:none;line-height:1;}
        @keyframes rashiFloat{0%{transform:translateY(0) rotate(0deg);opacity:0;}8%{opacity:1;}88%{opacity:1;}100%{transform:translateY(-110vh) rotate(360deg);opacity:0;}}
        .lp-stars{position:fixed;inset:0;background-image:radial-gradient(1px 1px at 20% 15%,rgba(255,255,255,0.6) 0%,transparent 100%),radial-gradient(1px 1px at 80% 25%,rgba(255,255,255,0.4) 0%,transparent 100%),radial-gradient(1.5px 1.5px at 45% 60%,rgba(255,255,255,0.5) 0%,transparent 100%),radial-gradient(1px 1px at 65% 10%,rgba(255,255,255,0.3) 0%,transparent 100%),radial-gradient(1px 1px at 10% 75%,rgba(255,255,255,0.4) 0%,transparent 100%),radial-gradient(1px 1px at 90% 70%,rgba(255,255,255,0.3) 0%,transparent 100%),radial-gradient(1px 1px at 35% 90%,rgba(255,255,255,0.5) 0%,transparent 100%),radial-gradient(1.5px 1.5px at 75% 85%,rgba(255,255,255,0.4) 0%,transparent 100%);pointer-events:none;z-index:0;}
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:1.2rem 3rem;display:flex;align-items:center;justify-content:space-between;background:rgba(7,6,15,0.85);backdrop-filter:blur(12px);border-bottom:0.5px solid var(--gold-dim);}
        .lp-nav-logo{font-family:'Cinzel Decorative',serif;font-size:1rem;color:var(--gold);letter-spacing:2px;text-decoration:none;}
        .lp-btn-primary{font-family:'Cinzel',serif;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;color:#07060F;background:var(--gold);border:none;padding:0.7rem 1.6rem;border-radius:4px;cursor:pointer;text-decoration:none;display:inline-block;transition:opacity 0.2s,transform 0.2s;}
        .lp-btn-primary:hover{opacity:0.88;transform:translateY(-1px);}
        .lp-btn-ghost{font-family:'Cinzel',serif;font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);background:transparent;border:0.5px solid var(--gold-dim);padding:0.9rem 2.2rem;border-radius:4px;cursor:pointer;text-decoration:none;display:inline-block;transition:all 0.2s;}
        .lp-btn-ghost:hover{border-color:var(--gold);background:rgba(201,168,76,0.08);}
        .lp-hero{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8rem 2rem 5rem;}
        .lp-mandala{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:580px;height:580px;opacity:0.04;animation:lpRotate 120s linear infinite;pointer-events:none;}
        @keyframes lpRotate{from{transform:translate(-50%,-50%) rotate(0deg);}to{transform:translate(-50%,-50%) rotate(360deg);}}
        .lp-badge{font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:var(--gold);border:0.5px solid var(--gold-dim);padding:0.4rem 1.2rem;border-radius:20px;margin-bottom:2rem;display:inline-block;}
        .lp-title{font-family:'Cinzel Decorative',serif;font-size:clamp(2.8rem,7vw,5.5rem);font-weight:700;line-height:1.1;letter-spacing:2px;background:linear-gradient(135deg,#E8C97A 0%,#C9A84C 40%,#F0DFA0 70%,#C9A84C 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:1.5rem;}
        .lp-sub{font-size:1.15rem;color:#C4BEDD;font-style:normal;max-width:560px;margin:0 auto 3rem;line-height:1.8;}
        .lp-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;}
        .lp-scroll{margin-top:4rem;color:var(--ldim);font-size:0.75rem;letter-spacing:3px;font-family:'Cinzel',serif;}
        .lp-section{position:relative;z-index:1;padding:6rem 2rem;max-width:1100px;margin:0 auto;}
        .lp-divider{position:relative;z-index:1;display:flex;align-items:center;gap:1rem;padding:0 3rem;margin:1rem 0;}
        .lp-divider::before,.lp-divider::after{content:'';flex:1;height:0.5px;background:var(--gold-dim);}
        .lp-divider span{color:var(--gold);font-size:1.1rem;}
        .lp-label{font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin-bottom:1rem;}
        .lp-h2{font-family:'Cinzel Decorative',serif;font-size:clamp(1.6rem,4vw,2.8rem);line-height:1.2;color:var(--ltext);margin-bottom:1.2rem;}
        .lp-lead{font-size:1.05rem;color:#C4BEDD;font-style:normal;max-width:580px;margin-bottom:3.5rem;}
        .lp-features{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;}
        .lp-card{background:var(--lsurface);border:0.5px solid rgba(201,168,76,0.15);border-radius:12px;padding:2rem;transition:border-color 0.3s;}
        .lp-card:hover{border-color:rgba(201,168,76,0.4);}
        .lp-card-icon{font-size:1.8rem;margin-bottom:1rem;display:block;}
        .lp-card-title{font-family:'Cinzel',serif;font-size:0.82rem;letter-spacing:1px;color:var(--gold);margin-bottom:0.6rem;}
        .lp-card-desc{font-size:0.92rem;color:#C4BEDD;font-style:normal;line-height:1.7;}
        .lp-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;}
        .lp-step-num{font-family:'Cinzel Decorative',serif;font-size:3rem;color:var(--gold-dim);line-height:1;margin-bottom:0.75rem;}
        .lp-step-title{font-family:'Cinzel',serif;font-size:0.82rem;letter-spacing:1px;color:var(--gold);margin-bottom:0.5rem;}
        .lp-step-desc{font-size:0.92rem;color:#C4BEDD;font-style:normal;}
        .lp-testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:1.5rem;}
        .lp-testimonial{background:var(--lsurface);border:0.5px solid rgba(201,168,76,0.12);border-radius:12px;padding:2rem;}
        .lp-testimonial-text{font-style:normal;font-size:0.95rem;color:#E8E4D9;margin-bottom:1.5rem;line-height:1.9;letter-spacing:0.2px;}
        .lp-avatar{width:36px;height:36px;border-radius:50%;background:var(--lsurface2);border:0.5px solid var(--gold-dim);display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;font-size:0.7rem;color:var(--gold);flex-shrink:0;}
        .lp-author-name{font-family:'Cinzel',serif;font-size:0.75rem;letter-spacing:1px;color:var(--gold);}
        .lp-author-detail{font-size:0.8rem;color:#B0A8C8;font-style:normal;}
        .lp-pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:0;max-width:900px;margin:0 auto;border:0.5px solid rgba(201,168,76,0.2);border-radius:16px;overflow:hidden;}
        .lp-pricing-card{background:var(--lsurface);padding:2.5rem 2rem;text-align:left;position:relative;border-right:0.5px solid rgba(201,168,76,0.12);}
        .lp-pricing-card:last-child{border-right:none;}
        .lp-pricing-card.featured{background:linear-gradient(160deg,#13112A,#0D0C1A);border-right:0.5px solid rgba(201,168,76,0.2);}
        .lp-pricing-card.featured::before{content:'MOST POPULAR';position:absolute;top:0;left:50%;transform:translateX(-50%);background:var(--gold);color:#07060F;font-family:'Cinzel',serif;font-size:0.5rem;letter-spacing:2px;padding:3px 12px;border-radius:0 0 8px 8px;}
        .lp-plan{font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:3px;color:var(--gold);margin-bottom:1.25rem;display:block;opacity:0.8;}
        .lp-price{font-family:'Cinzel Decorative',serif;font-size:2.6rem;color:var(--ltext);line-height:1;margin-bottom:0.25rem;}
        .lp-period{font-size:0.78rem;color:#9E96B8;font-style:normal;margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:0.5px solid rgba(201,168,76,0.1);}
        .lp-pf{list-style:none;text-align:left;margin-bottom:2rem;}
        .lp-pf li{font-size:0.85rem;color:#C4BEDD;font-style:normal;padding:0.4rem 0;display:flex;align-items:flex-start;gap:0.6rem;line-height:1.5;}
        .lp-pf li.included::before{content:'✦';color:var(--gold);font-size:0.5rem;flex-shrink:0;margin-top:0.35rem;}
        .lp-pf li.excluded{color:#5A5470;}
        .lp-pf li.excluded::before{content:'–';color:#5A5470;font-size:0.8rem;flex-shrink:0;}
        .lp-pf-section{font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:rgba(201,168,76,0.4);margin:1rem 0 0.5rem;display:block;}
        .lp-faq{max-width:720px;margin:0 auto;}
        .lp-faq-item{border-bottom:0.5px solid rgba(201,168,76,0.12);padding:1.5rem 0;}
        .lp-faq-q{font-family:'Cinzel',serif;font-size:0.84rem;color:var(--ltext);margin-bottom:0.6rem;}
        .lp-faq-a{font-size:0.92rem;color:#C4BEDD;font-style:normal;line-height:1.7;}
        .lp-cta{position:relative;z-index:1;text-align:center;padding:8rem 2rem;}
        .lp-footer{position:relative;z-index:1;border-top:0.5px solid var(--gold-dim);padding:2rem 3rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;}
        .lp-footer-logo{font-family:'Cinzel Decorative',serif;font-size:0.85rem;color:var(--gold);}
        .lp-footer-text{font-size:0.8rem;color:#9E96B8;font-style:normal;}
        .lp-mockup{max-width:800px;margin:3rem auto 0;border-radius:16px;overflow:hidden;border:0.5px solid rgba(201,168,76,0.2);background:var(--lsurface);box-shadow:0 40px 80px rgba(0,0,0,0.5);}
        .lp-mockup-bar{background:var(--lsurface2);padding:0.75rem 1.25rem;display:flex;align-items:center;gap:0.5rem;border-bottom:0.5px solid rgba(201,168,76,0.1);}
        .lp-dot{width:10px;height:10px;border-radius:50%;background:rgba(201,168,76,0.3);}
        .lp-url{font-size:0.7rem;color:var(--ldim);font-family:monospace;margin-left:0.5rem;}
        .lp-mockup-body{padding:2rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        .lp-mockup-panel{background:var(--lsurface2);border:0.5px solid rgba(201,168,76,0.1);border-radius:8px;padding:1.25rem;}
        .lp-mockup-label{font-family:'Cinzel',serif;font-size:0.55rem;letter-spacing:2px;color:var(--gold);margin-bottom:0.75rem;}
        .lp-planet-row{display:flex;justify-content:space-between;align-items:center;padding:0.3rem 0;border-bottom:0.5px solid rgba(201,168,76,0.06);font-size:0.7rem;}
        .lp-planet-badge{font-size:0.55rem;padding:1px 6px;border-radius:10px;background:rgba(201,168,76,0.12);color:var(--gold);}
        .lp-ai-text{font-size:0.75rem;color:#C4BEDD;line-height:1.6;font-style:normal;}
        .lp-ai-label{font-style:normal;color:var(--gold);font-family:'Cinzel',serif;font-size:0.58rem;letter-spacing:1px;display:block;margin-bottom:0.5rem;}
        .lp-compare-header{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0;max-width:900px;margin:0 auto 0;background:var(--lsurface2);border:0.5px solid rgba(201,168,76,0.2);border-radius:12px 12px 0 0;overflow:hidden;}
        .lp-compare-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0;max-width:900px;margin:0 auto;border-left:0.5px solid rgba(201,168,76,0.12);border-right:0.5px solid rgba(201,168,76,0.12);border-bottom:0.5px solid rgba(201,168,76,0.08);}
        .lp-compare-row:last-child{border-bottom:0.5px solid rgba(201,168,76,0.12);border-radius:0 0 12px 12px;}
        .lp-compare-cell{padding:0.75rem 1.25rem;font-size:0.85rem;color:#C4BEDD;border-right:0.5px solid rgba(201,168,76,0.08);display:flex;align-items:center;}
        .lp-compare-cell:last-child{border-right:none;}
        .lp-compare-cell.center{justify-content:center;text-align:center;}
        .lp-compare-cell.featured-col{background:rgba(201,168,76,0.04);}
        @media(max-width:768px){
          .lp-nav{padding:1rem 1.5rem;}
          .lp-mockup-body{grid-template-columns:1fr;}
          .lp-pricing{grid-template-columns:1fr;border-radius:12px;}
          .lp-pricing-card{border-right:none;border-bottom:0.5px solid rgba(201,168,76,0.12);}
          .lp-pricing-card:last-child{border-bottom:none;}
          .lp-compare-header,.lp-compare-row{grid-template-columns:1.5fr 1fr 1fr 1fr;}
          .lp-footer{flex-direction:column;text-align:center;}
        }
      `}</style>

      <div className="lp">
        <div className="lp-stars" />

        <div className="lp-rashis">
          {BUBBLES.map((b, i) => (
            <div key={i} className="lp-bubble" style={{
              left: `${b.l}%`, width: b.sz, height: b.sz,
              fontSize: b.sz * 0.45, opacity: b.o,
              animationDuration: `${b.dur}s`, animationDelay: `${b.d}s`,
            }}>
              {b.s}
            </div>
          ))}
        </div>

        <nav className="lp-nav">
          <span className="lp-nav-logo">✦ Jyotish Darshan</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AuthButton />
            <Link href="/app" className="lp-btn-primary">Generate Your Chart</Link>
          </div>
        </nav>

        <div className="lp-hero">
          <svg className="lp-mandala" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="190" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="155" stroke="white" strokeWidth="0.3" />
            <circle cx="200" cy="200" r="120" stroke="white" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="85" stroke="white" strokeWidth="0.3" />
            <circle cx="200" cy="200" r="50" stroke="white" strokeWidth="0.5" />
            <line x1="200" y1="10" x2="200" y2="390" stroke="white" strokeWidth="0.3" />
            <line x1="10" y1="200" x2="390" y2="200" stroke="white" strokeWidth="0.3" />
            <line x1="55" y1="55" x2="345" y2="345" stroke="white" strokeWidth="0.3" />
            <line x1="345" y1="55" x2="55" y2="345" stroke="white" strokeWidth="0.3" />
          </svg>
          <div className="lp-badge">✦ Ancient Wisdom · Modern Intelligence ✦</div>
          <h1 className="lp-title">Your Destiny,<br />Decoded</h1>
          <p className="lp-sub">Generate your Vedic Kundli in seconds. Then let AI explain every planet, yoga, and dasha in plain, personal language — like having a master Jyotishi on call.</p>
          <div className="lp-actions">
            <Link href="/app" className="lp-btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "0.82rem" }}>✦ Generate My Kundli</Link>
            <a href="#how-it-works" className="lp-btn-ghost">See How It Works</a>
          </div>
          <p className="lp-scroll" style={{ marginTop: "4rem" }}>☽ &nbsp; scroll to discover &nbsp; ☽</p>
        </div>

        <div className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <div className="lp-dot" /><div className="lp-dot" /><div className="lp-dot" />
              <span className="lp-url">jyotishdarshan.pro/chart</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-panel">
                <div className="lp-mockup-label">☽ PLANETARY POSITIONS</div>
                {[["☉ Sun", "Taurus 18.4°", "House 1"], ["☽ Moon", "Scorpio 7.2°", "House 7"], ["♃ Jupiter", "Cancer 14.8°", "Exalted"], ["♀ Venus", "Pisces 22.1°", "House 11"], ["♄ Saturn", "Aquarius 5.6°", "Own Sign"]].map(([name, pos, badge]) => (
                  <div key={name} className="lp-planet-row">
                    <span style={{ color: "var(--ltext)" }}>{name}</span>
                    <span style={{ color: "#C4BEDD" }}>{pos}</span>
                    <span className="lp-planet-badge">{badge}</span>
                  </div>
                ))}
              </div>
              <div className="lp-mockup-panel">
                <div className="lp-mockup-label">✦ AI INTERPRETATION</div>
                <div className="lp-ai-text">
                  <span className="lp-ai-label">✦ JYOTISH GUIDE</span>
                  Your Taurus Lagna bestows a deeply grounded nature — you build slowly, love beauty, and possess remarkable endurance. With Jupiter exalted in Cancer, your mind is both intuitive and philosophical...<br /><br />
                  The Gajakesari Yoga formed by this exalted Jupiter grants natural authority — people seek your counsel without understanding why.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lp-divider"><span>✦</span></div>

        <section className="lp-section" id="features">
          <div className="lp-label">✦ What You Get</div>
          <h2 className="lp-h2">Everything a Master<br />Astrologer Knows</h2>
          <p className="lp-lead">Classical Jyotish calculations. Modern AI clarity. No jargon, no vagueness.</p>
          <div className="lp-features">
            {[
              ["☽", "Accurate Kundli Generation", "Lahiri Ayanamsa sidereal calculations. All 9 Grahas, 12 Bhavas, Lagna, Nakshatra, and Vimshottari Dasha — computed to precise degree."],
              ["✦", "AI Interpretation", "Claude AI reads your chart like a 40-year veteran Jyotishi — explaining personality, career, relationships, health, and spiritual path in flowing prose."],
              ["♃", "Yoga Detection", "Gajakesari, Pancha Mahapurusha, Budhaditya, Neecha Bhanga — every significant yoga in your chart identified and explained in plain language."],
              ["♄", "Vimshottari Dasha", "Your complete Mahadasha and Antardasha timeline. Know exactly which planetary period you are in and what themes it brings right now."],
              ["☿", "Ask Anything", "Chat directly with your chart. Ask about career, marriage timing, lucky periods, remedies — specific answers rooted in your actual planetary positions."],
              ["☉", "Vedic Remedies", "Personalized gemstone recommendations, mantras, fasting days, and charitable acts — tailored specifically to your chart's strengths and weaknesses."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="lp-card">
                <span className="lp-card-icon">{icon}</span>
                <div className="lp-card-title">{title}</div>
                <p className="lp-card-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider"><span>☽</span></div>

        <section className="lp-section" id="how-it-works">
          <div className="lp-label">✦ How It Works</div>
          <h2 className="lp-h2">Three Steps to<br />Self-Knowledge</h2>
          <p className="lp-lead">From birth details to full Vedic reading in under a minute.</p>
          <div className="lp-steps">
            {[
              ["01", "Enter Birth Details", "Name, date, time, and city of birth. Our geocoder auto-detects coordinates and timezone — even for small Indian cities."],
              ["02", "Generate Your Chart", "Classical Lahiri Ayanamsa calculations produce your complete Kundli with all planets, houses, yogas, and dashas instantly."],
              ["03", "Receive AI Reading", "Choose any section — personality, career, relationships, spiritual path, or remedies. Ask follow-up questions in the chart chat."],
            ].map(([num, title, desc]) => (
              <div key={num}>
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-title">{title}</div>
                <p className="lp-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider"><span>✦</span></div>

        <section className="lp-section">
          <div className="lp-label">✦ What People Say</div>
          <h2 className="lp-h2">Trusted by Seekers<br />Across India</h2>
          <div className="lp-testimonials" style={{ marginTop: "3rem" }}>
            {[
              ["RP", "Rajesh Pandey", "Varanasi · Taurus Lagna", "I have consulted many astrologers over 20 years. This AI reading captured nuances about my Shasha Yoga and current Saturn dasha that even my family Jyotishi had not explained so clearly."],
              ["PS", "Priya Sharma", "Pune · Scorpio Moon", "My Moon is in Jyeshtha Nakshatra and I always felt misunderstood. The personality reading explained my emotional nature so accurately — my husband was shocked reading it."],
              ["AK", "Arjun Kumar", "Bangalore · Gemini Lagna", "Used it before a major career decision during my Rahu dasha. The dasha analysis gave me the clarity no human astrologer had managed in three consultations."],
            ].map(([initials, name, detail, quote]) => (
              <div key={name} className="lp-testimonial">
                <p className="lp-testimonial-text">"{quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="lp-avatar">{initials}</div>
                  <div>
                    <div className="lp-author-name">{name}</div>
                    <div className="lp-author-detail">{detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider"><span>☽</span></div>

        {/* ── PRICING ── */}
        <section className="lp-section" style={{ textAlign: "center" }}>
          <div className="lp-label" style={{ display: "block" }}>✦ Pricing</div>
          <h2 className="lp-h2">Simple, Transparent Pricing</h2>
          <p className="lp-lead" style={{ margin: "0 auto 3rem" }}>Start free. Upgrade when the stars align.</p>

          {/* Pricing cards */}
          <div className="lp-pricing">

            {/* FREE */}
            <div className="lp-pricing-card">
              <span className="lp-plan">FREE</span>
              <div className="lp-price">&#8377;0</div>
              <p className="lp-period">forever · no card needed</p>
              <span className="lp-pf-section">KUNDLI</span>
              <ul className="lp-pf">
                <li className="included">Full Kundli generation</li>
                <li className="included">Planetary positions & yogas</li>
                <li className="included">Vimshottari Dasha timeline</li>
                <li className="included">3 saved charts</li>
              </ul>
              <span className="lp-pf-section">AI ACCESS</span>
              <ul className="lp-pf">
                <li className="included">20 AI messages / month</li>
                <li className="excluded">Yearly predictions</li>
                <li className="excluded">Transit analysis</li>
              </ul>
              <Link href="/app" className="lp-btn-ghost" style={{ width: "100%", textAlign: "center", display: "block", marginTop: "1.5rem" }}>Start Free</Link>
            </div>

            {/* BASIC */}
            <div className="lp-pricing-card featured">
              <span className="lp-plan">✦ BASIC</span>
              <div className="lp-price">&#8377;199</div>
              <p className="lp-period">per month · cancel anytime</p>
              <span className="lp-pf-section">KUNDLI</span>
              <ul className="lp-pf">
                <li className="included">Everything in Free</li>
                <li className="included">10 saved charts</li>
                <li className="included">Chart history & reload</li>
              </ul>
              <span className="lp-pf-section">AI ACCESS</span>
              <ul className="lp-pf">
                <li className="included">500 AI messages / month</li>
                <li className="included">Yearly predictions</li>
                <li className="included">Transit analysis</li>
              </ul>
              <Link href="/app?upgrade=basic" className="lp-btn-primary" style={{ width: "100%", textAlign: "center", display: "block", marginTop: "1.5rem" }}>Get Basic &#8377;199/mo</Link>
            </div>

            {/* PRO */}
            <div className="lp-pricing-card">
              <span className="lp-plan">✦ PRO</span>
              <div className="lp-price">&#8377;999</div>
              <p className="lp-period">per month · cancel anytime</p>
              <span className="lp-pf-section">KUNDLI</span>
              <ul className="lp-pf">
                <li className="included">Everything in Basic</li>
                <li className="included">Unlimited saved charts</li>
                <li className="included">Priority chart processing</li>
              </ul>
              <span className="lp-pf-section">AI ACCESS</span>
              <ul className="lp-pf">
                <li className="included">Unlimited AI messages</li>
                <li className="included">Yearly predictions</li>
                <li className="included">Transit analysis</li>
                <li className="included">Priority support</li>
              </ul>
              <Link href="/app?upgrade=pro" className="lp-btn-primary" style={{ width: "100%", textAlign: "center", display: "block", marginTop: "1.5rem" }}>Get Pro &#8377;999/mo</Link>
            </div>
          </div>

          {/* Feature comparison table */}
          <div style={{ marginTop: "3rem" }}>
            <div className="lp-compare-header">
              <div className="lp-compare-cell" style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", letterSpacing: "2px", color: "var(--gold)", padding: "1rem 1.25rem" }}>FEATURE</div>
              <div className="lp-compare-cell center" style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", letterSpacing: "2px", color: "#9E96B8", padding: "1rem 1.25rem" }}>FREE</div>
              <div className="lp-compare-cell center featured-col" style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", letterSpacing: "2px", color: "var(--gold)", padding: "1rem 1.25rem" }}>BASIC</div>
              <div className="lp-compare-cell center" style={{ fontFamily: "Cinzel, serif", fontSize: "0.65rem", letterSpacing: "2px", color: "#9E96B8", padding: "1rem 1.25rem" }}>PRO</div>
            </div>
            {[
              ["Kundli Generation",         "✦", "✦", "✦"],
              ["Planetary Positions",        "✦", "✦", "✦"],
              ["Yoga Detection",             "✦", "✦", "✦"],
              ["Vimshottari Dasha",          "✦", "✦", "✦"],
              ["Saved Charts",               "3", "10", "Unlimited"],
              ["AI Messages / Month",        "20", "500", "Unlimited"],
              ["Yearly Predictions",         "–", "✦", "✦"],
              ["Transit Analysis",           "–", "✦", "✦"],
              ["Priority Support",           "–", "–", "✦"],
            ].map(([feature, free, basic, pro]) => (
              <div key={feature} className="lp-compare-row">
                <div className="lp-compare-cell" style={{ color: "#C4BEDD", fontSize: "0.82rem" }}>{feature}</div>
                <div className="lp-compare-cell center" style={{ color: free === "–" ? "#5A5470" : "var(--gold)", fontSize: free === "–" ? "1rem" : "0.7rem" }}>{free}</div>
                <div className="lp-compare-cell center featured-col" style={{ color: basic === "–" ? "#5A5470" : "var(--gold)", fontSize: basic === "–" ? "1rem" : "0.7rem", fontWeight: 600 }}>{basic}</div>
                <div className="lp-compare-cell center" style={{ color: pro === "–" ? "#5A5470" : "var(--gold)", fontSize: pro === "–" ? "1rem" : "0.7rem" }}>{pro}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider"><span>✦</span></div>

        <section className="lp-section">
          <div className="lp-label">✦ Questions</div>
          <h2 className="lp-h2">Frequently Asked</h2>
          <div className="lp-faq" style={{ marginTop: "3rem" }}>
            {[
              ["How accurate are the calculations?", "We use the Lahiri Ayanamsa (the standard adopted by the Government of India) with VSOP87 planetary positions. Results are accurate to within 1–2 degrees — sufficient for reliable house and yoga determination."],
              ["Is my data private?", "Your birth details are used only to generate your chart and are not stored on our servers unless you create an account. We do not sell or share any personal information."],
              ["Can I cancel my subscription anytime?", "Yes — cancel anytime from your account. You keep access until the end of your billing period. No questions asked."],
              ["Can I use this for Kundli Milan (marriage matching)?", "Not yet — Kundli Milan with Ashtakoota scoring is on our roadmap. For now, you can ask the chart chat about relationship compatibility based on your individual chart."],
              ["Do I need to know astrology to use this?", "Not at all. The AI explanations are written for everyone — from complete beginners to experienced practitioners. The app grows with your knowledge."],
            ].map(([q, a]) => (
              <div key={q} className="lp-faq-item">
                <div className="lp-faq-q">{q}</div>
                <p className="lp-faq-a">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-cta">
          <div className="lp-label" style={{ display: "block", marginBottom: "1.5rem" }}>✦ Begin Your Journey</div>
          <h2 className="lp-h2" style={{ maxWidth: 560, margin: "0 auto 1.5rem" }}>The Stars Have Been<br />Waiting For You</h2>
          <p style={{ color: "#C4BEDD", fontStyle: "normal", marginBottom: "3rem", fontSize: "1.05rem" }}>Your chart was written at the moment of your birth.<br />It is time to read it.</p>
          <Link href="/app" className="lp-btn-primary" style={{ fontSize: "0.85rem", padding: "1.2rem 3rem" }}>✦ Generate My Free Kundli ✦</Link>
        </div>

        <footer className="lp-footer">
          <div className="lp-footer-logo">✦ Jyotish Darshan</div>
          <div className="lp-footer-text">Vedic Kundli · AI Chart Interpretation · Built with reverence for the shastra</div>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <Link href="/privacy" style={{ fontSize: "0.75rem", color: "#5A5470", textDecoration: "none", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: "0.75rem", color: "#5A5470", textDecoration: "none", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>Terms</Link>
            <div style={{ fontSize: "0.75rem", color: "#9E96B8", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>&#169; 2026 Jyotish Darshan</div>
          </div>
        </footer>
      </div>
    </>
  );
}