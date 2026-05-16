"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Address, CreateAddressInput } from "@/lib/api/addresses";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

interface Props {
  initial?: Address;
  onSubmit: (data: CreateAddressInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const inputBase = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const inputCls  = `${inputBase} border-[var(--color-border)] bg-[var(--color-background)]`;
const inputErr  = `${inputBase} border-red-400 bg-red-50`;

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

type LabelType = "home" | "work" | "other";

export default function AddressForm({ initial, onSubmit, onCancel, submitLabel = "Save address" }: Props) {
  const [label, setLabel]           = useState<LabelType>(initial?.label ?? "other");
  const [labelName, setLabelName]   = useState(initial?.label_name ?? "");
  const [fullName, setFullName]     = useState(initial?.full_name ?? "");
  const [line1, setLine1]           = useState(initial?.line_1 ?? "");
  const [line2, setLine2]           = useState(initial?.line_2 ?? "");
  const [city, setCity]             = useState(initial?.city ?? "");
  const [state, setState]           = useState(initial?.state ?? "");
  const [postcode, setPostcode]     = useState(initial?.postcode ?? "");
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [saving, setSaving]         = useState(false);

  // Reset label_name when switching away from "other"
  useEffect(() => { if (label !== "other") setLabelName(""); }, [label]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (label === "other" && !labelName.trim()) e.labelName = "Please name this address (e.g. Parents' House).";
    if (!fullName.trim())   e.fullName  = "Full name is required.";
    if (!line1.trim())      e.line1     = "Street address is required.";
    if (!city.trim())       e.city      = "City is required.";
    if (!state.trim())      e.state     = "State is required.";
    if (!postcode.trim())   e.postcode  = "ZIP code is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSubmit({
        label,
        label_name: label === "other" ? labelName.trim() : undefined,
        full_name:  fullName.trim(),
        line_1:     line1.trim(),
        line_2:     line2.trim() || undefined,
        city:       city.trim(),
        state:      state.trim(),
        postcode:   postcode.trim(),
        country_code: "US",
      });
    } finally {
      setSaving(false);
    }
  }

  const labelBtns: { value: LabelType; display: string }[] = [
    { value: "home",  display: "🏠 Home" },
    { value: "work",  display: "💼 Work" },
    { value: "other", display: "📍 Other" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Label selector */}
      <Field label="Address type" required>
        <div className="flex gap-2 flex-wrap">
          {labelBtns.map(({ value, display }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setLabel(value); setErrors((e) => { const n = { ...e }; delete n.labelName; return n; }); }}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
              style={label === value
                ? { background: "var(--color-primary)", color: "#FAF7F2", borderColor: "var(--color-primary)" }
                : { background: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
            >
              {display}
            </button>
          ))}
        </div>
      </Field>

      {/* Custom name for Other */}
      {label === "other" && (
        <Field label="Address name" required error={errors.labelName}>
          <input
            value={labelName}
            onChange={(e) => { setLabelName(e.target.value); setErrors((err) => { const n = { ...err }; delete n.labelName; return n; }); }}
            placeholder="e.g. Parents' House, Vacation Home…"
            className={errors.labelName ? inputErr : inputCls}
            style={{ color: "var(--color-text-primary)" }}
          />
        </Field>
      )}

      {/* Full name */}
      <Field label="Full name" required error={errors.fullName}>
        <input
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setErrors((err) => { const n = { ...err }; delete n.fullName; return n; }); }}
          placeholder="As it appears on the doorbell"
          className={errors.fullName ? inputErr : inputCls}
          style={{ color: "var(--color-text-primary)" }}
        />
      </Field>

      {/* Street line 1 */}
      <Field label="Street address" required error={errors.line1}>
        <textarea
          value={line1}
          onChange={(e) => { setLine1(e.target.value); setErrors((err) => { const n = { ...err }; delete n.line1; return n; }); }}
          placeholder="123 Main Street"
          rows={2}
          className={`${errors.line1 ? inputErr : inputCls} resize-none`}
          style={{ color: "var(--color-text-primary)" }}
        />
      </Field>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="City" required error={errors.city}>
          <input
            value={city}
            onChange={(e) => { setCity(e.target.value); setErrors((err) => { const n = { ...err }; delete n.city; return n; }); }}
            placeholder="New York"
            className={errors.city ? inputErr : inputCls}
            style={{ color: "var(--color-text-primary)" }}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setErrors((err) => { const n = { ...err }; delete n.state; return n; }); }}
            className={errors.state ? inputErr : inputCls}
            style={{ color: state ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* ZIP + Country */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="ZIP code" required error={errors.postcode}>
          <input
            value={postcode}
            onChange={(e) => { setPostcode(e.target.value); setErrors((err) => { const n = { ...err }; delete n.postcode; return n; }); }}
            placeholder="10001"
            className={errors.postcode ? inputErr : inputCls}
            style={{ color: "var(--color-text-primary)" }}
          />
        </Field>
        <Field label="Country">
          <div
            className={`${inputBase} flex items-center gap-2 cursor-not-allowed`}
            style={{ borderColor: "var(--color-border)", background: "var(--color-cream-dark)", color: "var(--color-text-muted)" }}
          >
            <Lock size={13} style={{ flexShrink: 0 }} />
            <span className="text-sm">United States</span>
          </div>
        </Field>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl text-sm font-medium border transition-all"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
