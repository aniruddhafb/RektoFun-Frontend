"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { savePendingReferralCode } from "@/app/lib/referral-attribution";

export function ReferralAttributionCapture() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  useEffect(() => {
    savePendingReferralCode(referralCode);
  }, [referralCode]);

  return null;
}
