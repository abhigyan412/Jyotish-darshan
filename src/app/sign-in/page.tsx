"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function SignInPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{background:#07060F;color:#E8E4D9;}
        .si-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;background:#07060F;position:relative;overflow:hidden;}
        .si-stars{position:fixed;inset:0;background-image:radial-gradient(1px 1px at 20% 15%,rgba(255,255,255,0.6) 0%,transparent 100%),radial-gradient(1px 1px at 80% 25%,rgba(255,255,255,0.4) 0%,transparent 100%),radial-gradient(1.5px 1.5px at 45% 60%,rgba(255,255,255,0.5) 0%,transparent 100%),radial-gradient(1px 1px at 65% 10%,rgba(255,255,255,0.3) 0%,transparent 100%),radial-gradient(1px 1px at 10% 75%,rgba(255,255,255,0.4) 0%,transparent 100%),radial-gradient(1px 1px at 90% 70%,rgba(255,255,255,0.3) 0%,transparent 100%);pointer-events:none;z-index:0;}
        .si-card{position:relative;z-index:1;width:100%;max-width:420px;background:#111026;border:0.5px solid rgba(201,168,76,0.25);border-radius:16px;padding:3rem 2.5rem;box-shadow:0 40px 80px rgba(0,0,0,0.6);}
        .si-logo{font-family:'Cinzel Decorative',serif;font-size:0.85rem;color:#C9A84C;letter-spacing:2px;text-align:center;margin-bottom:0.5rem;}
        .si-divline{width:40px;height:0.5px;background:rgba(201,168,76,0.3);margin:0 auto 2rem;}
        .si-title{font-family:'Cinzel',serif;font-size:1.1rem;letter-spacing:2px;color:#E8E4D9;text-align:center;margin-bottom:0.5rem;}
        .si-sub{font-family:'EB Garamond',serif;font-size:0.9rem;color:#9E96B8;font-style:normal;text-align:center;margin-bottom:2.5rem;}
        .si-error{background:rgba(239,68,68,0.1);border:0.5px solid rgba(239,68,68,0.3);color:#FCA5A5;padding:10px 14px;border-radius:8px;font-size:0.82rem;margin-bottom:1.5rem;font-family:'EB Garamond',serif;}
        .si-google{width:100%;padding:12px 16px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(201,168,76,0.2);border-radius:8px;color:#E8E4D9;font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:1.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;margin-bottom:1.5rem;}
        .si-google:hover{background:rgba(201,168,76,0.06);border-color:rgba(201,168,76,0.45);}
        .si-google:disabled{opacity:0.5;cursor:not-allowed;}
        .si-sep{display:flex;align-items:center;gap:12px;margin-bottom:1.5rem;}
        .si-sep-line{flex:1;height:0.5px;background:rgba(201,168,76,0.12);}
        .si-sep-text{font-family:'Cinzel',serif;font-size:0.6rem;letter-spacing:2px;color:#5A5470;}
        .si-input{width:100%;padding:12px 16px;background:rgba(255,255,255,0.03);border:0.5px solid rgba(201,168,76,0.2);border-radius:8px;color:#E8E4D9;font-family:'EB Garamond',serif;font-size:1rem;outline:none;transition:border-color 0.2s;margin-bottom:12px;}
        .si-input:focus{border-color:rgba(201,168,76,0.55);}
        .si-input::placeholder{color:#5A5470;}
        .si-btn{width:100%;padding:13px 16px;background:#C9A84C;border:none;border-radius:8px;color:#07060F;font-family:'Cinzel',serif;font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:opacity 0.2s,transform 0.2s;}
        .si-btn:hover:not(:disabled){opacity:0.88;transform:translateY(-1px);}
        .si-btn:disabled{opacity:0.5;cursor:not-allowed;}
        .si-note{margin-top:1.5rem;text-align:center;font-family:'EB Garamond',serif;font-size:0.85rem;color:#5A5470;font-style:normal;}
        .si-back{display:block;text-align:center;margin-top:1.5rem;font-family:'Cinzel',serif;font-size:0.65rem;letter-spacing:1.5px;color:#5A5470;text-decoration:none;transition:color 0.2s;}
        .si-back:hover{color:#C9A84C;}
        .si-sent{text-align:center;}
        .si-sent-icon{font-size:2.5rem;margin-bottom:1rem;display:block;}
        .si-sent-title{font-family:'Cinzel',serif;font-size:0.9rem;letter-spacing:2px;color:#C9A84C;margin-bottom:0.75rem;}
        .si-sent-text{font-family:'EB Garamond',serif;font-size:0.95rem;color:#9E96B8;font-style:normal;line-height:1.7;}
        .si-sent-email{color:#E8C97A;font-style:normal;}
      `}</style>

      <div className="si-wrap">
        <div className="si-stars" />

        <div className="si-card">
          {sent ? (
            <div className="si-sent">
              <span className="si-sent-icon">✦</span>
              <div className="si-sent-title">CHECK YOUR EMAIL</div>
              <p className="si-sent-text">
                A sign-in link has been sent to<br/>
                <span className="si-sent-email">{email}</span><br/><br/>
                Click the link in the email to enter your reading.
              </p>
            </div>
          ) : (
            <>
              <div className="si-logo">✦ Jyotish Darshan</div>
              <div className="si-divline" />
              <div className="si-title">ENTER YOUR READING</div>
              <p className="si-sub">Sign in to access your Kundli and continue your journey</p>

              {error && <div className="si-error">{error}</div>}

              <button className="si-google" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>

              <div className="si-sep">
                <div className="si-sep-line" />
                <span className="si-sep-text">OR</span>
                <div className="si-sep-line" />
              </div>

              <form onSubmit={handleEmailSignIn}>
                <input
                  className="si-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <button className="si-btn" type="submit" disabled={loading || !email}>
                  {loading ? "Sending…" : "✦ Send Magic Link"}
                </button>
              </form>

              <p className="si-note">No password needed — we'll email you a sign-in link</p>
            </>
          )}

          <a href="/" className="si-back">← Return to Jyotish Darshan</a>
        </div>
      </div>
    </>
  );
}