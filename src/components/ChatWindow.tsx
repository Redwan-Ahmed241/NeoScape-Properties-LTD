import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { documentsApi } from "../lib/api";

interface Message {
  id: number;
  channel: number;
  sender: number;
  sender_username: string;
  sender_role: string;
  content: string;
  file_url?: string;
  file_name?: string;
  extracted_text?: string;
  created_at: string;
}

interface ChatWindowProps {
  channelId: number;
}

export default function ChatWindow({ channelId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch API token helper
  const getHeaders = async () => {
    // Import dynamically or get session via supabase client
    const { supabase } = await import("../services/supabaseClient");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchMessages = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const res = await fetch(`${API_BASE}/bookings/channels/${channelId}/messages/`, {
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch messages:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    
    // Poll for new messages every 4 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [channelId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, attachmentUrl?: string, attachmentName?: string) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;

    const content = inputText;
    setInputText("");
    setError("");

    try {
      const headers = await getHeaders();
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://room-booking-pjo6.onrender.com/api";
      const response = await fetch(`${API_BASE}/bookings/channels/${channelId}/messages/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content,
          file_url: attachmentUrl || null,
          file_name: attachmentName || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessages((prev) => [...prev, result.data]);
      } else {
        const errMsg = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
        setError(errMsg || "Failed to send message");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send message");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Use the existing documentsApi.upload utility
      const fileUrl = await documentsApi.upload(file);
      
      // Auto-send a message containing this file attachment
      await handleSendMessage(undefined, fileUrl, file.name);
    } catch (err: any) {
      const errMsg = typeof err?.message === "string" ? err.message : "File upload failed";
      setError(errMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mx-auto" />
          <p className="text-sm text-white/40">Loading messages…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[550px] rounded-2xl overflow-hidden border border-white/10" style={{ background: "rgba(10,10,10,0.6)" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
        <div>
          <span className="text-sm font-semibold text-white">Chat Workspace</span>
          <p className="text-[10px] text-white/40">PDF/DOCX contracts uploaded here will be read by AI</p>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm text-white/30">No messages in this chat yet.</p>
            <p className="text-xs text-white/20 mt-1">Send a message or upload lease terms/inventories to get started.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user && (String(msg.sender) === String(user.backendUserId) || String(msg.sender) === String(user.id));
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-white/35 mb-1 px-1">
                  {msg.sender_username} ({msg.sender_role})
                </span>
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe 
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-white rounded-br-none" 
                      : "bg-white/5 border border-white/10 text-white rounded-bl-none"
                  }`}
                >
                  {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                  
                  {/* File Attachment */}
                  {msg.file_url && (
                    <div className={`mt-2 flex items-center gap-3 p-2 rounded-lg bg-black/40 border border-white/5`}>
                      <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white/80 font-medium truncate">{msg.file_name || "Attachment"}</p>
                        <p className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider mt-0.5">
                          {msg.extracted_text ? "✓ Text Extracted by AI" : "⚡ Extracted"}
                        </p>
                      </div>
                      <a
                        href={msg.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-white/10 rounded-md text-white/60 hover:text-white transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
                <span className="text-[8px] text-white/20 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Error alert */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Input panel */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/[0.01] flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.docx,.doc,image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all shrink-0"
          title="Attach files (PDF, DOCX)"
        >
          {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message here..."
          className="h-10 flex-1 px-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />

        <button
          type="submit"
          className="p-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
