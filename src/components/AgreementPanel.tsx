import React, { useState, useEffect } from "react";
import { FileText, Loader2, Award, PenTool, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import SignatureCanvas from "./SignatureCanvas";

interface Agreement {
  id: number;
  channel: number;
  property_name: string;
  tenant: number;
  tenant_username: string;
  room_id?: number | null;
  agreement_text: string;
  status: "draft" | "signed" | "rejected";
  tenant_signed: boolean;
  tenant_signature_svg?: string | null;
  tenant_signed_at?: string | null;
  admin_signed: boolean;
  admin_signature_svg?: string | null;
  admin_signed_at?: string | null;
}

interface AgreementPanelProps {
  channelId: number;
}

// Simple Markdown to HTML formatter to render the contract beautifully
const renderMarkdown = (text: string) => {
  if (!text) return "";
  const lines = text.split("\n");
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      return <h1 key={index} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-1 uppercase tracking-wide">{trimmed.substring(2)}</h1>;
    }
    if (trimmed.startsWith("## ")) {
      return <h2 key={index} className="text-lg font-bold text-white mt-4 mb-2 tracking-wide">{trimmed.substring(3)}</h2>;
    }
    if (trimmed.startsWith("### ")) {
      return <h3 key={index} className="text-sm font-semibold text-white/90 mt-3 mb-1 uppercase tracking-wide">{trimmed.substring(4)}</h3>;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return <li key={index} className="ml-5 list-disc text-white/70 text-xs mb-1.5 leading-relaxed">{trimmed.substring(2)}</li>;
    }
    // Handle bold markup **text**
    if (trimmed.includes("**")) {
      const parts = trimmed.split("**");
      return (
        <p key={index} className="text-white/70 text-xs leading-relaxed mb-3">
          {parts.map((part, partIdx) => partIdx % 2 === 1 ? <strong key={partIdx} className="text-white font-semibold">{part}</strong> : part)}
        </p>
      );
    }
    if (trimmed === "") {
      return <div key={index} className="h-2" />;
    }
    return <p key={index} className="text-white/70 text-xs leading-relaxed mb-3">{trimmed}</p>;
  });
};

