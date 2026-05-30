"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FileText, DollarSign, Image as ImageIcon, Building2, ChevronDown, Search } from "lucide-react";
import DocumentCenter from "../components/DocumentCenter";
import RentScheduler from "../components/RentScheduler";
import PropertyImageManager from "../components/PropertyImageManager";
import { roomsApi } from "../lib/api";

const ManagementPage: React.FC = () => {
    const [properties, setProperties] = useState<string[]>([]);
    const [selectedProperty, setSelectedProperty] = useState<string>("");
    const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
    const [propertySearch, setPropertySearch] = useState("");
    const [loadingProperties, setLoadingProperties] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoadingProperties(true);
                const response = await roomsApi.getRooms();
                const rooms = response.data || response;
                const locations = Array.from(new Set((rooms as any[]).map((r: any) => r.location).filter(Boolean))) as string[];
                locations.sort();
                setProperties(locations);
            } catch {
                // silently fail
            } finally {
                setLoadingProperties(false);
            }
        };
        fetchProperties();
    }, []);

    const filteredProperties = properties.filter((p) =>
        p.toLowerCase().includes(propertySearch.toLowerCase())
    );

    const tabTriggerCls = "flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all";

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div
                className="rounded-2xl p-6 sm:p-8"
                style={{
                    background: "rgba(8,8,8,0.65)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.07)",
                }}
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-white tracking-tight">Management</h1>
                    <p className="text-white/40 text-sm mt-1">Manage rent schedules, documents, and property media in one place.</p>
                </div>

                {/* ── Property Selector ── */}
                <div className="mb-6">
                    <label className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2 block">
                        <Building2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Property Filter
                    </label>
                    <div className="relative max-w-sm">
                        <button
                            onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                            className="flex items-center justify-between w-full h-11 px-4 rounded-xl text-sm transition-all"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            <span className={selectedProperty ? "text-white" : "text-white/30"}>
                                {selectedProperty || "All Properties"}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${showPropertyDropdown ? "rotate-180" : ""}`} />
                        </button>

                        {showPropertyDropdown && (
                            <>
                                {/* Overlay to close on click outside */}
                                <div className="fixed inset-0 z-40" onClick={() => setShowPropertyDropdown(false)} />
                                <div
                                    className="absolute z-50 mt-1.5 w-full rounded-xl shadow-2xl overflow-hidden"
                                    style={{
                                        background: "rgba(15,15,15,0.98)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(20px)",
                                    }}
                                >
                                    {/* Search */}
                                    <div className="p-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                            <input
                                                className="w-full h-9 pl-9 pr-3 rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none"
                                                style={{ background: "rgba(255,255,255,0.05)" }}
                                                placeholder="Search properties…"
                                                value={propertySearch}
                                                onChange={(e) => setPropertySearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    {/* Options */}
                                    <div className="max-h-56 overflow-y-auto py-1">
                                        <button
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!selectedProperty ? "text-white bg-white/5" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                            onClick={() => { setSelectedProperty(""); setShowPropertyDropdown(false); setPropertySearch(""); }}
                                        >
                                            All Properties
                                        </button>
                                        {loadingProperties ? (
                                            <div className="px-4 py-3 text-xs text-white/20">Loading…</div>
                                        ) : filteredProperties.length === 0 ? (
                                            <div className="px-4 py-3 text-xs text-white/20">No properties found</div>
                                        ) : (
                                            filteredProperties.map((prop) => (
                                                <button
                                                    key={prop}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedProperty === prop ? "text-white bg-white/5" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                                                    onClick={() => { setSelectedProperty(prop); setShowPropertyDropdown(false); setPropertySearch(""); }}
                                                >
                                                    <Building2 className="w-3.5 h-3.5 inline mr-2 -mt-0.5 text-white/20" />
                                                    {prop}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    {selectedProperty && (
                        <p className="text-xs text-white/20 mt-2">
                            Showing data for <span className="text-white/50 font-medium">{selectedProperty}</span>
                            <button onClick={() => setSelectedProperty("")} className="ml-2 text-white/30 hover:text-white/60 transition-colors underline">Clear</button>
                        </p>
                    )}
                </div>

                {/* ── Tabs ── */}
                <Tabs defaultValue="rent">
                    <TabsList className="mb-6 bg-transparent border-b border-white/[0.07] rounded-none p-0 h-auto gap-0 w-full justify-start flex-wrap">
                        <TabsTrigger value="rent" className={tabTriggerCls}>
                            <DollarSign className="w-4 h-4" /> Rent Collection
                        </TabsTrigger>
                        <TabsTrigger value="documents" className={tabTriggerCls}>
                            <FileText className="w-4 h-4" /> Documents
                        </TabsTrigger>
                        <TabsTrigger value="property-images" className={tabTriggerCls}>
                            <ImageIcon className="w-4 h-4" /> Property Images
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="rent">
                        <RentScheduler />
                    </TabsContent>

                    <TabsContent value="documents">
                        <DocumentCenter propertyName={selectedProperty} />
                    </TabsContent>

                    <TabsContent value="property-images">
                        <PropertyImageManager propertyName={selectedProperty} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ManagementPage;
