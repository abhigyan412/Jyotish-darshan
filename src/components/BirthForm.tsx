"use client";
import { useState, useRef, useEffect } from "react";
import type { BirthDetails } from "@/types";

interface Props {
  onSubmit: (details: BirthDetails) => void;
  loading: boolean;
}

interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function BirthForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<BirthDetails>({
    name: "",
    dob: "1990-04-15",
    tob: "08:30",
    pob: "",
    lat: 0,
    lon: 0,
    timezone: 5.5,
  });
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof BirthDetails, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Measure input position for fixed dropdown
  function measureInput() {
    if (inputRef.current) {
      setDropdownRect(inputRef.current.getBoundingClientRect());
    }
  }

  async function geocodeCity(city: string) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: GeoSuggestion[] = await res.json();
      if (city === latestRef.current) {
        setSuggestions(data);
        measureInput();
      }
    } catch {
      // keep existing
    }
  }

  function handleCityInput(val: string) {
    setCityInput(val);
    setLocationConfirmed(false);
    latestRef.current = val;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => geocodeCity(val), 400);
  }

  function selectSuggestion(s: GeoSuggestion) {
    const lat = parseFloat(parseFloat(s.lat).toFixed(4));
    const lon = parseFloat(parseFloat(s.lon).toFixed(4));
    const isIndia = s.display_name.toLowerCase().includes("india");
    const tz = isIndia ? 5.5 : parseFloat((lon / 15).toFixed(1));
    const cityName = s.display_name.split(",")[0].trim();
    setCityInput(cityName);
    set("pob", cityName);
    set("lat", lat);
    set("lon", lon);
    set("timezone", tz);
    setSuggestions([]);
    setLocationConfirmed(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dob || !form.tob) { alert("Please enter birth date and time."); return; }
    if (!locationConfirmed) { alert("Please select a city from the dropdown."); return; }
    onSubmit(form);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const open = suggestions.length > 0 && dropdownRect !== null;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mystic-card p-6">
          <div className="text-xs font-cinzel text-gold tracking-widest mb-5">☽ BIRTH DETAILS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-xs tracking-widest mb-1" style={{ color: "var(--dim)" }}>FULL NAME</label>
              <input className="mystic-input" type="text" placeholder="Arjun Sharma"
                value={form.name} onChange={e => set("name", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs tracking-widest mb-1" style={{ color: "var(--dim)" }}>DATE OF BIRTH</label>
              <input className="mystic-input" type="date" value={form.dob}
                onChange={e => set("dob", e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs tracking-widest mb-1" style={{ color: "var(--dim)" }}>TIME OF BIRTH</label>
              <input className="mystic-input" type="time" value={form.tob}
                onChange={e => set("tob", e.target.value)} required />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs tracking-widest mb-1" style={{ color: "var(--dim)" }}>
                CITY OF BIRTH
              </label>
              <input
                ref={inputRef}
                className="mystic-input"
                type="text"
                placeholder="Type city name e.g. Varanasi..."
                value={cityInput}
                onChange={e => handleCityInput(e.target.value)}
                autoComplete="off"
              />
              {locationConfirmed && (
                <div className="mt-2 text-xs flex gap-2 items-center" style={{ color: "var(--gold)" }}>
                  ✦ {form.pob} · {form.lat}°N, {form.lon}°E · UTC+{form.timezone}
                </div>
              )}
            </div>

          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
            {loading ? "⟳ Calculating…" : "✦ GENERATE KUNDLI ✦"}
          </button>
        </div>
      </form>

      {/* Fixed dropdown — rendered outside any overflow:hidden parent */}
      {open && dropdownRect && (
        <div
          style={{
            position: "fixed",
            top: dropdownRect.bottom + 4,
            left: dropdownRect.left,
            width: dropdownRect.width,
            background: "var(--surface2, #181730)",
            border: "0.5px solid rgba(201,168,76,0.4)",
            borderRadius: 10,
            zIndex: 9999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxHeight: 280,
            overflowY: "auto",
            animation: "jdSlide 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={e => { e.preventDefault(); selectSuggestion(s); }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: i < suggestions.length - 1
                  ? "0.5px solid rgba(201,168,76,0.08)"
                  : "none",
                fontSize: 14,
                color: "var(--text, #E8E4D9)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontWeight: 500, marginBottom: 2 }}>
                {s.display_name.split(",")[0]}
              </div>
              <div style={{ fontSize: 11, color: "var(--dim, #5A5470)" }}>
                {s.display_name.split(",").slice(1, 3).join(",").trim()}
                {" · "}
                {parseFloat(s.lat).toFixed(2)}°N {parseFloat(s.lon).toFixed(2)}°E
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes jdSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}