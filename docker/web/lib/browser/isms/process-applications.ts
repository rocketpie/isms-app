//lib/browser/isms/process-applications.ts
"use client";

import { postgrest } from "../api-isms";
import { ApplicationView } from "./assetTypes";

export async function listLinkedApplications(processId: string) {
  const response = await postgrest<{ application: ApplicationView }[]>(
    `/process_applications?process_id=eq.${encodeURIComponent(processId)}` +
      `&select=application:applications(id,name,description,owner:ownership(id,name))` +
      `&order=application(name).asc`,
    { method: "GET" },
  );
  return response.map((row) => row.application);
}

export async function linkApplication(
  processId: string,
  applicationId: string,
) {
  await postgrest("/process_applications", {
    method: "POST",
    body: JSON.stringify([
      { process_id: processId, application_id: applicationId },
    ]),
  });
}

export async function unlinkApplication(
  processId: string,
  applicationId: string,
) {
  return await postgrest<null>(
    `/process_applications?process_id=eq.${encodeURIComponent(processId)}` +
      `&application_id=eq.${encodeURIComponent(applicationId)}`,
    { method: "DELETE" },
  );
}
