import React, { useState, useEffect } from "react";
import { MessageSquare, Home, Loader2 } from "lucide-react";
import ChatWindow from "../../components/ChatWindow";
import AgreementPanel from "../../components/AgreementPanel";

interface Channel {
  id: number;
  property_name: string;
  tenant: number;
  tenant_username: string;
  admin?: number | null;
  created_at: string;
}

export default function ChatAndAgreementPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getHeaders = async () => {
    const { supabase } = await import("../../services/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const fetchOrCreateChannel = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = await getHeaders();
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
        const res = await fetch(`${API_BASE}/bookings/channels/`, {
          headers,
        });
        const data = await res.json();
        if (data.success && data.data) {
          // Response will contain channel object for the tenant
          setChannel(data.data);
        } else {
          setError("You do not have an active booking assignment to initialize a chat.");
        }
      } catch (err: any) {
        setError("Could not connect to the chat service. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateChannel();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-10 w-10 border-b-2 border-emerald-500 mx-auto" />
          <p className="text-sm text-white/40">Opening secure workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-emerald-400" />
          Tenant Workspace
        </h1>
        <p className="text-white/40 text-xs mt-1">
          Chat with the property administrator, upload agreement terms, and sign your tenancy contract digitally.
        </p>
      </div>

      {error || !channel ? (
        <div 
          className="rounded-2xl p-8 text-center border border-white/5 max-w-lg mx-auto"
          style={{ background: "rgba(10,10,10,0.6)" }}
        >
          <Home className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="text-base font-medium text-white/60">No Active Property Assignment</h3>
          <p className="text-sm text-white/30 mt-2 leading-relaxed">
            You must be assigned to an active property/room before a lease chat and agreement workspace can be opened. 
            Please contact the administration to assign your tenancy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Chat Window */}
          <div className="lg:col-span-6 xl:col-span-5 w-full">
            <ChatWindow channelId={channel.id} />
          </div>

          {/* Column 2: Agreement Viewer */}
          <div className="lg:col-span-6 xl:col-span-7 w-full">
            <AgreementPanel channelId={channel.id} />
          </div>
        </div>
      )}
    </div>
  );
}