export default function AgreementPanel({ channelId }: AgreementPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getHeaders = async () => {
    const { supabase } = await import("../services/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchAgreement = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/agreements/?channel_id=${channelId}`, {
        headers,
      });
      if (!res.ok) {
        // Non-2xx response — don't try to parse as JSON
        setAgreement(null);
        return;
      }
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        // Load latest agreement for this channel
        setAgreement(data.data[data.data.length - 1]);
      } else {
        setAgreement(null);
      }
    } catch (err: any) {
      setError("Failed to fetch tenancy agreement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreement();
  }, [channelId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/generate-agreement/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ channel_id: channelId }),
      });
      // Guard against non-JSON responses (e.g. Django HTML error pages)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError(`Server returned an unexpected response (HTTP ${res.status}). Make sure the backend is running.`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAgreement(data.data);
        setSuccess("AI Agreement Draft generated successfully!");
      } else {
        const errMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        setError(errMsg || "Failed to generate agreement");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate agreement");
    } finally {
      setGenerating(false);
    }
  };

  const handleSign = async (signatureSvg: string) => {
    if (!agreement) return;
    setGenerating(true); // show loader inside modal/panel
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/agreements/${agreement.id}/sign/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ signature_svg: signatureSvg }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError(`Server returned an unexpected response (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAgreement(data.data);
        setSuccess("Signature applied successfully!");
        setSigning(false);
      } else {
        const errMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        setError(errMsg || "Failed to submit signature");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit signature");
    } finally {
      setGenerating(false);
    }
  };

  const handleReject = async () => {
    if (!agreement) return;
    if (!confirm("Are you sure you want to reject this draft?")) return;
    
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/agreements/${agreement.id}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "rejected" }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError(`Server returned an unexpected response (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAgreement(data.data);
        setSuccess("Agreement draft rejected.");
      } else {
        const errMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        setError(errMsg || "Failed to reject agreement");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reject agreement");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 border border-white/10 flex flex-col h-[550px]" style={{ background: "rgba(10,10,10,0.6)" }}>
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Tenancy Contract Panel</h3>
            {agreement && (
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                agreement.status === "signed" 
                  ? "bg-emerald-500/15 text-emerald-400" 
                  : agreement.status === "rejected" 
                    ? "bg-red-500/15 text-red-400" 
                    : "bg-amber-500/15 text-amber-400 animate-pulse"
              }`}>
                {agreement.status}
              </span>
            )}
          </div>
        </div>

        {agreement && (
          <button 
            onClick={fetchAgreement} 
            className="p-1.5 hover:bg-white/5 text-white/40 hover:text-white rounded-lg transition-all"
            title="Refresh Agreement Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Alert */}
      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs text-red-400 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-400 shrink-0">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Content Space */}
      <div className="flex-1 overflow-y-auto py-4 my-2 pr-1 space-y-4">
        {!agreement ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Award className="w-12 h-12 text-white/10 mb-3" />
            <h4 className="text-sm font-medium text-white/70">No Tenancy Agreement Created Yet</h4>
            <p className="text-xs text-white/30 mt-1 max-w-xs">
              {isAdmin 
                ? "Once negotiations in the chat are finalized, generate a legal lease draft using our AI Generator." 
                : "Your landlord will generate a tenancy agreement draft here once chat negotiations are completed."}
            </p>
            {isAdmin && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {generating ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                Generate Agreement using AI
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Agreement text card */}
            <div 
              className="rounded-xl p-5 border border-white/5 font-sans leading-relaxed text-xs overflow-x-auto shadow-inner"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              {renderMarkdown(agreement.agreement_text)}
            </div>

            {/* Signatures status block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Tenant Signature */}
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Tenant Signature</span>
                {agreement.tenant_signed && agreement.tenant_signature_svg ? (
                  <div className="space-y-2">
                    <div 
                      className="h-16 w-full flex items-center justify-center text-white p-2 rounded-lg bg-black/45 border border-white/5"
                      dangerouslySetInnerHTML={{ __html: agreement.tenant_signature_svg }}
                    />
                    <p className="text-[9px] text-emerald-400 font-medium">Signed at {new Date(agreement.tenant_signed_at!).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="py-4 text-center border border-dashed border-white/10 rounded-lg text-white/30 text-xs italic">
                    Awaiting Tenant Signature
                  </div>
                )}
              </div>

              {/* Admin Signature */}
              <div className="rounded-xl p-4 bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Landlord Signature</span>
                {agreement.admin_signed && agreement.admin_signature_svg ? (
                  <div className="space-y-2">
                    <div 
                      className="h-16 w-full flex items-center justify-center text-white p-2 rounded-lg bg-black/45 border border-white/5"
                      dangerouslySetInnerHTML={{ __html: agreement.admin_signature_svg }}
                    />
                    <p className="text-[9px] text-emerald-400 font-medium">Signed at {new Date(agreement.admin_signed_at!).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="py-4 text-center border border-dashed border-white/10 rounded-lg text-white/30 text-xs italic">
                    Awaiting Landlord Signature
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature canvas popup modal */}
      {signing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div 
            className="w-full max-w-lg rounded-2xl p-6 border border-white/10 flex flex-col gap-4"
            style={{ background: "rgba(18,18,18,0.98)" }}
          >
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-emerald-400" /> Draw Your Digital Signature
            </h4>
            <p className="text-[10px] text-white/40">Use your mouse or touchscreen to sign in the pad below. Your signature will be saved as vector SVG path data.</p>
            <SignatureCanvas 
              onSave={handleSign}
              onCancel={() => setSigning(false)}
            />
          </div>
        </div>
      )}

      {/* Bottom control panel */}
      {agreement && (
        <div className="pt-3 border-t border-white/10 shrink-0">
          {agreement.status === "signed" ? (
            <div className="flex items-center justify-center gap-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold tracking-wide">Agreement Fully Executed</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {agreement.status !== "rejected" && (
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500/10 text-xs font-semibold rounded-xl transition-all"
                  >
                    Reject Draft
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    title="Regenerate agreement draft with updated chat log"
                  >
                    {generating ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Regenerate Draft
                  </button>
                )}
              </div>

              {/* User Sign Option */}
              {((isAdmin && !agreement.admin_signed) || (!isAdmin && !agreement.tenant_signed)) && agreement.status !== "rejected" && (
                <button
                  onClick={() => setSigning(true)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  <PenTool className="w-3.5 h-3.5" /> Sign Agreement
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
