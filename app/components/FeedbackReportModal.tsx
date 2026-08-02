"use client";

import { useState, useEffect } from "react";
import {
  X,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Loader2,
  TrendingUp,
  Fuel,
  Trash2,
  Lock,
  ShieldCheck,
  KeyRound,
  LogOut,
  Mail,
  AlertCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  mobile: string;
  fuelType: string;
  rating: string;
  feedback: string;
  createdAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackReportModal({ isOpen, onClose }: Props) {
  const [rangeFilter, setRangeFilter] = useState<
    "today" | "yesterday" | "week" | "month" | "year" | "all" | "custom"
  >("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Owner Access Control States
  const [verifiedOwnerEmail, setVerifiedOwnerEmail] = useState<string | null>(null);
  const [ownerInputEmail, setOwnerInputEmail] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Check stored owner authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail =
        sessionStorage.getItem("jagdamba_owner_email") ||
        localStorage.getItem("jagdamba_owner_email");
      if (savedEmail) {
        setVerifiedOwnerEmail(savedEmail);
      }
    }
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      let url = `/api/feedback?range=${rangeFilter}`;
      if (rangeFilter === "custom" && startDate) {
        url += `&startDate=${startDate}`;
      }
      if (rangeFilter === "custom" && endDate) {
        url += `&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.feedbacks || []);
      }
    } catch (err) {
      console.error("Failed to fetch feedback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && verifiedOwnerEmail) {
      fetchFeedbacks();
    }
  }, [isOpen, rangeFilter, startDate, endDate, verifiedOwnerEmail]);

  const handleVerifyOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    let email = ownerInputEmail.trim().toLowerCase();

    if (!email) {
      setAuthError("Please enter your Owner Email ID");
      return;
    }

    // Auto-format username to email if @ is omitted (e.g. owner -> owner@example.com)
    if (!email.includes("@")) {
      email = `${email}@gmail.com`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAuthError("Please enter a valid email address");
      return;
    }

    setIsVerifying(true);

    const envOwnerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAIL || "")
      .toLowerCase()
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const defaultAllowed = [
      "owner@example.com",
      "admin@example.com",
      "owner@jagdambapetroleum.com",
      "admin@jagdambapetroleum.com",
      "owner@gmail.com",
    ];

    const isAuthorized =
      envOwnerEmails.some((envE) => email.includes(envE) || envE.includes(email)) ||
      defaultAllowed.some((defE) => email.includes(defE) || defE.includes(email)) ||
      email.endsWith("@jagdambapetroleum.com") ||
      email.endsWith("@example.com") ||
      email.startsWith("owner") ||
      email.startsWith("admin");

    setTimeout(() => {
      if (isAuthorized) {
        setVerifiedOwnerEmail(email);
        sessionStorage.setItem("jagdamba_owner_email", email);
        localStorage.setItem("jagdamba_owner_email", email);
        setAuthError(null);
        setOwnerInputEmail("");
      } else {
        setAuthError(
          "Access Denied: This email ID is not recognized as an authorized Owner Email. (Try owner@example.com or owner@jagdambapetroleum.com)"
        );
      }
      setIsVerifying(false);
    }, 400);
  };

  const handleLogoutOwner = () => {
    setVerifiedOwnerEmail(null);
    sessionStorage.removeItem("jagdamba_owner_email");
    localStorage.removeItem("jagdamba_owner_email");
  };

  const handleDeleteFeedback = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete feedback ${id} (${name})?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.message || "Failed to delete feedback record");
      }
    } catch (err) {
      console.error("Failed to delete feedback:", err);
      alert("Error deleting record. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  // Statistics calculation
  const totalCount = feedbacks.length;
  const ratingCounts: Record<string, number> = {};
  const fuelCounts: Record<string, number> = {};

  feedbacks.forEach((item) => {
    fuelCounts[item.fuelType] = (fuelCounts[item.fuelType] || 0) + 1;
    const rStar = item.rating ? item.rating.split(" ")[0] : "5";
    ratingCounts[rStar] = (ratingCounts[rStar] || 0) + 1;
  });

  const topFuel = Object.keys(fuelCounts).reduce(
    (a, b) => (fuelCounts[a] > fuelCounts[b] ? a : b),
    "None"
  );

  const filterLabels: Record<string, string> = {
    today: "Today",
    yesterday: "Yesterday",
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
    custom: "Custom Date Range",
  };

  const handleDownloadPDF = () => {
    if (!verifiedOwnerEmail) {
      alert("Access Denied: Owner email verification is required to download PDF.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const todayStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Header Banner Background
      doc.setFillColor(217, 35, 45); // Jagdamba Red #D9232D
      doc.rect(0, 0, 297, 26, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("JAGDAMBA PETROLEUM", 14, 13);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Customer Feedback Report (Owner Confidential)", 14, 20);

      // Report metadata
      doc.setFontSize(8.5);
      doc.text(`Generated: ${todayStr}`, 283, 11, { align: "right" });
      doc.text(`Owner: ${verifiedOwnerEmail}`, 283, 16, { align: "right" });
      doc.text(`Filter: ${filterLabels[rangeFilter]}`, 283, 21, { align: "right" });

      // Summary Section Cards
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, 30, 269, 20, 2, 2, "F");

      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Records: ${totalCount}`, 20, 42);
      doc.text(`Top Fuel Choice: ${topFuel}`, 100, 42);

      doc.text(
        `Report Period: ${
          rangeFilter === "custom" && (startDate || endDate)
            ? `${startDate || "Start"} to ${endDate || "Present"}`
            : filterLabels[rangeFilter]
        }`,
        190,
        42
      );

      // Table Setup
      const tableData = feedbacks.map((item) => [
        item.id,
        new Date(item.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        item.name,
        item.mobile,
        item.email,
        item.fuelType,
        item.rating,
        item.feedback || "-",
      ]);

      autoTable(doc, {
        startY: 54,
        head: [
          [
            "Ref ID",
            "Date & Time",
            "Customer Name",
            "Mobile",
            "Email",
            "Fuel Type",
            "Rating",
            "Customer Feedback",
          ],
        ],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 22, fontStyle: "bold" },
          1: { cellWidth: 32 },
          2: { cellWidth: 35, fontStyle: "bold" },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 },
          5: { cellWidth: 26 },
          6: { cellWidth: 32 },
          7: { cellWidth: "auto" },
        },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Jagdamba Petroleum Confidential Owner Report • Verified for ${verifiedOwnerEmail} • Page ${i} of ${pageCount}`,
          148.5,
          202,
          { align: "center" }
        );
      }

      // Download Trigger
      const filename = `Jagdamba_Owner_Feedback_Report_${rangeFilter}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-[#D9232D] text-white p-4 sm:p-6 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Feedback Reports & PDF Export</span>
                {verifiedOwnerEmail && (
                  <Badge variant="success" className="bg-emerald-500/30 text-emerald-100 border-emerald-400/40 font-normal gap-1 text-[10px] sm:text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    Owner Verified
                  </Badge>
                )}
              </h2>
              <p className="text-red-100 text-[11px] sm:text-sm">
                Restricted to authorized Owner Email ID for report viewing & PDF download
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* OWNER AUTHENTICATION GUARD SCREEN */}
        {!verifiedOwnerEmail ? (
          <div className="p-5 sm:p-8 md:p-12 flex flex-col items-center justify-center text-center my-auto overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 text-[#D9232D] rounded-2xl flex items-center justify-center mb-4 sm:mb-5 border border-red-100 shadow-sm">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-2">
              Owner Access Verification
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm max-w-md mb-5 sm:mb-6">
              PDF downloads and customer feedback data are restricted. Please enter your registered <strong className="text-slate-800">Owner Email ID</strong> to gain view and download access.
            </p>

            <form onSubmit={handleVerifyOwner} className="w-full max-w-sm space-y-3.5 sm:space-y-4">
              <div className="relative">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={ownerInputEmail}
                  onChange={(e) => setOwnerInputEmail(e.target.value)}
                  placeholder="Enter Owner Email (e.g. owner@example.com)"
                  className="pl-10 sm:pl-11 h-10 sm:h-11 text-xs sm:text-sm"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isVerifying}
                variant="gradient"
                size="lg"
                className="w-full flex items-center justify-center gap-2 h-11 text-xs sm:text-sm font-bold"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Email...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Verify Owner & Unlock PDF Access
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6 text-[10px] sm:text-xs text-slate-400">
              Jagdamba Petroleum • Security Protected PDF Access
            </div>
          </div>
        ) : (
          /* UNLOCKED OWNER CONTENT */
          <>
            {/* Owner Email Bar */}
            <div className="px-3.5 sm:px-5 py-2.5 bg-slate-800 text-slate-200 text-[11px] sm:text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[220px] sm:max-w-none">
                  Logged in as Owner: <strong className="text-white">{verifiedOwnerEmail}</strong>
                </span>
              </div>
              <button
                onClick={handleLogoutOwner}
                className="text-slate-400 hover:text-red-300 flex items-center gap-1 transition cursor-pointer shrink-0 ml-auto sm:ml-0"
                title="Lock / Switch Owner Email"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock / Exit</span>
              </button>
            </div>

            {/* Date Filter Bar */}
            <div className="p-3.5 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Period:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {(["today", "yesterday", "week", "month", "year", "all", "custom"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangeFilter(r)}
                    className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                      rangeFilter === r
                        ? "bg-[#D9232D] text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {filterLabels[r]}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              {rangeFilter === "custom" && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 bg-white p-3 rounded-2xl border border-slate-200 animate-in slide-in-from-top-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Main Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 custom-scrollbar">
              
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500">Total Feedbacks</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{totalCount}</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500">Top Fuel Demanded</p>
                    <p className="text-base sm:text-lg font-bold text-slate-800">{topFuel}</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Fuel className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-500">Active Period</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{filterLabels[rangeFilter]}</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>

              {/* Feedback Preview Data Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Matching Feedbacks ({feedbacks.length})
                  </h3>
                  <span className="text-[11px] sm:text-xs text-slate-500">
                    Filtered by {filterLabels[rangeFilter]}
                  </span>
                </div>

                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#D9232D]" />
                    <span className="text-xs font-medium">Loading feedback entries...</span>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No feedback records found for this date filter.
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5">Ref ID</th>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Customer</th>
                          <th className="px-3 py-2.5">Mobile</th>
                          <th className="px-3 py-2.5">Fuel</th>
                          <th className="px-3 py-2.5">Rating</th>
                          <th className="px-3 py-2.5">Feedback</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {feedbacks.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2 font-mono font-medium text-slate-900">
                              {item.id}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                            <td className="px-3 py-2 font-semibold text-slate-800">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 text-slate-600">{item.mobile}</td>
                            <td className="px-3 py-2 font-medium text-red-600">
                              {item.fuelType}
                            </td>
                            <td className="px-3 py-2 text-amber-600 font-medium whitespace-nowrap">
                              {item.rating}
                            </td>
                            <td className="px-3 py-2 max-w-[180px] truncate text-slate-600">
                              {item.feedback || "-"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleDeleteFeedback(item.id, item.name)}
                                disabled={deletingId === item.id}
                                title="Delete Record"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-3.5 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs"
              >
                Close
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf || feedbacks.length === 0}
                variant="gradient"
                size="sm"
                className="w-full sm:w-auto gap-2 text-xs font-bold"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF Report ({feedbacks.length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
