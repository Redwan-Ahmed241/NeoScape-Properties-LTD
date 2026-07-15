import type React from "react";
import { useState, useEffect } from "react";
import { referencingApi, roomsApi, type ReferencingApplication } from "../lib/api";
import { 
    Users, 
    Mail, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    FileText, 
    Loader2, 
    Plus,
    RefreshCw,
    Download
} from "lucide-react";

interface ReferencingManagerProps {
    propertyName?: string;
}

const ReferencingManager: React.FC<ReferencingManagerProps> = ({ propertyName }) => {
    const [applications, setApplications] = useState<ReferencingApplication[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Modal states
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [invitePhone, setInvitePhone] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [inviting, setInviting] = useState(false);

    // Detail modal/override states
    const [selectedApp, setSelectedApp] = useState<ReferencingApplication | null>(null);
    const [overrideDecision, setOverrideDecision] = useState<"approve" | "caution" | "decline" | "pending" | "">("");
    const [overrideNotes, setOverrideNotes] = useState("");
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [appData, roomData] = await Promise.all([
                referencingApi.list(),
                roomsApi.getRooms()
            ]);
            setApplications(appData);
            setRooms(roomData.data || roomData);
        } catch (err: any) {
            console.error("Failed to load referencing data:", err);
            setError(err.message || "Failed to load tenant referencing data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId || !inviteName || !inviteEmail) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            setInviting(true);
            const newApp = await referencingApi.create(
                selectedRoomId,
                inviteName,
                inviteEmail,
                invitePhone
            );
            setApplications((prev) => [newApp, ...prev]);
            setShowInviteModal(false);
            setInviteName("");
            setInviteEmail("");
            setInvitePhone("");
            setSelectedRoomId("");
            alert("Invitation sent successfully!");
        } catch (err: any) {
            console.error("Failed to send invite:", err);
            alert(err.message || "Failed to send invitation.");
        } finally {
            setInviting(false);
        }
    };

    const handleUpdateDecision = async () => {
        if (!selectedApp || !overrideDecision) return;

        try {
            setUpdating(true);
            const updated = await referencingApi.patch(selectedApp.id, {
                decision: overrideDecision as any,
                landlord_override_notes: overrideNotes
            });
            setApplications((prev) =>
                prev.map((app) => (app.id === updated.id ? updated : app))
            );
            setSelectedApp(updated);
            alert("Application decision updated successfully!");
        } catch (err: any) {
            console.error("Failed to update decision:", err);
            alert(err.message || "Failed to update decision.");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const cls = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ";
        switch (status) {
            case "invited":
                return <span className={cls + "bg-blue-500/10 text-blue-400 border border-blue-500/20"}><Mail className="w-3.5 h-3.5" /> Invited</span>;
            case "submitted":
                return <span className={cls + "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}><FileText className="w-3.5 h-3.5" /> Submitted</span>;
            case "processing":
                return <span className={cls + "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"}><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Checks</span>;
            case "completed":
                return <span className={cls + "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}><CheckCircle className="w-3.5 h-3.5" /> Completed</span>;
            case "failed":
                return <span className={cls + "bg-red-500/10 text-red-400 border border-red-500/20"}><XCircle className="w-3.5 h-3.5" /> Failed</span>;
            default:
                return <span className={cls + "bg-white/10 text-white/50"}>{status}</span>;
        }
    };

    const getDecisionBadge = (decision: string) => {
        const cls = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ";
        switch (decision) {
            case "approve":
                return <span className={cls + "bg-emerald-500/10 text-emerald-400"}><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
            case "caution":
                return <span className={cls + "bg-amber-500/10 text-amber-400"}><AlertCircle className="w-3.5 h-3.5" /> Caution (Guarantor)</span>;
            case "decline":
                return <span className={cls + "bg-red-500/10 text-red-400"}><XCircle className="w-3.5 h-3.5" /> Declined</span>;
            default:
                return <span className={cls + "bg-white/10 text-white/40"}>Pending Decision</span>;
        }
    };

    // Filter by property location if set
    const filteredApps = applications.filter((app) => 
        !propertyName || app.property_location === propertyName
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-white/60" />
                <span className="text-sm">Loading referencing applications...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl p-6 text-center border border-red-500/20 bg-red-500/5 max-w-md mx-auto my-8">
                <p className="text-red-400 text-sm font-medium mb-3">{error}</p>
                <button onClick={fetchData} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors">
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                    Tenant Referencing Applications ({filteredApps.length})
                </h2>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData} 
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-white/90 transition-all shadow-lg"
                    >
                        <Plus className="w-4 h-4" /> Invite Tenant
                    </button>
                </div>
            </div>

            {/* Applications List */}
            {filteredApps.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-white/60">No referencing applications found</h3>
                    <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
                        Invite prospective tenants to fill out the referencing checks.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.01)" }}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-white/40 text-xs font-semibold uppercase">
                                <th className="px-6 py-4">Applicant</th>
                                <th className="px-6 py-4">Room/Property</th>
                                <th className="px-6 py-4">Verification Check Status</th>
                                <th className="px-6 py-4">Outcome</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-white/80">
                            {filteredApps.map((app) => (
                                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{app.applicant_name}</div>
                                        <div className="text-xs text-white/40 flex items-center gap-1.5 mt-0.5">
                                            <Mail className="w-3 h-3" /> {app.applicant_email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white/90">{app.property_name}</div>
                                        <div className="text-xs text-white/40">{app.property_location}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(app.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getDecisionBadge(app.decision)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedApp(app);
                                                setOverrideDecision(app.decision);
                                                setOverrideNotes(app.landlord_override_notes || "");
                                            }}
                                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-all border border-white/5"
                                        >
                                            Review Check
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative" style={{ background: "rgba(18,18,18,0.98)" }}>
                        <h3 className="text-lg font-semibold text-white mb-4">Invite Tenant for Referencing</h3>
                        <form onSubmit={handleSendInvite} className="space-y-4">
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Select Property / Room</label>
                                <select
                                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    required
                                >
                                    <option value="" className="bg-[#121212]">Select a room...</option>
                                    {rooms.map((room) => (
                                        <option key={room.id} value={room.id} className="bg-[#121212]">
                                            {room.name} - {room.location} (£{room.price}/m)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Applicant Name</label>
                                <input
                                    type="text"
                                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none"
                                    placeholder="Enter applicant name"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Applicant Email</label>
                                <input
                                    type="email"
                                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none"
                                    placeholder="applicant@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Applicant Phone (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none"
                                    placeholder="+44 7700 900077"
                                    value={invitePhone}
                                    onChange={(e) => setInvitePhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="px-4 py-2.5 bg-white hover:bg-white/95 text-black text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                                >
                                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Review/Override Modal */}
            {selectedApp && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex justify-center items-start p-4 sm:p-8 md:p-12">
                    <div className="w-full max-w-2xl rounded-2xl p-6 border border-white/10 shadow-2xl relative my-auto md:my-8" style={{ background: "rgba(18,18,18,0.98)" }}>
                        <button
                            onClick={() => setSelectedApp(null)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <h3 className="text-lg font-semibold text-white mb-4">Referencing Application Details</h3>

                        <div className="space-y-6">
                            {/* Base details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl p-4 bg-white/[0.02] border border-white/5">
                                <div>
                                    <div className="text-xs text-white/40 uppercase">Applicant Details</div>
                                    <div className="font-semibold text-white mt-1">{selectedApp.applicant_name}</div>
                                    <div className="text-xs text-white/50">{selectedApp.applicant_email}</div>
                                    <div className="text-xs text-white/50">{selectedApp.applicant_phone || "No phone provided"}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-white/40 uppercase">Property / Room Details</div>
                                    <div className="font-semibold text-white mt-1">{selectedApp.property_name}</div>
                                    <div className="text-xs text-white/50">{selectedApp.property_location}</div>
                                    <div className="text-xs text-white/30 mt-1">Invited At: {new Date(selectedApp.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {/* Verification Results */}
                            <div>
                                <h4 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Automated Check Report</h4>
                                {selectedApp.status === "invited" ? (
                                    <p className="text-xs text-white/30 italic">Tenant has not submitted application yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                <div className="text-[10px] text-white/40 uppercase font-semibold">Credit Score</div>
                                                <div className={`text-2xl font-bold mt-1 ${selectedApp.credit_score && selectedApp.credit_score >= 650 ? "text-emerald-400" : selectedApp.credit_score && selectedApp.credit_score >= 550 ? "text-amber-400" : "text-red-400"}`}>
                                                    {selectedApp.credit_score || "N/A"}
                                                </div>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                <div className="text-[10px] text-white/40 uppercase font-semibold">CCJ / IVA Found</div>
                                                <div className={`text-2xl font-bold mt-1 ${selectedApp.ccj_iva_found ? "text-red-400" : "text-emerald-400"}`}>
                                                    {selectedApp.ccj_iva_found ? "Yes" : "No"}
                                                </div>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                                <div className="text-[10px] text-white/40 uppercase font-semibold">Missed Payments</div>
                                                <div className={`text-2xl font-bold mt-1 ${selectedApp.missed_payments >= 3 ? "text-red-400" : selectedApp.missed_payments > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                                                    {selectedApp.missed_payments}
                                                </div>
                                            </div>
                                        </div>

                                        {selectedApp.ai_raw_check_result && (
                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                                                <div className="text-xs text-white/40 uppercase font-semibold mb-1">AI Explanation / Findings</div>
                                                <p className="text-xs text-white/80 leading-relaxed">
                                                    {selectedApp.ai_raw_check_result.explanation || "No details provided."}
                                                </p>
                                            </div>
                                        )}

                                        {/* Uploaded Files */}
                                        {selectedApp.uploaded_documents && selectedApp.uploaded_documents.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs text-white/40 uppercase font-semibold">Uploaded Verification Documents</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {selectedApp.uploaded_documents.map((doc: any, idx: number) => {
                                                        const docName = typeof doc === "string" ? doc.split("/").pop() : doc.file_name || doc.file_url?.split("/").pop();
                                                        const docUrl = typeof doc === "string" ? doc : doc.file_url;
                                                        return (
                                                            <a
                                                                key={idx}
                                                                href={docUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs"
                                                            >
                                                                <span className="truncate">{docName}</span>
                                                                <Download className="w-3.5 h-3.5 text-white/40" />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Override Decision Section */}
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Update Application Outcome</h4>
                                    {selectedApp.status !== "invited" && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    setUpdating(true);
                                                    const res = await referencingApi.generateReport(selectedApp.id);
                                                    alert("Referencing PDF report generated successfully!");
                                                    // Update currently selected app
                                                    setSelectedApp(res.data);
                                                    setApplications(prev => prev.map(a => a.id === res.data.id ? res.data : a));
                                                } catch (err: any) {
                                                    alert("Failed to generate report: " + err.message);
                                                } finally {
                                                    setUpdating(false);
                                                }
                                            }}
                                            disabled={updating}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg border border-white/5 transition-all"
                                        >
                                            {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                                            {selectedApp.report_pdf_url ? "Regenerate PDF Report" : "Generate PDF Report"}
                                        </button>
                                    )}
                                </div>

                                {selectedApp.report_pdf_url && (
                                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>PDF Referencing Report is available.</span>
                                        </div>
                                        <a
                                            href={selectedApp.report_pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download PDF
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Decision Decision</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOverrideDecision("approve")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${overrideDecision === "approve" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideDecision("caution")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${overrideDecision === "caution" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                                        >
                                            Guarantor (Caution)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOverrideDecision("decline")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${overrideDecision === "decline" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"}`}
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Decision Notes & Rationale</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none"
                                        placeholder="Add notes explaining manual override decision or additional checks..."
                                        value={overrideNotes}
                                        onChange={(e) => setOverrideNotes(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedApp(null)}
                                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdateDecision}
                                        disabled={updating}
                                        className="px-4 py-2.5 bg-white hover:bg-white/95 text-black text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                                    >
                                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Outcome"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReferencingManager;
