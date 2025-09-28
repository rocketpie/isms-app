'use client'

import { postgrest } from "../api-isms"
import { OwnershipView } from "./ownership"


export type SystemView = {
    id: string
    name: string
    description: string | null
    owner: OwnershipView | null
}

type SystemRow = {
    id?: string
    name: string
    owner_id: string | null
    description: string | null
}


/* ---------- API ---------- */
export async function listSystems() {
    // GET /systems?select=id,name,description,owner_id&order=name.asc
    return await postgrest<SystemView[]>(
        '/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc',
        { method: 'GET' }
    )
}

export async function createSystem(input: SystemView) {
    // strip the owner object
    const { id, owner, ...rest } = input
    // set the owner_id, if any
    const dataModel: SystemRow = {
        ...rest,
        owner_id: owner?.id ?? null
    }
    return await postgrest<SystemView[]>('/systems', {
        method: 'POST',
        body: JSON.stringify([dataModel]),
        headers: { Prefer: 'return=representation' },
    })
}

export async function updateSystem(id: string, input: Partial<SystemView>) {
    // strip the owner object
    const { owner, ...rest } = input
    // set the owner_id, if any
    const dataModel: Partial<SystemRow> = {
        ...rest,
        owner_id: owner?.id ?? null
    }
    return await postgrest<SystemRow[]>(
        `/systems?id=eq.${encodeURIComponent(id)}`,
        {
            method: 'PATCH',
            body: JSON.stringify(dataModel),
            headers: { Prefer: 'return=representation' },
        }
    )
}

export async function deleteSystem(id: string) {
    return await postgrest<null>(`/systems?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
    })
}
