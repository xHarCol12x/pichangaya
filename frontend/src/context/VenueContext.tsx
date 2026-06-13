"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { venues as venuesApi } from "@/lib/api";

interface Venue {
    id: string;
    name: string;
    address: string;
    description?: string;
}

interface VenueContextType {
    selectedVenueId: string | null;
    selectedVenue: Venue | null;
    venues: Venue[];
    setSelectedVenueId: (id: string) => void;
    isLoadingVenues: boolean;
    refreshVenues: () => Promise<void>;
}

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export function VenueProvider({ children }: { children: ReactNode }) {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenueId, setSelectedVenueIdState] = useState<string | null>(null);
    const [isLoadingVenues, setIsLoadingVenues] = useState(true);

    const refreshVenues = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_token") : null;
        if (!token) {
            setVenues([]);
            setIsLoadingVenues(false);
            return;
        }

        setIsLoadingVenues(true);
        try {
            const res = await venuesApi.getAll();
            const data = res.data;
            
            // Safety check: ensure userVenues is an array
            const userVenues = Array.isArray(data) ? data : (data?.data || data?.venues || []);
            
            setVenues(userVenues);

            // Set initial selected venue from localStorage or fallback to first one
            const savedVenueId = localStorage.getItem("fieldiq_selected_venue_id");
            if (savedVenueId && userVenues.find((v: Venue) => v.id === savedVenueId)) {
                setSelectedVenueIdState(savedVenueId);
            } else if (userVenues.length > 0) {
                setSelectedVenueIdState(userVenues[0].id);
                localStorage.setItem("fieldiq_selected_venue_id", userVenues[0].id);
            }
        } catch (error) {
            console.error("Error loading venues in context", error);
        } finally {
            setIsLoadingVenues(false);
        }
    };

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("fieldiq_token") : null;
        if (token && venues.length === 0) {
            refreshVenues();
        }
    }, []);

    // Listen for storage changes (like login)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'fieldiq_token' && e.newValue) {
                refreshVenues();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const setSelectedVenueId = (id: string) => {
        setSelectedVenueIdState(id);
        localStorage.setItem("fieldiq_selected_venue_id", id);
    };

    const selectedVenue = venues.find(v => v.id === selectedVenueId) || null;

    return (
        <VenueContext.Provider value={{
            selectedVenueId,
            selectedVenue,
            venues,
            setSelectedVenueId,
            isLoadingVenues,
            refreshVenues
        }}>
            {children}
        </VenueContext.Provider>
    );
}

export function useVenue() {
    const context = useContext(VenueContext);
    if (context === undefined) {
        throw new Error("useVenue must be used within a VenueProvider");
    }
    return context;
}
