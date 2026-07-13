"use client";
import { FormEvent, useState } from "react";
import { applyForRider } from "@/lib/api";
const vehicles = ["bike", "scooter", "motorcycle", "bicycle", "car"];
export function ApplicationForm() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await applyForRider(new FormData(e.currentTarget));
      setResult(data.message);
      e.currentTarget.reset();
    } catch (c) {
      setError(
        c instanceof Error ? c.message : "Unable to submit application.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <p className="eyebrow">JOIN THE NETWORK</p>
      <h2>Apply to deliver with Pharma2u</h2>
      <p className="muted">
        Your documents are reviewed securely. We’ll issue your sign-in password
        after approval.
      </p>
      <form onSubmit={submit} className="grid-form">
        <label>
          Full name
          <input required name="name" />
        </label>
        <label>
          Mobile number
          <input
            required
            name="phone"
            inputMode="numeric"
            pattern="[6-9][0-9]{9}"
          />
        </label>
        <label>
          Aadhaar number
          <input
            required
            name="aadharNumber"
            inputMode="numeric"
            pattern="[0-9]{12}"
          />
        </label>
        <label>
          PAN number
          <input
            required
            name="panNumber"
            className="uppercase"
            pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
          />
        </label>
        <label>
          Driving licence number
          <input required name="drivingLicenseNumber" />
        </label>
        <label>
          Vehicle type
          <select required name="vehicleType">
            <option value="">Choose vehicle</option>
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Vehicle number
          <input required name="vehicleNumber" />
        </label>
        <Upload name="aadharImage" label="Aadhaar image" />
        <Upload name="panImage" label="PAN image" />
        <Upload name="dlImage" label="Driving licence image" />
        {error && <p className="alert error">{error}</p>}
        {result && <p className="alert success">{result}</p>}
        <button disabled={busy} className="primary">
          {busy ? "Submitting securely…" : "Submit application"}
        </button>
      </form>
    </section>
  );
}
function Upload({ name, label }: { name: string; label: string }) {
  return (
    <label>
      {label}
      <input required name={name} type="file" accept="image/jpeg,image/png" />
      <small>JPEG or PNG, up to 5 MB</small>
    </label>
  );
}
