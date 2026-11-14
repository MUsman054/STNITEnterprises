"use client";

import { useState, useTransition } from "react";
import { adminUpdateOrder } from "@/actions/admin";
import { btnPrimary, inputClass, labelClass } from "@/lib/ui";

export function OrderStatusForm(props: {
  orderId: string;
  status: string;
  carrier: string;
  trackingNumber: string;
  options: { value: string; label: string }[];
}) {
  const [status, setStatus] = useState(props.options.some((o) => o.value === props.status) ? props.status : props.options[0].value);
  const [carrier, setCarrier] = useState(props.carrier);
  const [trackingNumber, setTrackingNumber] = useState(props.trackingNumber);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        startTransition(async () => {
          const result = await adminUpdateOrder({ orderId: props.orderId, status, carrier, trackingNumber });
          setMessage(result.ok ? "Saved." : (result.error ?? "Could not save."));
        });
      }}
    >
      <div>
        <label htmlFor="admin-status" className={labelClass}>
          Status
        </label>
        <select id="admin-status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="admin-carrier" className={labelClass}>
          Carrier
        </label>
        <input id="admin-carrier" value={carrier} maxLength={60} onChange={(event) => setCarrier(event.target.value)} placeholder="UPS, FedEx, USPS…" className={inputClass} />
      </div>
      <div>
        <label htmlFor="admin-tracking" className={labelClass}>
          Tracking number
        </label>
        <input id="admin-tracking" value={trackingNumber} maxLength={100} onChange={(event) => setTrackingNumber(event.target.value)} className={inputClass} />
      </div>
      <button type="submit" disabled={pending} className={`${btnPrimary} disabled:opacity-70`}>
        {pending ? "Saving…" : "Save"}
      </button>
      {message && (
        <p role="status" className="text-[14px] font-semibold text-foreground">
          {message}
        </p>
      )}
    </form>
  );
}
