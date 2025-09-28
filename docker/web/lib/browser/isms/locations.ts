//lib/browser/isms/locations.ts
'use client'

import { postgrest } from "../api-isms"
import { OwnershipView } from "./ownership"


export type LocationView = {
    id: string
    name: string
    description: string | null
    owner: OwnershipView | null
}

type LocationRow = {
    id?: string
    name: string
    owner_id: string | null
    description: string | null
}


/* ---------- API ---------- */
export async function listLocations() {
    // GET /systems?select=id,name,description,owner_id&order=name.asc
    return await postgrest<LocationView[]>(
        '/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc',
        { method: 'GET' }
    )
}
