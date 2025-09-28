//lib/browser/isms/dataAsset.ts
'use client'

import { postgrest } from "../api-isms"
import { OwnershipView } from "./ownership"


export type DataAssetView = {
    id: string
    name: string
    description: string | null
    owner: OwnershipView | null
}

type DataAssetRow = {
    id?: string
    name: string
    owner_id: string | null
    description: string | null
}


/* ---------- API ---------- */
export async function listData() {
    // GET /systems?select=id,name,description,owner_id&order=name.asc
    return await postgrest<DataAssetView[]>(
        '/systems?select=id,name,description,owner:ownership(id,name)&order=name.asc',
        { method: 'GET' }
    )
}
