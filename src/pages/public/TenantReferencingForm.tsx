import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { referencingApi, type ReferencingApplication } from "../../lib/api";
import { 
    Loader2, 
    FileText, 
    Upload, 
    CheckCircle, 
    AlertCircle, 
    User, 
    Mail
} from "lucide-react";

const TenantReferencingForm: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [app, setApp] = useState<ReferencingApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // Form inputs
    const [addressHistory, setAddressHistory] = useState("");
    const [currentLandlordName, setCurrentLandlordName] = useState("");
    const [currentLandlordContact, setCurrentLandlordContact] = useState("");
    const [employerName, setEmployerName] = useState("");
    const [employerContact, setEmployerContact] = useState("");
    const [annualSalary, setAnnualSalary] = useState("");
    
    // File upload states
    const [uploadedDocs, setUploadedDocs] = useState<{ file_url: string; file_name: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    // Signature Pad Ref & logic
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    useEffect(() => {
        const fetchApp = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await referencingApi.getPublic(token);
                setApp(data);
                if (data.status !== "invited" && data.status !== "submitted" && data.status !== "processing") {
                    setError("This referencing application is already completed or expired.");
                }
            } catch (err: any) {
                console.error(err);
                setError("Invalid referencing invitation link or token expired.");
            } finally {
                setLoading(false);
            }
        };
        fetchApp();
    }, [token]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await referencingApi.upload(file);
            if (res.success) {
                setUploadedDocs((prev) => [...prev, { file_url: res.file_url, file_name: res.file_name }]);
            }
        } catch (err: any) {
            alert(err.message || "Failed to upload document.");
        } finally {
            setUploading(false);
        }
    };

    // Signature Canvas logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSigned(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        if (!hasSigned) {
            alert("Please draw your signature to proceed.");
            return;
        }

        try {
            setSubmitting(true);
            const signatureDataUrl = canvasRef.current?.toDataURL() || "";
            const payload = {
                address_history: addressHistory,
                current_landlord_name: currentLandlordName,
                current_landlord_contact: currentLandlordContact,
                employer_name: employerName,
                employer_contact: employerContact,
                annual_salary: annualSalary,
                signature_image: signatureDataUrl
            };

            await referencingApi.submitPublic(token, payload, uploadedDocs);
            setStep(4); // Success step
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to submit referencing application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
                <video className="fixed inset-0 w-full h-full object-cover opacity-30" autoPlay loop muted playsInline src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" />
                <div className="fixed inset-0 bg-black/60" />
                <div className="relative z-10 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-white mx-auto" />
                    <p className="text-white/60 text-sm">Loading referencing session...</p>
                </div>
            </div>
        );
    }

    if (error || !app) {
        return (
            <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-4">
                <video className="fixed inset-0 w-full h-full object-cover opacity-30" autoPlay loop muted playsInline src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" />
                <div className="fixed inset-0 bg-black/60" />
                <div className="relative z-10 max-w-md w-full rounded-2xl p-8 border border-white/10 text-center bg-white/[0.02] backdrop-blur-2xl">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Referencing Error</h2>
                    <p className="text-white/50 text-sm mb-6">{error || "Invitation not found."}</p>
                    <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white py-12 px-4 overflow-y-auto">
            <video className="fixed inset-0 w-full h-full object-cover opacity-30" autoPlay loop muted playsInline src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" />
            <div className="fixed inset-0 bg-black/65" />

            <div className="relative z-10 max-w-xl w-full mx-auto" style={{ background: "rgba(10,10,10,0.65)", backdropFilter: "blur(25px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px" }}>
                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Tenant Referencing Application</h1>
                        <p className="text-white/40 text-sm mt-1.5">For: <span className="text-white/70 font-medium">{app.property_name}</span></p>
                    </div>

                    {/* Progress Indicator */}
                    {step < 4 && (
                        <div className="flex items-center justify-between mb-8 px-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                            <span className={step === 1 ? "text-white" : ""}>1. Personal details</span>
                            <span className={step === 2 ? "text-white" : ""}>2. Financials & Uploads</span>
                            <span className={step === 3 ? "text-white" : ""}>3. Declaration</span>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-5">
                            <h3 className="text-base font-semibold text-white/80 border-b border-white/5 pb-2">Step 1: Contact & Address History</h3>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Full Name</label>
                                <div className="flex items-center h-11 px-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white/60">
                                    <User className="w-4 h-4 mr-2 text-white/30" /> {app.applicant_name}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Email Address</label>
                                <div className="flex items-center h-11 px-3 bg-white/5 border border-white/5 rounded-xl text-sm text-white/60">
                                    <Mail className="w-4 h-4 mr-2 text-white/30" /> {app.applicant_email}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">3-Year Address History</label>
                                <textarea
                                    rows={3}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                    placeholder="Enter your previous residential addresses for the last 3 years..."
                                    value={addressHistory}
                                    onChange={(e) => setAddressHistory(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Current Landlord Name</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                        placeholder="Name"
                                        value={currentLandlordName}
                                        onChange={(e) => setCurrentLandlordName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Landlord Email / Phone</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                        placeholder="Contact details"
                                        value={currentLandlordContact}
                                        onChange={(e) => setCurrentLandlordContact(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => setStep(2)}
                                    disabled={!addressHistory}
                                    className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/95 transition-all disabled:opacity-50"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h3 className="text-base font-semibold text-white/80 border-b border-white/5 pb-2">Step 2: Employment, Financials & Credit File</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Current Employer Name</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                        placeholder="Employer"
                                        value={employerName}
                                        onChange={(e) => setEmployerName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Employer Contact Person</label>
                                    <input
                                        type="text"
                                        className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                        placeholder="HR/Manager Email"
                                        value={employerContact}
                                        onChange={(e) => setEmployerContact(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Gross Annual Salary (£)</label>
                                <input
                                    type="number"
                                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                                    placeholder="e.g. 35000"
                                    value={annualSalary}
                                    onChange={(e) => setAnnualSalary(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Verification file upload */}
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Upload Official Credit Report (PDF/Image)</label>
                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-white/20 transition-all relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                        accept=".pdf,image/*"
                                        disabled={uploading}
                                    />
                                    <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
                                    <span className="text-xs text-white/60 block">Drag & drop or click to upload your credit file (Max 10MB)</span>
                                </div>
                                {uploading && (
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-white/40 mt-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document...
                                    </div>
                                )}
                            </div>

                            {uploadedDocs.length > 0 && (
                                <div className="space-y-1.5">
                                    <span className="text-xs text-white/40 uppercase">Uploaded Files:</span>
                                    <div className="space-y-1">
                                        {uploadedDocs.map((doc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-white/80">
                                                <FileText className="w-3.5 h-3.5 text-white/30" />
                                                <span className="truncate">{doc.file_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-between gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!employerName || !annualSalary || uploadedDocs.length === 0}
                                    className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/95 transition-all disabled:opacity-50"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <h3 className="text-base font-semibold text-white/80 border-b border-white/5 pb-2">Step 3: Declaration & Signature</h3>
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50 leading-relaxed space-y-2">
                                <p>1. I confirm that the information provided in this application is true and complete to the best of my knowledge.</p>
                                <p>2. I authorize NeoScape Properties Ltd and its agents to conduct credit, employment, and landlord checks based on this application.</p>
                                <p>3. I understand that the referencing fee is non-refundable and that the final tenancy decision is subject to the landlord's review.</p>
                            </div>

                            {/* Signature canvas */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs text-white/40 uppercase tracking-wider">Draw Your Signature</label>
                                    {hasSigned && (
                                        <button type="button" onClick={clearSignature} className="text-xs text-white/30 hover:text-white/60 transition-colors underline">Clear</button>
                                    )}
                                </div>
                                <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                                    <canvas
                                        ref={canvasRef}
                                        width={480}
                                        height={180}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={stopDrawing}
                                        className="w-full cursor-crosshair"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !hasSigned}
                                    className="px-6 py-2.5 bg-white hover:bg-white/95 text-black text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center py-8 space-y-4">
                            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
                            <h2 className="text-xl font-bold text-white">Application Submitted!</h2>
                            <p className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">
                                Thank you for completing your referencing application. Your details have been securely logged, and automated checks are running in the background. The landlord will review your file shortly.
                            </p>
                            <div className="pt-4">
                                <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">
                                    Go to Homepage
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TenantReferencingForm;
