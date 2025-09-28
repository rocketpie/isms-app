'use client'

import { postgrest } from "../api-isms";
import { SystemView } from "./systems";

export type ApplicationSystemView = {
    system: SystemView
    application_id: string;
    system_id: string;
};

export type ApplicationSystemRow = {
    application_id: string;
    system_id: string;
};

export async function listLinkedSystems(applicationId: string) {
    return await postgrest<ApplicationSystemView[]>(
        `/application_systems?application_id=eq.${encodeURIComponent(applicationId)}` +
        `&select=application_id,system_id,system:systems(id,name,description,owner:ownership(id,name))` +
        `&order=system(name).asc`,
        { method: 'GET' }
    );
}

export async function linkSystem(processId: string, applicationId: string) {
    return await postgrest<ApplicationSystemRow[]>(
        '/process_applications',
        {
            method: 'POST',
            body: JSON.stringify([{ process_id: processId, application_id: applicationId }]),
            headers: { Prefer: 'return=representation' },
        }
    );
}

export async function unlinkSystem(processId: string, applicationId: string) {
    // composite-key delete
    return await postgrest<null>(
        `/process_applications?process_id=eq.${encodeURIComponent(
            processId
        )}&application_id=eq.${encodeURIComponent(applicationId)}`,
        { method: 'DELETE' }
    );
}

