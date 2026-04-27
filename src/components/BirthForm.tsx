"use client";
import { useState, useRef } from "react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: keyof BirthDetails, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  async function geocodeCity(city: string) {
    if (city.trim().length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results: GeoSuggestion[] = await res.json();
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  }

  function handleCityInput(val: string) {
    setCityInput(val);
    setLocationConfirmed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Birth Details */}
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

          {/* City with autocomplete */}
          <div className="sm:col-span-2" style={{ position: "relative" }}>
            <label className="block text-xs tracking-widest mb-1" style={{ color: "var(--dim)" }}>
              CITY OF BIRTH
            </label>
            <input
              className="mystic-input"
              type="text"
              placeholder="Type city name e.g. Varanasi..."
              value={cityInput}
              onChange={e => handleCityInput(e.target.value)}
              autoComplete="off"
            />

            {/* Confirmed location badge */}
            {locationConfirmed && (
              <div className="mt-2 text-xs flex gap-2 items-center" style={{ color: "var(--gold)" }}>
                ✦ {form.pob} · {form.lat}°N, {form.lon}°E · UTC+{form.timezone}
              </div>
            )}

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--surface2)",
                border: "0.5px solid rgba(201,168,76,0.4)",
                borderRadius: 8,
                marginTop: 4,
                maxHeight: 220,
                overflowY: "auto",
                zIndex: 100,
              }}>
                {suggestions.map((s, i) => (
                  <div key={i} onClick={() => selectSuggestion(s)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "0.5px solid rgba(201,168,76,0.08)",
                      fontSize: 14,
                      color: "var(--text)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontWeight: 500 }}>{s.display_name.split(",")[0]}</div>
                    <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2 }}>
                      {s.display_name.split(",").slice(1, 3).join(",")} · {parseFloat(s.lat).toFixed(2)}°N {parseFloat(s.lon).toFixed(2)}°E
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
          {loading ? "⟳ Calculating…" : "✦ GENERATE KUNDLI ✦"}
        </button>
      </div>
    </form>
  );
}