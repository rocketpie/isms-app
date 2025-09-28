'use client'

import { postgrest } from "../api-isms";
import { ApplicationView } from "./applications";

export type ProcessApplicationView = {
    application: ApplicationView;
    process_id: string;
    application_id: string;
};

type ProcessApplicationRow = {
    process_id: string;
    application_id: string;
};

export async function listLinkedApplications(processId: string) {
    return await postgrest<ProcessApplicationView[]>(
        `/process_applications?process_id=eq.${encodeURIComponent(processId)}` +
        `&select=process_id,application_id,application:applications(id,name,description,owner:ownership(id,name))` +
        `&order=application(name).asc`,
        { method: 'GET' }
    );
}

export async function linkApplication(processId: string, applicationId: string) {
    return await postgrest<ProcessApplicationRow[]>(
        '/process_applications',
        {
            method: 'POST',
            body: JSON.stringify([{ process_id: processId, application_id: applicationId }]),
            headers: { Prefer: 'return=representation' },
        }
    );
}

export async function unlinkApplication(processId: string, applicationId: string) {
    // composite-key delete
    return await postgrest<null>(
        `/process_applications?process_id=eq.${encodeURIComponent(
            processId
        )}&application_id=eq.${encodeURIComponent(applicationId)}`,
        { method: 'DELETE' }
    );
}

