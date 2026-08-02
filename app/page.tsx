"use client";

import { useState } from "react";
import {
  Fuel,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  User,
  Mail,
  Phone,
  Star,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import FeedbackReportModal from "./components/FeedbackReportModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface FormData {
  name: string;
  email: string;
  mobile: string;
  fuelType: string;
  rating: string;
  feedback: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  mobile?: string;
  fuelType?: string;
  rating?: string;
  feedback?: string;
}

export default function FeedbackPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    mobile: "",
    fuelType: "",
    rating: "",
    feedback: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fuelOptions = [
    "Petrol",
    "Diesel",
    "Speed Petrol",
    "CNG",
    "EV Charging",
  ];

  const ratingOptions = [
    "5 Star - Excellent",
    "4 Star - Good",
    "3 Star - Average",
    "2 Star - Fair",
    "1 Star - Poor",
  ];

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case "name":
        return value.trim() ? "" : "Customer name is required";
      case "email":
        if (!value.trim()) return "Email address is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
          ? ""
          : "Please enter a valid email address";
      case "mobile":
        if (!value.trim()) return "Mobile number is required";
        return /^[6-9]\d{9}$/.test(value.trim())
          ? ""
          : "Enter a valid 10-digit mobile number";
      case "fuelType":
        return value && value !== "-- Select Fuel Type --"
          ? ""
          : "Please select a fuel type";
      case "rating":
        return value && value !== "-- Select Rating --"
          ? ""
          : "Please select a rating";
      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      if (errors.mobile) {
        setErrors((prev) => ({ ...prev, mobile: validateField("mobile", sanitized) }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name as keyof FormData, value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: FormErrors = {
      name: validateField("name", formData.name),
      email: validateField("email", formData.email),
      mobile: validateField("mobile", formData.mobile),
      fuelType: validateField("fuelType", formData.fuelType),
      rating: validateField("rating", formData.rating),
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((err) => err !== "");
    if (hasErrors) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmittedData(result.data);
      } else {
        setServerError(result.message || "Failed to submit feedback. Please try again.");
      }
    } catch (err) {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      mobile: "",
      fuelType: "",
      rating: "",
      feedback: "",
    });
    setErrors({});
    setSubmittedData(null);
    setServerError(null);
  };

  return (
    <main
      className="relative min-h-[100dvh] w-full bg-slate-950 bg-cover bg-center bg-no-repeat flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-x-hidden selection:bg-red-500 selection:text-white"
      style={{
        backgroundImage: `url('/petrol-pump-bg.png')`,
      }}
    >
      {/* Background Glow Overlays */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[4px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-red-600/20 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none animate-pulse-glow" />

      {/* Main Form Card */}
      <Card className="relative z-10 w-full max-w-[580px] glass-panel glow-subtle border-white/40 shadow-2xl my-auto transition-all duration-200">
        
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        {submittedData ? (
          /* SUCCESS SCREEN STATE */
          <CardContent className="p-4 sm:p-7 md:p-8 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300 pt-6">
            <div className="relative mb-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600 stroke-[2.5]" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight mb-1">
              Feedback Received!
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-4">
              Thank you for helping us maintain premium quality services at Jagdamba Petroleum.
            </p>

            {/* Receipt Summary */}
            <div className="w-full bg-white/90 backdrop-blur-sm rounded-xl p-3.5 sm:p-4 text-left border border-slate-200 shadow-sm mb-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Reference ID:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] sm:text-xs border border-slate-200">
                  {submittedData.id}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-800">{submittedData.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Fuel Category:</span>
                <Badge variant="default" className="text-[10px] sm:text-xs bg-red-50 text-red-600 border border-red-100 py-0">
                  {submittedData.fuelType}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Service Rating:</span>
                <Badge variant="warning" className="text-[10px] sm:text-xs py-0">
                  {submittedData.rating}
                </Badge>
              </div>
              {submittedData.feedback && (
                <div className="pt-1">
                  <span className="text-slate-500 font-medium block mb-0.5">Comments:</span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg text-[11px] sm:text-xs italic border border-slate-200/80 leading-relaxed">
                    &quot;{submittedData.feedback}&quot;
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleReset}
              variant="gradient"
              size="default"
              className="w-full flex items-center justify-center gap-2 h-11 text-sm sm:text-base font-extrabold"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Submit Another Feedback</span>
            </Button>
          </CardContent>
        ) : (
          /* SINGLE VIEW FORM STATE */
          <CardContent className="p-4 sm:p-6 md:p-7 pt-4 sm:pt-5">
            
            {/* Header Section */}
            <div className="text-center mb-3.5 sm:mb-4 relative">
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-red-600/30 shrink-0">
                    <Fuel className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      Jagdamba <span className="text-[#D9232D]">Petroleum</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      Customer Feedback Portal
                    </p>
                  </div>
                </div>

                {/* Reports Button Pill */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-gradient-to-r from-red-50 to-amber-50 hover:from-red-100 hover:to-amber-100 text-[#D9232D] text-[11px] sm:text-xs font-bold rounded-full border border-red-200/80 transition-all cursor-pointer active:scale-95 shadow-sm group shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-[#D9232D]" />
                  <span>Reports & PDF</span>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5 text-left">
              
              {/* Row 1: Name & Mobile (2 Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                <div>
                  <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Name</span>
                  </Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    hasError={!!errors.name}
                    className="h-10 text-xs sm:text-sm px-3.5 rounded-xl"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile Number</span>
                  </Label>
                  <Input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="10 digit mobile"
                    maxLength={10}
                    hasError={!!errors.mobile}
                    className="h-10 text-xs sm:text-sm px-3.5 rounded-xl"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.mobile}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Email Address (Full Width) */}
              <div>
                <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  hasError={!!errors.email}
                  className="h-10 text-xs sm:text-sm px-3.5 rounded-xl"
                />
                {errors.email && (
                  <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.email}</p>
                )}
              </div>

              {/* Row 3: Fuel Type & Rating (2 Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                <div>
                  <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" />
                    <span>Fuel Type</span>
                  </Label>
                  <div className="relative">
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      className={`flex h-10 w-full rounded-xl border bg-white/90 px-3.5 py-1.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 transition appearance-none cursor-pointer shadow-sm ${
                        errors.fuelType
                          ? "border-red-500 focus:ring-red-400/30"
                          : "border-slate-300/90 focus:border-red-500 focus:ring-red-500/20"
                      }`}
                    >
                      <option value="">-- Select Fuel --</option>
                      {fuelOptions.map((fuel) => (
                        <option key={fuel} value={fuel}>
                          {fuel}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  {errors.fuelType && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.fuelType}</p>
                  )}
                </div>

                <div>
                  <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Service Rating</span>
                  </Label>
                  <div className="relative">
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      className={`flex h-10 w-full rounded-xl border bg-white/90 px-3.5 py-1.5 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 transition appearance-none cursor-pointer shadow-sm ${
                        errors.rating
                          ? "border-red-500 focus:ring-red-400/30"
                          : "border-slate-300/90 focus:border-red-500 focus:ring-red-500/20"
                      }`}
                    >
                      <option value="">-- Select Rating --</option>
                      {ratingOptions.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  {errors.rating && (
                    <p className="text-red-500 text-[11px] mt-1 font-semibold">{errors.rating}</p>
                  )}
                </div>
              </div>

              {/* Row 4: Your Feedback (Textarea) */}
              <div>
                <Label className="mb-1 sm:mb-1.5 text-xs font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Your Feedback (Optional)</span>
                </Label>
                <textarea
                  name="feedback"
                  rows={3}
                  value={formData.feedback}
                  onChange={handleChange}
                  placeholder="Share your suggestions..."
                  className="flex w-full rounded-xl border border-slate-300/90 bg-white/90 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20 transition duration-150 resize-none shadow-sm"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1 sm:pt-1.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="gradient"
                  size="default"
                  className="w-full flex items-center justify-center gap-2 h-11 text-sm sm:text-base font-extrabold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Feedback</span>
                      <ChevronRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}

        {/* Footer Brand Note */}
        <div className="px-3 sm:px-4 py-2 bg-slate-100/80 border-t border-slate-200/80 text-center text-[10px] sm:text-xs text-slate-500 font-medium">
          Jagdamba Petroleum • Quality & Service Excellence
        </div>

      </Card>

      {/* PDF Report & Date Filter Modal */}
      <FeedbackReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </main>
  );
}
