'use client'

import { postgrest } from "../api-isms";
import { OwnershipView } from "./ownership";

export type ProcessView = {
    id: string;
    name: string;
    description: string | null;
    owner: OwnershipView | null;
};

type ProcessRow = {
    id?: string;
    name: string;
    owner_id: string | null;
    description: string | null;
};


export async function listProcesses() {
    // GET /processes?select=id,name,description,owner:ownership(id,name)&order=name.asc
    return await postgrest<ProcessView[]>(
        '/processes?select=id,name,description,owner:ownership(id,name)&order=name.asc',
        { method: 'GET' }
    );
}

export async function createProcess(input: ProcessView) {
    const { id, owner, ...rest } = input;
    const dataModel: ProcessRow = {
        ...rest,
        owner_id: owner?.id ?? null,
    };
    return await postgrest<ProcessView[]>('/processes', {
        method: 'POST',
        body: JSON.stringify([dataModel]),
        headers: { Prefer: 'return=representation' },
    });
}


export async function updateProcess(id: string, input: Partial<ProcessView>) {
    const { owner, ...rest } = input;
    const dataModel: Partial<ProcessRow> = {
        ...rest,
        owner_id: owner?.id ?? null,
    };
    return await postgrest<ProcessRow[]>(
        `/processes?id=eq.${encodeURIComponent(id)}`,
        {
            method: 'PATCH',
            body: JSON.stringify(dataModel),
            headers: { Prefer: 'return=representation' },
        }
    );
}

export async function deleteProcess(id: string) {
    return await postgrest<null>(`/processes?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
}
