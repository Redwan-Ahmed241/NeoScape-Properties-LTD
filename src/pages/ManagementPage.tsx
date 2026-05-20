"use client";

import type React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FileText, DollarSign } from "lucide-react";
import DocumentManager from "../components/DocumentManager";
import RentScheduler from "../components/RentScheduler";

const ManagementPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-white tracking-tight">Management</h1>
                <p className="text-white/40 text-sm mt-1">Manage rent schedules and property documents in one place.</p>
            </div>

            <Tabs defaultValue="rent">
                <TabsList className="mb-6 bg-transparent border-b border-white/[0.07] rounded-none p-0 h-auto gap-0">
                    <TabsTrigger
                        value="rent"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"
                    >
                        <DollarSign className="w-4 h-4" /> Rent Collection
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/40 rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent transition-all"
                    >
                        <FileText className="w-4 h-4" /> Documents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rent">
                    <RentScheduler />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentManager />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManagementPage;
