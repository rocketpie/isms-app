import { listApplications, createApplication, updateApplication, deleteApplication } from "@/lib/browser/isms/applications";
import { listSystems, createSystem, updateSystem, deleteSystem } from "@/lib/browser/isms/systems";
import { useAssetsBase } from "./useAssetsBase";
import { createProcess, deleteProcess, listProcesses, updateProcess } from "@/lib/browser/isms/processes";
import { createData, deleteData, listData, updateData } from "@/lib/browser/isms/dataAssets";
import { createLocation, deleteLocation, listLocations, updateLocation } from "@/lib/browser/isms/locations";
import { createConnection, deleteConnection, listConnections, updateConnection } from "@/lib/browser/isms/connections";

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

export function useProcesses() {
  return useAssetsBase("process", {
    list: listProcesses,
    create: createProcess,
    update: updateProcess,
    remove: deleteProcess,
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