import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference");
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying Payment...");

  useEffect(() => {
    async function verifyPayment() {
      try {
        // ❌ DO NOT SEND TOKEN — verification does not require auth
        const res = await axios.get(
          `http://localhost:5000/api/subscription/verify/${reference}`
        );

        setStatus("Subscription Activated Successfully!");

        // redirect after 2.5 seconds
        setTimeout(() => navigate("/"), 2500);

      } catch (err) {
        console.error("Verification error:", err);
        setStatus("Verification failed. Contact support.");
      }
    }

    if (reference) verifyPayment();
  }, [reference]);

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">Processing Subscription...</h1>
      <p className="text-lg">{status}</p>
    </div>
  );
}
