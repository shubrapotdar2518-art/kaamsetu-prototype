import React, { useState } from "react";
import {
  X,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  User,
  Info,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  workerId: string;
  employerId: string;
  workerName: string;
  employerName: string;
  jobTitle: string;
  wage: number;
  userRole: "worker" | "employer";
  initialMethod?: "qr_demo" | "cash" | null;
  paymentStatus?: "pending" | "paid" | null;
  onConfirmPayment?: (method: "qr_demo" | "cash") => Promise<void>;
  onSelectPaymentMethod?: (method: "qr_demo" | "cash") => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  workerName,
  employerName,
  jobTitle,
  wage,
  userRole,
  initialMethod,
  paymentStatus,
  onConfirmPayment,
  onSelectPaymentMethod,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"qr_demo" | "cash">(
    initialMethod || "qr_demo",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Sync initial method when prop changes
  React.useEffect(() => {
    if (initialMethod) {
      setSelectedMethod(initialMethod);
    }
  }, [initialMethod]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!onConfirmPayment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirmPayment(selectedMethod);
      onClose();
    } catch (err) {
      console.error("Payment confirmation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkerSubmitMethod = async () => {
    if (!onSelectPaymentMethod || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSelectPaymentMethod(selectedMethod);
      setRequestSent(true);
    } catch (err) {
      console.error("Payment method submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Demo Payment Gateway
            </span>
            <h3 className="text-lg font-extrabold text-gray-900 mt-0.5">
              Daily Wage Settlement
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Demo disclaimer banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="font-bold">Demonstration Prototype Only:</strong>{" "}
              This is a simulated payment flow for a college project. No real bank
              accounts or monetary transactions are involved.
            </div>
          </div>

          {/* Job & Amount Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-[#15803D] text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-emerald-100 font-medium">Agreed Daily Wage</p>
                <div className="text-3xl font-black tracking-tight mt-0.5">
                  ₹{wage}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white">
                Payment Pending
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-400/30 flex items-center justify-between text-xs text-emerald-50">
              <span className="font-semibold truncate max-w-[200px]">{jobTitle}</span>
              <span>
                {userRole === "employer" ? `Worker: ${workerName}` : `Employer: ${employerName}`}
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Select Payout Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod("qr_demo")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMethod === "qr_demo"
                    ? "border-[#15803D] bg-emerald-50/60 ring-2 ring-emerald-500/20 text-[#15803D]"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMethod === "qr_demo"
                      ? "bg-[#15803D] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">UPI / QR Demo</div>
                  <div className="text-[10px] text-gray-500">Scan & Simulate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod("cash")}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMethod === "cash"
                    ? "border-[#15803D] bg-emerald-50/60 ring-2 ring-emerald-500/20 text-[#15803D]"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedMethod === "cash"
                      ? "bg-[#15803D] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Cash in Hand</div>
                  <div className="text-[10px] text-gray-500">Direct Settlement</div>
                </div>
              </button>
            </div>
          </div>

          {/* Tab 1: QR Demo Mode */}
          {selectedMethod === "qr_demo" && (
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-2xl border border-gray-200 shadow-2xs relative">
                {/* Visual SVG Demo QR Code */}
                <svg
                  className="w-36 h-36 mx-auto"
                  viewBox="0 0 140 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="140" height="140" rx="12" fill="white" />
                  {/* Top-left position marker */}
                  <rect x="10" y="10" width="34" height="34" rx="4" fill="#15803D" />
                  <rect x="16" y="16" width="22" height="22" rx="2" fill="white" />
                  <rect x="22" y="22" width="10" height="10" rx="1" fill="#15803D" />
                  {/* Top-right position marker */}
                  <rect x="96" y="10" width="34" height="34" rx="4" fill="#15803D" />
                  <rect x="102" y="16" width="22" height="22" rx="2" fill="white" />
                  <rect x="108" y="22" width="10" height="10" rx="1" fill="#15803D" />
                  {/* Bottom-left position marker */}
                  <rect x="10" y="96" width="34" height="34" rx="4" fill="#15803D" />
                  <rect x="16" y="102" width="22" height="22" rx="2" fill="white" />
                  <rect x="22" y="108" width="10" height="10" rx="1" fill="#15803D" />
                  {/* Pattern grid simulation */}
                  <rect x="52" y="12" width="8" height="8" fill="#1E293B" />
                  <rect x="68" y="12" width="8" height="8" fill="#1E293B" />
                  <rect x="60" y="24" width="8" height="8" fill="#1E293B" />
                  <rect x="52" y="36" width="8" height="8" fill="#1E293B" />
                  <rect x="76" y="36" width="8" height="8" fill="#1E293B" />
                  <rect x="16" y="52" width="8" height="8" fill="#1E293B" />
                  <rect x="32" y="52" width="8" height="8" fill="#1E293B" />
                  <rect x="52" y="52" width="16" height="16" rx="2" fill="#15803D" />
                  <rect x="76" y="52" width="8" height="8" fill="#1E293B" />
                  <rect x="96" y="52" width="8" height="8" fill="#1E293B" />
                  <rect x="112" y="52" width="12" height="8" fill="#1E293B" />
                  <rect x="16" y="68" width="16" height="8" fill="#1E293B" />
                  <rect x="68" y="68" width="8" height="16" fill="#1E293B" />
                  <rect x="84" y="68" width="8" height="8" fill="#1E293B" />
                  <rect x="100" y="68" width="16" height="8" fill="#1E293B" />
                  <rect x="16" y="80" width="8" height="8" fill="#1E293B" />
                  <rect x="36" y="80" width="8" height="8" fill="#1E293B" />
                  <rect x="52" y="76" width="8" height="8" fill="#1E293B" />
                  <rect x="84" y="80" width="16" height="8" fill="#1E293B" />
                  <rect x="116" y="80" width="12" height="8" fill="#1E293B" />
                  <rect x="52" y="96" width="8" height="8" fill="#1E293B" />
                  <rect x="68" y="96" width="16" height="8" fill="#1E293B" />
                  <rect x="96" y="96" width="8" height="8" fill="#1E293B" />
                  <rect x="112" y="96" width="12" height="8" fill="#1E293B" />
                  <rect x="52" y="112" width="16" height="8" fill="#1E293B" />
                  <rect x="76" y="112" width="8" height="12" fill="#1E293B" />
                  <rect x="96" y="112" width="8" height="8" fill="#1E293B" />
                  <rect x="112" y="112" width="16" height="8" fill="#1E293B" />
                  <rect x="52" y="124" width="8" height="6" fill="#1E293B" />
                  <rect x="68" y="124" width="8" height="6" fill="#1E293B" />
                  <rect x="88" y="124" width="16" height="6" fill="#1E293B" />
                </svg>
                <div className="text-[10px] font-bold text-gray-500 mt-1">
                  UPI ID: <span className="text-gray-800">kaamsetu.demo@upi</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Worker or Employer scans this simulated QR using any mock UPI app.
              </p>

              {userRole === "worker" && (
                <div className="pt-1">
                  <div className="text-[11px] text-gray-600 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 font-medium">
                    {requestSent || initialMethod === "qr_demo"
                      ? "✓ UPI / QR payout requested! Waiting for employer confirmation."
                      : "Select UPI / QR and submit below to request digital payment from employer."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Cash Payment Mode */}
          {selectedMethod === "cash" && (
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Banknote className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Direct Cash Handover</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                The employer pays <strong className="text-gray-800">₹{wage}</strong> in cash
                directly to <strong className="text-gray-800">{workerName}</strong>.
              </p>
              {userRole === "worker" && (
                <div className="pt-1">
                  <div className="text-[11px] text-gray-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-100 font-medium">
                    {requestSent || initialMethod === "cash"
                      ? "✓ Cash payout requested! Handover will be confirmed by employer."
                      : "Select Cash in Hand and submit below to request direct cash handover."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {userRole === "employer" ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Confirming..." : "Confirm Payment Received"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || requestSent}
              onClick={handleWorkerSubmitMethod}
              className="px-5 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 text-white text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Submitting..."
                  : requestSent
                    ? "✓ Payment Request Sent"
                    : `Request ${selectedMethod === "qr_demo" ? "QR / UPI" : "Cash"} Payment`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
