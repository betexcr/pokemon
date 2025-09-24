import React from "react";
import AuthGate from "@/components/checklist/AuthGate";
import Filters from "@/components/checklist/Filters";
import DexGrid from "@/components/checklist/DexGrid";
import ProgressBar from "@/components/checklist/ProgressBar";
import StatsPanel from "@/components/checklist/StatsPanel";
import ShareModal from "@/components/checklist/ShareModal";
import { ChecklistProvider } from "@/components/checklist/ChecklistProvider";
import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: "Pokédex Checklist",
};

export default function ChecklistPage() {
  return (
    <>
      <AppHeader title="Pokédex Checklist" backLink="/" backLabel="Back to PokéDex" showToolbar={true} />
      <div className="container mx-auto px-4 py-6">
        <ChecklistProvider>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Pokédex Checklist</h1>
            <div className="flex items-center gap-3">
              <AuthGate />
              <ShareModal />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <ProgressBar />
            <Filters />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <DexGrid />
              </div>
              <div className="lg:col-span-1">
                <StatsPanel />
              </div>
            </div>
          </div>
        </ChecklistProvider>
      </div>
    </>
  );
}
