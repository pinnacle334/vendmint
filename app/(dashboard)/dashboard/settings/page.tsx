"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

// NOTE: Common Nigerian banks for the dropdown
const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint",
  "Opay",
  "Palmpay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
];

export default function SettingsPage(): React.ReactElement {
  const { user } = useAuth();

  // Bank details state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // NOTE: Controls whether seller is using a bank not in our list
  const [isOtherBank, setIsOtherBank] = useState(false);

  // UI state
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const { data: store } = await supabase
        .from("stores")
        .select("id, bank_name, account_number, account_name")
        .eq("owner_id", user.id)
        .single();

      if (store) {
        setStoreId(store.id);
        setBankName(store.bank_name || "");
        setAccountNumber(store.account_number || "");
        setAccountName(store.account_name || "");

        // NOTE: If saved bank name isn't in our list, switch to
        // "Other" mode so it shows correctly in the free text input
        if (store.bank_name && !NIGERIAN_BANKS.includes(store.bank_name)) {
          setIsOtherBank(true);
        }
      }

      setPageLoading(false);
    };

    loadSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!bankName || !accountNumber || !accountName) {
      setError("Please fill in all bank details");
      return;
    }

    if (accountNumber.length !== 10 || isNaN(Number(accountNumber))) {
      setError("Account number must be exactly 10 digits");
      return;
    }

    if (!storeId) {
      setError("Please set up your store before adding payment details");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase
      .from("stores")
      .update({
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
      })
      .eq("id", storeId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Manage your payment details and account preferences.
        </p>
      </div>

      {/* No store warning */}
      {!storeId && (
        <Card padding="lg" className="text-center">
          <p className="text-sm font-medium text-text">
            Set up your store first
          </p>
          <p className="text-xs text-muted mt-1">
            You need a store before adding payment details.
          </p>
        </Card>
      )}

      {/* Bank details form */}
      {storeId && (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex flex-col gap-5",
            "bg-surface rounded-2xl border border-border",
            "p-6",
          )}
        >
          <div>
            <h2 className="text-base font-semibold text-text">
              Payment Details
            </h2>
            <p className="text-xs text-muted mt-1">
              These details will be shown to customers who choose to pay
              via bank transfer.
            </p>
          </div>

          {/* Bank name dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">
              Bank Name
            </label>
            <select
              value={isOtherBank ? "other" : bankName}
              onChange={(e) => {
                if (e.target.value === "other") {
                  setIsOtherBank(true);
                  setBankName("");
                } else {
                  setIsOtherBank(false);
                  setBankName(e.target.value);
                }
              }}
              className={cn(
                "w-full px-4 py-2.5 rounded-lg text-sm",
                "bg-surface text-text",
                "border border-border",
                "outline-none transition-all duration-200",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                "cursor-pointer",
              )}
            >
              <option value="">Select your bank</option>
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
              <option value="other">Other (type manually)</option>
            </select>

            {/* NOTE: Free text input shown when seller selects "Other" */}
            {isOtherBank && (
              <Input
                type="text"
                placeholder="Type your bank name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            )}
          </div>

          <Input
            label="Account Number"
            type="text"
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => {
              // NOTE: Only allow digits, max 10 characters
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setAccountNumber(val);
            }}
            hint="Must be exactly 10 digits"
          />

          <Input
            label="Account Name"
            type="text"
            placeholder="Jane Doe"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            hint="Must match your bank account name exactly"
          />

          {/* Security note */}
          <div
            className={cn(
              "flex gap-2 p-3 rounded-lg",
              "bg-primary/5 border border-primary/20",
            )}
          >
            <p className="text-xs text-muted">
              🔒 Your bank details are stored securely and only shown to
              customers after they place an order. They are never shared
              publicly on your store page.
            </p>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          {success && (
            <p className="text-sm text-success">
              Payment details saved successfully!
            </p>
          )}

          <Button type="submit" loading={loading} className="self-start">
            Save Payment Details
          </Button>
        </form>
      )}
    </div>
  );
}