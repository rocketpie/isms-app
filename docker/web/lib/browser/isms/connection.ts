//lib/browser/isms/connection.ts
'use client'

import { postgrest } from "../api-isms"
import { OwnershipView } from "./ownership"


export type ConnectionView = {
    id: string
    name: string
    description: string | null
    owner: OwnershipView | null
}

type ConnectionRow = {
    id?: string
    name: string
    owner_id: string | null
    description: string | null
}


/* ---------- API ---------- */
export async function listConnections() {
    // GET /systems?select=id,name,description,owner_id&order=name.asc
    return await postgrest<ConnectionView[]>(
        '/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc',
        { method: 'GET' }
    )
}
