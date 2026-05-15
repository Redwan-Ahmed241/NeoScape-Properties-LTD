"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, ChevronRight, Upload, Save, Image as ImageIcon,
  DoorOpen, Loader2, AlertCircle, CheckCircle, FileText, DollarSign,
  User, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { roomsApi, uploadApi, rentSchedulesApi, documentsApi } from "../lib/api";
import { formatPrice, formatDate } from "../lib/utils";
import type { Room } from "../lib/types";
import type { RentSchedule, PropertyDocument } from "../lib/documentTypes";

const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState(0);

  // Rent state
  const [schedules, setSchedules] = useState<RentSchedule[]>([]);
  const [loadingRent, setLoadingRent] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      setIsLoading(true);
      const response = await roomsApi.getRoom(roomId);
      const r = response.data || response;
      setRoom(r);
      setEditName(r.name);
      setEditDesc(r.description || "");
      setEditPrice(r.price);
    } catch (err: any) {
      setError(err.message || "Failed to fetch room");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchRentSchedules = useCallback(async () => {
    try {
      setLoadingRent(true);
      const all = await rentSchedulesApi.list();
      // Filter schedules matching this room name
      const filtered = room ? all.filter((s) => s.roomName === room.name) : all;
      setSchedules(filtered);
    } catch { /* silently fail */ }
    finally { setLoadingRent(false); }
  }, [room]);

  const fetchDocuments = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoadingDocs(true);
      const docs = await documentsApi.list(roomId);
      setDocuments(docs);
    } catch { /* silently fail */ }
    finally { setLoadingDocs(false); }
  }, [roomId]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);
  useEffect(() => { if (room) { fetchRentSchedules(); fetchDocuments(); } }, [room, fetchRentSchedules, fetchDocuments]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Save room edits
  const handleSave = async () => {
    if (!roomId || !room) return;
    try {
      setIsSaving(true);
      setError(null);
      await roomsApi.updateRoom(roomId, {
        name: editName,
        description: editDesc,
        price: editPrice,
      });
      await fetchRoom();
      showSuccess("Room updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update room");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle to-let status
  const handleToggleAvailability = async () => {
    if (!roomId || !room) return;
    try {
      setError(null);
      await roomsApi.updateRoom(roomId, { available: !room.available });
      await fetchRoom();
      showSuccess(room.available ? "Room marked as occupied" : "Room marked as to-let");
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  // Upload room image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !roomId || !room) return;
    try {
      setUploadingImage(true);
      setError(null);
      const result = await uploadApi.uploadImages(e.target.files);
      const urls = result?.data?.urls || [];
      if (urls.length > 0) {
        const updatedImages = [...(room.images || []), ...urls];
        await roomsApi.updateRoom(roomId, { images: updatedImages });
        await fetchRoom();
        showSuccess("Image uploaded successfully");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  // Upload document
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !roomId) return;
    try {
      setUploadingDoc(true);
      setError(null);
      const file = e.target.files[0];
      const url = await documentsApi.upload(file);
      await documentsApi.create({
        name: file.name,
        type: "other",
        description: "",
        fileUrl: url,
        propertyId: roomId,
        status: "active",
      });
      await fetchDocuments();
      showSuccess("Document uploaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  // Record a payment
  const handleRecordPayment = async (scheduleId: string, amount: number) => {
    try {
      setError(null);
      const today = new Date().toISOString().split("T")[0];
      await rentSchedulesApi.recordPayment(scheduleId, {
        dueDate: today,
        paidDate: today,
        amount,
        paidAmount: amount,
        status: "paid",
        paymentMethod: "cash",
        notes: "",
      });
      await fetchRentSchedules();
      showSuccess("Payment recorded");
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
          <p className="text-gray-500 text-sm">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Room not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin")}>
          Back to Properties
        </Button>
      </div>
    );
  }

  // Compute rent summary from schedules
  const activeSchedule = schedules.find((s) => s.status === "active");
  const lastPayment = activeSchedule?.paymentHistory?.[0];
  const monthlyDue = activeSchedule?.monthlyRent || 0;
  const totalPaid = activeSchedule?.paymentHistory
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <button onClick={() => navigate("/admin")} className="hover:text-pink-600 transition-colors flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" /> Properties
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate(`/admin/villa/${encodeURIComponent(room.location)}`)} className="hover:text-pink-600 transition-colors">
          {room.location}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium truncate">{room.name}</span>
      </div>

      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/admin/villa/${encodeURIComponent(room.location)}`)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
          <p className="text-gray-500 text-sm">{room.location}</p>
        </div>
        {/* To-let toggle */}
        <button onClick={handleToggleAvailability} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${room.available ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"}`}>
          {room.available ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {room.available ? "To-let" : "Occupied"}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-xs">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="details" className="flex items-center gap-2"><DoorOpen className="w-4 h-4" /> Details</TabsTrigger>
          <TabsTrigger value="rent" className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Rent</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</TabsTrigger>
        </TabsList>

        {/* ─── Details Tab ─── */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Room Image */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-pink-500" /> Room Image</CardTitle></CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span className="text-sm">No image uploaded</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  <div className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl text-sm font-medium transition-all ${uploadingImage ? "border-gray-200 text-gray-400" : "border-pink-300 text-pink-600 hover:bg-pink-50 hover:border-pink-400"}`}>
                    {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload / Replace Image</>}
                  </div>
                </label>
                {/* Additional images */}
                {room.images && room.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {room.images.slice(1).map((img, i) => (
                      <img key={i} src={img} alt={`${room.name} ${i + 2}`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Info Edit */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DoorOpen className="w-4 h-4 text-purple-500" /> Room Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Room Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="edit-price">Monthly Rent</Label>
                  <Input id="edit-price" type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="mt-1" />
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-semibold text-gray-900">{room.bedrooms}</div>
                    <div className="text-gray-500 text-xs">Bedrooms</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-semibold text-gray-900">{room.bathrooms}</div>
                    <div className="text-gray-500 text-xs">Bathrooms</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="font-semibold text-gray-900">{room.size}m²</div>
                    <div className="text-gray-500 text-xs">Size</div>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white">
                  {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Rent Tab ─── */}
        <TabsContent value="rent" className="space-y-6">
          {/* Rent Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(monthlyDue)}</p>
                <p className="text-xs text-gray-400">per month</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatPrice(totalPaid)}</p>
                <p className="text-xs text-gray-400">all time</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{lastPayment?.paidDate ? formatDate(lastPayment.paidDate) : "—"}</p>
                <p className="text-xs text-gray-400">last payment</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</p>
                <p className="text-lg font-bold text-gray-900 mt-1 truncate">{activeSchedule?.tenantName || "—"}</p>
                <p className="text-xs text-gray-400">tenant</p>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Details */}
          {loadingRent ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" /></div>
          ) : schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No rent schedules for this room.</p>
                <p className="text-gray-400 text-xs mt-1">Create one from the Rent Collection section.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> {schedule.tenantName}
                        <Badge variant={schedule.status === "active" ? "default" : "secondary"} className="text-xs ml-2">{schedule.status}</Badge>
                      </CardTitle>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(schedule.monthlyRent)}/mo</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 mb-3">Due day: {schedule.dueDay} · Since: {formatDate(schedule.startDate)}</div>
                    {/* Payment History */}
                    {schedule.paymentHistory.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Date</th>
                              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Amount</th>
                              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.paymentHistory.slice(0, 5).map((p) => (
                              <tr key={p.id} className="border-t">
                                <td className="px-3 py-2 text-gray-700">{p.paidDate ? formatDate(p.paidDate) : formatDate(p.dueDate)}</td>
                                <td className="px-3 py-2 font-medium">{formatPrice(p.paidAmount || p.amount)}</td>
                                <td className="px-3 py-2"><Badge variant={p.status === "paid" ? "default" : "secondary"} className="text-xs">{p.status}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {schedule.status === "active" && (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => handleRecordPayment(schedule.id, schedule.monthlyRent)}>
                        <DollarSign className="w-3.5 h-3.5 mr-1" /> Record Payment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Documents Tab ─── */}
        <TabsContent value="documents" className="space-y-6">
          {/* Upload */}
          <Card>
            <CardContent className="p-5">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleDocUpload} disabled={uploadingDoc} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp" />
                <div className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-xl text-sm font-medium transition-all ${uploadingDoc ? "border-gray-200 text-gray-400" : "border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"}`}>
                  {uploadingDoc ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading document...</> : <><Upload className="w-4 h-4" /> Upload Document (PDF, DOC, XLS, Images)</>}
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Document List */}
          {loadingDocs ? (
            <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-pink-500 mx-auto" /></div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No documents uploaded for this room.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2.5 bg-purple-50 rounded-xl"><FileText className="w-5 h-5 text-purple-500" /></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Uploaded {formatDate(doc.uploadDate)} · <Badge variant="outline" className="text-xs capitalize">{doc.type}</Badge>
                      </p>
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                      View
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomDetailPage;
