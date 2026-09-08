"use client";

import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";
import type { Organization } from "../services/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrganizationSettings({ initialOrganization }: { initialOrganization: Organization }) {
    const [organization, setOrganization] = useState(initialOrganization);
    const [name, setName] = useState(initialOrganization.name);
    const [location, setLocation] = useState(initialOrganization.location ?? "");
    const [phoneNumber, setPhoneNumber] = useState(initialOrganization.phone_number ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    async function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setIsUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch(`/api/backend/organizations/${organization.id}/logo`, {
                method: "POST",
                body: formData,
            });
            const result = await response.json().catch(() => null) as Organization & { detail?: string };
            if (!response.ok) throw new Error(result?.detail ?? "Unable to upload logo.");

            setOrganization(result);
            toast.success("Logo updated.");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Unable to upload logo.");
        } finally {
            setIsUploadingLogo(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSaving(true);

        try {
            const response = await fetch(`/api/organizations/${organization.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    location: location.trim() || null,
                    phone_number: phoneNumber.trim() || null,
                }),
            });
            const result = await response.json().catch(() => null) as Organization & { message?: string };
            if (!response.ok) throw new Error(result?.message ?? "Unable to update organization.");

            setOrganization(result);
            setName(result.name);
            setLocation(result.location ?? "");
            setPhoneNumber(result.phone_number ?? "");
            toast.success("Organization details updated.");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Unable to update organization.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="grid gap-5 text-left sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
                <Label>Organization logo</Label>
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-muted text-xs text-muted-foreground">
                        {organization.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`/api/uploads/${organization.logo.replace(/^uploads\//, "")}`}
                                alt={`${organization.name} logo`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            "No logo"
                        )}
                    </div>
                    <input
                        ref={logoInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif,.svg,.webp"
                        className="hidden"
                        onChange={handleLogoFileChange}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                    >
                        {isUploadingLogo ? "Uploading..." : organization.logo ? "Change logo" : "Upload logo"}
                    </Button>
                </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="organizationName">Organization name</Label>
                <Input id="organizationName" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="organizationLocation">Location</Label>
                <Input id="organizationLocation" value={location} onChange={(event) => setLocation(event.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="organizationPhone">Phone number</Label>
                <Input id="organizationPhone" type="tel" minLength={5} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
            </div>
            <div className="text-muted-foreground text-sm sm:col-span-2">Organization code: {organization.code}</div>
            <Button type="submit" disabled={isSaving || !name.trim()} className="sm:col-span-2">
                {isSaving ? "Saving..." : "Save organization details"}
            </Button>
        </form>
    );
}
