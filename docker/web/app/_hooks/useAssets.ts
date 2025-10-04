//app/_hooks/useAssets.ts
//Description: useAssetsBase implementations eg. useProcesses, useApplications, useSystems, etc.
"use client";

import { listApplications, createApplication, updateApplication, deleteApplication } from "@/lib/browser/isms/applications";
import { listSystems, createSystem, updateSystem, deleteSystem } from "@/lib/browser/isms/systems";
import { useAssetsBase } from "./useAssetsBase";
import { createProcess, deleteProcess, listProcesses, updateProcess } from "@/lib/browser/isms/processes";
import { createData, deleteData, listData, updateData } from "@/lib/browser/isms/dataAssets";
import { createLocation, deleteLocation, listLocations, updateLocation } from "@/lib/browser/isms/locations";
import { createConnection, deleteConnection, listConnections, updateConnection } from "@/lib/browser/isms/connections";
import { createDataCategory, deleteDataCategory, listDataCategories, updateDataCategory } from "@/lib/browser/isms/dataCategories";
import { listPeople, createPerson, updatePerson, deletePerson } from "@/lib/browser/isms/people";

export function usePeople() {
  return useAssetsBase("person", {
    list: listPeople,
    create: createPerson,
    update: updatePerson,
    remove: deletePerson,
  });
}

export function useDataCategories() {
  return useAssetsBase("data_category", {
    list: listDataCategories,
    create: createDataCategory,
    update: updateDataCategory,
    remove: deleteDataCategory,
  });
}

export function useProcesses() {
  return useAssetsBase("process", {
    list: listProcesses,
    create: createProcess,
    update: updateProcess,
    remove: deleteProcess,
  });
}

export function useApplications() {
  return useAssetsBase("application", {
    list: listApplications,
    create: createApplication,
    update: updateApplication,
    remove: deleteApplication,
  });
}

export function useSystems() {
  return useAssetsBase("system", {
    list: listSystems,
    create: createSystem,
    update: updateSystem,
    remove: deleteSystem,
  });
}

export function useData() {
  return useAssetsBase("data", {
    list: listData,
    create: createData,
    update: updateData,
    remove: deleteData,
  });
}

export function useLocations() {
  return useAssetsBase("location", {
    list: listLocations,
    create: createLocation,
    update: updateLocation,
    remove: deleteLocation,
  });
}

export function useConnections() {
  return useAssetsBase("connection", {
    list: listConnections,
    create: createConnection,
    update: updateConnection,
    remove: deleteConnection,
  });
}
