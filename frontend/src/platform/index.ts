export * from "./adapters";
export * from "./deepLinks";
export * from "./runtime";
import { platformRuntime } from "./runtime";
import {
  nativeDeviceAdapter,
  nativeDownloadAdapter,
  nativeNavigationAdapter,
  nativeShareAdapter,
  nativeStorageAdapter,
} from "./native";
import {
  webDeviceAdapter,
  webDownloadAdapter,
  webNavigationAdapter,
  webShareAdapter,
  webStorageAdapter,
} from "./web";
export {
  webDeviceAdapter,
  webDownloadAdapter,
  webNavigationAdapter,
  webShareAdapter,
  webStorageAdapter,
} from "./web";

export {
  nativeDeviceAdapter,
  nativeDownloadAdapter,
  nativeNavigationAdapter,
  nativeShareAdapter,
  nativeStorageAdapter,
} from "./native";

export const storageAdapter = platformRuntime.isNative()
  ? nativeStorageAdapter
  : webStorageAdapter;
export const shareAdapter = platformRuntime.isNative()
  ? nativeShareAdapter
  : webShareAdapter;
export const navigationAdapter = platformRuntime.isNative()
  ? nativeNavigationAdapter
  : webNavigationAdapter;
export const downloadAdapter = platformRuntime.isNative()
  ? nativeDownloadAdapter
  : webDownloadAdapter;
export const deviceAdapter = platformRuntime.isNative()
  ? nativeDeviceAdapter
  : webDeviceAdapter;
