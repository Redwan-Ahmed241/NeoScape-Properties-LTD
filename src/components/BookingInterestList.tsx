import type React from "react";
import { useState, useEffect } from "react";
import { bookingInterestsApi } from "../lib/api";
import type { BookingInterest } from "../lib/documentTypes";
import { 
    Mail, 
    Phone, 
    MessageSquare, 
    Calendar, 
    CheckCircle2, 
    Building, 
    Loader2, 
    Trash2, 
    User,
    ArrowRight
} from "lucide-react";

interface BookingInterestListProps {
    propertyName?: string;
}

const BookingInterestList: React.FC<BookingInterestListProps> = ({ propertyName }) => {
    const [interests, setInterests] = useState<BookingInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchInterests = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await bookingInterestsApi.list(propertyName);
            setInterests(data);
        } catch (err: any) {
            console.error("Failed to fetch booking interests:", err);
            setError(err.message || "Failed to load booking interests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterests();
    }, [propertyName]);

    const handleResolve = async (id: string) => {
        if (!window.confirm("Are you sure you want to resolve and delete this booking interest record?")) {
            return;
        }

        try {
            setActionId(id);
            await bookingInterestsApi.remove(id);
            setInterests((prev) => prev.filter((item) => item.id !== id));
        } catch (err: any) {
            console.error("Failed to resolve booking interest:", err);
            alert(err.message || "Failed to resolve interest record");
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-white/60" />
                <span className="text-sm">Loading booking interests...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl p-6 text-center border border-red-500/20 bg-red-500/5 max-w-md mx-auto my-8">
                <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
                <button 
                    onClick={fetchInterests}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    if (interests.length === 0) {
        return (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-white/60">No booking interests found</h3>
                <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
                    {propertyName 
                        ? `No prospective tenants have expressed interest in ${propertyName} yet.` 
                        : "No prospective tenants have expressed interest in any rooms yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                    Expressions of Interest ({interests.length})
                </h2>
                <button 
                    onClick={fetchInterests}
                    className="text-xs text-white/40 hover:text-white transition-colors"
                >
                    Refresh List
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {interests.map((interest) => (
                    <div 
                        key={interest.id}
                        className="rounded-xl p-5 transition-all flex flex-col justify-between"
                        style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                    >
                        <div>
                            {/* Submitter Name & Actions */}
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                        <User className="w-4 h-4 text-white/60" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-white">{interest.name}</h3>
                                        <span className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(interest.createdAt).toLocaleDateString("en-GB", { 
                                                day: "numeric", 
                                                month: "short", 
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleResolve(interest.id)}
                                    disabled={actionId === interest.id}
                                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 disabled:opacity-50 shrink-0"
                                    title="Mark as Resolved & Delete"
                                >
                                    {actionId === interest.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            {/* Property Details */}
                            <div 
                                className="rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2 text-xs"
                                style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid rgba(255, 255, 255, 0.03)" }}
                            >
                                <Building className="w-3.5 h-3.5 text-white/30" />
                                <div className="text-white/60">
                                    <span className="font-medium text-white/80">{interest.propertyName || "Unknown Property"}</span>
                                    {interest.roomId && (
                                        <span className="text-white/30">
                                            {" "}(Room ID: {interest.roomId})
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2 mb-4">
                                <a 
                                    href={`mailto:${interest.email}`}
                                    className="flex items-center gap-2 text-xs text-white/45 hover:text-white transition-colors w-fit"
                                >
                                    <Mail className="w-3.5 h-3.5 text-white/20" />
                                    <span>{interest.email}</span>
                                </a>
                                {interest.phone && (
                                    <a 
                                        href={`tel:${interest.phone}`}
                                        className="flex items-center gap-2 text-xs text-white/45 hover:text-white transition-colors w-fit"
                                    >
                                        <Phone className="w-3.5 h-3.5 text-white/20" />
                                        <span>{interest.phone}</span>
                                    </a>
                                )}
                            </div>

                            {/* Message */}
                            {interest.message && (
                                <div className="rounded-lg p-3 bg-white/[0.01] border border-white/[0.03]">
                                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <MessageSquare className="w-3 h-3" />
                                        Message
                                    </p>
                                    <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                                        {interest.message}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bottom action trigger info */}
                        <div className="mt-4 pt-3 flex justify-between items-center text-[10px] text-white/30" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                            <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Active Request
                            </span>
                            <a 
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(interest.email)}&su=${encodeURIComponent("NeoScape Properties - Inquiry Response")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-white/40 hover:text-white transition-colors font-medium"
                            >
                                Send Response <ArrowRight className="w-2.5 h-2.5" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingInterestList;
