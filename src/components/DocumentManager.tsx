"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  AlertCircle,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Download,
  Bell,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import type { PropertyDocument, DocumentReminder } from "../lib/documentTypes";
import { documentsApi } from "../lib/api";

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [reminders, setReminders] = useState<DocumentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<PropertyDocument | null>(null);
  const [newDocument, setNewDocument] = useState<Partial<PropertyDocument>>({
    name: "",
    type: "license",
    description: "",
    fileUrl: "",
    expiryDate: "",
    renewalDate: "",
    reminderDays: 30,
    notes: "",
  });

  // Load documents from backend
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await documentsApi.list();
        setDocuments(data);
      } catch (err: any) {
        setError(err.message || "Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  useEffect(() => {
    updateReminders();
  }, [documents]);

  // Check document status and generate reminders
  const updateReminders = () => {
    const today = new Date();
    const newReminders: DocumentReminder[] = [];

    documents.forEach((doc) => {
      if (doc.expiryDate) {
        const expiryDate = new Date(doc.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (
          daysUntilExpiry <= (doc.reminderDays || 30) &&
          daysUntilExpiry > 0
        ) {
          newReminders.push({
            id: `reminder-${doc.id}`,
            documentId: doc.id,
            documentName: doc.name,
            reminderDate: doc.expiryDate,
            type: "expiry",
            dismissed: false,
          });
        }

        // Update document status
        if (daysUntilExpiry < 0) {
          doc.status = "expired";
        } else if (daysUntilExpiry <= (doc.reminderDays || 30)) {
          doc.status = "expiring-soon";
        } else {
          doc.status = "active";
        }
      }

      if (doc.renewalDate) {
        const renewalDate = new Date(doc.renewalDate);
        const daysUntilRenewal = Math.ceil(
          (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilRenewal <= 7 && daysUntilRenewal >= 0) {
          newReminders.push({
            id: `renewal-${doc.id}`,
            documentId: doc.id,
            documentName: doc.name,
            reminderDate: doc.renewalDate,
            type: "renewal",
            dismissed: false,
          });
        }
      }
    });

    setReminders(newReminders);
  };

  const handleAddDocument = async () => {
    if (newDocument.name && newDocument.fileUrl) {
      try {
        setError(null);
        const document = await documentsApi.create({
          name: newDocument.name,
          type: newDocument.type || "license",
          description: newDocument.description || "",
          fileUrl: newDocument.fileUrl,
          expiryDate: newDocument.expiryDate || undefined,
          renewalDate: newDocument.renewalDate || undefined,
          status: "active",
          reminderDays: newDocument.reminderDays || 30,
          notes: newDocument.notes || "",
        });
        setDocuments([document, ...documents]);
        setNewDocument({
          name: "",
          type: "license",
          description: "",
          fileUrl: "",
          expiryDate: "",
          renewalDate: "",
          reminderDays: 30,
          notes: "",
        });
        setUploadFile(null);
        setIsAddingDocument(false);
      } catch (err: any) {
        setError(err.message || "Failed to create document");
      }
    }
  };

  const handleUpdateDocument = async () => {
    if (editingDocument) {
      try {
        setError(null);
        const updated = await documentsApi.update(editingDocument.id, editingDocument);
        setDocuments(
          documents.map((doc) => (doc.id === editingDocument.id ? updated : doc))
        );
        setEditingDocument(null);
      } catch (err: any) {
        setError(err.message || "Failed to update document");
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await documentsApi.remove(id);
        setDocuments(documents.filter((doc) => doc.id !== id));
      } catch (err: any) {
        setError(err.message || "Failed to delete document");
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      setError(null);
      const url = await documentsApi.upload(uploadFile);
      setNewDocument({ ...newDocument, fileUrl: url });
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: PropertyDocument["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expiring-soon":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "renewed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-700">
            {error}
          </CardContent>
        </Card>
      )}
      {loading && (
        <Card>
          <CardContent className="pt-6">Loading documents...</CardContent>
        </Card>
      )}
      {/* Alerts Section */}
      {reminders.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Bell className="w-5 h-5 mr-2" />
              Document Reminders ({reminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">{reminder.documentName}</p>
                      <p className="text-sm text-gray-600">
                        {reminder.type === "renewal" ? "Renewal" : "Expiry"}{" "}
                        date:{" "}
                        {new Date(reminder.reminderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setReminders(
                        reminders.filter((r) => r.id !== reminder.id),
                      )
                    }
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{documents.length}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {documents.filter((d) => d.status === "active").length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {documents.filter((d) => d.status === "expiring-soon").length}
            </div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {documents.filter((d) => d.status === "expired").length}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Document Button */}
      <Button
        onClick={() => setIsAddingDocument(true)}
        className="bg-pink-500 hover:bg-pink-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Document
      </Button>

      {/* Add/Edit Document Form */}
      {(isAddingDocument || editingDocument) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingDocument ? "Edit Document" : "Add New Document"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingDocument(false);
                  setEditingDocument(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="docName">Document Name *</Label>
                <Input
                  id="docName"
                  value={
                    editingDocument ? editingDocument.name : newDocument.name
                  }
                  onChange={(e) =>
                    editingDocument
                      ? setEditingDocument({
                          ...editingDocument,
                          name: e.target.value,
                        })
                      : setNewDocument({ ...newDocument, name: e.target.value })
                  }
                  placeholder="e.g., Business License"
                />
              </div>
              <div>
                <Label htmlFor="docType">Document Type</Label>
                <select
                  id="docType"
                  aria-label="Document type"
                  value={
                    editingDocument ? editingDocument.type : newDocument.type
                  }
                  onChange={(e) =>
                    editingDocument
                      ? setEditingDocument({
                          ...editingDocument,
                          type: e.target.value as PropertyDocument["type"],
                        })
                      : setNewDocument({
                          ...newDocument,
                          type: e.target.value as PropertyDocument["type"],
                        })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="license">License</option>
                  <option value="permit">Permit</option>
                  <option value="insurance">Insurance</option>
                  <option value="contract">Contract</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="docDescription">Description</Label>
              <Textarea
                id="docDescription"
                value={
                  editingDocument
                    ? editingDocument.description
                    : newDocument.description
                }
                onChange={(e) =>
                  editingDocument
                    ? setEditingDocument({
                        ...editingDocument,
                        description: e.target.value,
                      })
                    : setNewDocument({
                        ...newDocument,
                        description: e.target.value,
                      })
                }
                placeholder="Brief description of the document"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                value={
                  editingDocument
                    ? editingDocument.fileUrl
                    : newDocument.fileUrl
                }
                onChange={(e) =>
                  editingDocument
                    ? setEditingDocument({
                        ...editingDocument,
                        fileUrl: e.target.value,
                      })
                    : setNewDocument({
                        ...newDocument,
                        fileUrl: e.target.value,
                      })
                }
                placeholder="URL to document file or cloud storage link"
              />
            </div>

            <div>
              <Label htmlFor="docUpload">Or Upload File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="docUpload"
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!uploadFile || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload will set the File URL automatically (uses Supabase Storage).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={
                    editingDocument
                      ? editingDocument.expiryDate
                      : newDocument.expiryDate
                  }
                  onChange={(e) =>
                    editingDocument
                      ? setEditingDocument({
                          ...editingDocument,
                          expiryDate: e.target.value,
                        })
                      : setNewDocument({
                          ...newDocument,
                          expiryDate: e.target.value,
                        })
                  }
                />
              </div>
              <div>
                <Label htmlFor="renewalDate">Renewal Date</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={
                    editingDocument
                      ? editingDocument.renewalDate
                      : newDocument.renewalDate
                  }
                  onChange={(e) =>
                    editingDocument
                      ? setEditingDocument({
                          ...editingDocument,
                          renewalDate: e.target.value,
                        })
                      : setNewDocument({
                          ...newDocument,
                          renewalDate: e.target.value,
                        })
                  }
                />
              </div>
              <div>
                <Label htmlFor="reminderDays">Reminder (days before)</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  value={
                    editingDocument
                      ? editingDocument.reminderDays
                      : newDocument.reminderDays
                  }
                  onChange={(e) =>
                    editingDocument
                      ? setEditingDocument({
                          ...editingDocument,
                          reminderDays: Number(e.target.value),
                        })
                      : setNewDocument({
                          ...newDocument,
                          reminderDays: Number(e.target.value),
                        })
                  }
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={
                  editingDocument ? editingDocument.notes : newDocument.notes
                }
                onChange={(e) =>
                  editingDocument
                    ? setEditingDocument({
                        ...editingDocument,
                        notes: e.target.value,
                      })
                    : setNewDocument({ ...newDocument, notes: e.target.value })
                }
                placeholder="Additional notes or comments"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={
                  editingDocument ? handleUpdateDocument : handleAddDocument
                }
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Check className="w-4 h-4 mr-2" />
                {editingDocument ? "Update" : "Save"} Document
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingDocument(false);
                  setEditingDocument(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Property Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">
                No documents found. Add your first document to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{doc.name}</h4>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {doc.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Type:</span>{" "}
                              {doc.type}
                            </div>
                            <div>
                              <span className="font-medium">Uploaded:</span>{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </div>
                            {doc.expiryDate && (
                              <div>
                                <span className="font-medium">Expires:</span>{" "}
                                {new Date(doc.expiryDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          {doc.renewalDate && (
                            <div className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">Renewal:</span>{" "}
                              {new Date(doc.renewalDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDocument(doc)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;
