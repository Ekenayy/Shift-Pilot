import * as Location from "expo-location";
import type { PermissionStatus } from "./types";

export async function getPermissionStatus(): Promise<PermissionStatus> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();

  return {
    foreground: foreground.status,
    background: background.status,
  };
}

export async function requestForegroundPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function requestBackgroundPermission(): Promise<boolean> {
  // Must have foreground permission first
  const foregroundStatus = await Location.getForegroundPermissionsAsync();
  if (foregroundStatus.status !== Location.PermissionStatus.GRANTED) {
    const granted = await requestForegroundPermission();
    if (!granted) return false;
  }

  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export function hasFullLocationAccess(status: PermissionStatus): boolean {
  return (
    status.foreground === Location.PermissionStatus.GRANTED &&
    status.background === Location.PermissionStatus.GRANTED
  );
}

export function hasForegroundAccess(status: PermissionStatus): boolean {
  return status.foreground === Location.PermissionStatus.GRANTED;
}
