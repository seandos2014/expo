import * as Updates from './Updates';
import type { Manifest, UpdatesNativeStateMachineContext } from './Updates.types';
import { UpdateInfoType, type CurrentlyRunningInfo, type UpdateInfo } from './UseUpdates.types';

// The currently running info, constructed from Updates constants
export const currentlyRunning: CurrentlyRunningInfo = {
  updateId: Updates.updateId ?? undefined,
  channel: Updates.channel ?? undefined,
  createdAt: Updates.createdAt ?? undefined,
  isEmbeddedLaunch: Updates.isEmbeddedLaunch,
  isEmergencyLaunch: Updates.isEmergencyLaunch,
  manifest: Updates.manifest ?? undefined,
  runtimeVersion: Updates.runtimeVersion ?? undefined,
};

// Type for the state managed by useUpdates().
// Used internally by this module and not exported publicly.
export type UseUpdatesStateType = {
  availableUpdate?: UpdateInfo;
  downloadedUpdate?: UpdateInfo;
  checkError?: Error;
  downloadError?: Error;
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  lastCheckForUpdateTimeSinceRestart?: Date;
};

// Constructs an UpdateInfo from a manifest
export const updateFromManifest: (manifest: NonNullable<Manifest>) => UpdateInfo = (manifest) => {
  return {
    type: UpdateInfoType.NEW,
    updateId: manifest.id ?? '',
    createdAt:
      manifest && 'createdAt' in manifest && manifest.createdAt
        ? new Date(manifest.createdAt)
        : manifest && 'publishedTime' in manifest && manifest.publishedTime
        ? new Date(manifest.publishedTime)
        : // We should never reach this if the manifest is valid and has a commit time,
          // but leave this in so that createdAt is always defined
          new Date(0),
    manifest,
  };
};

// Default useUpdates() state
export const defaultUseUpdatesState: UseUpdatesStateType = {
  isChecking: false,
  isDownloading: false,
  isUpdateAvailable: false,
  isUpdatePending: false,
};

// Transform the useUpdates() state based on native state machine context
export const reduceUpdatesStateFromContext: (
  updatesState: UseUpdatesStateType,
  context: UpdatesNativeStateMachineContext
) => UseUpdatesStateType = (updatesState, context) => {
  const availableUpdate = context?.latestManifest
    ? updateFromManifest(context?.latestManifest)
    : undefined;
  const downloadedUpdate = context?.downloadedManifest
    ? updateFromManifest(context?.downloadedManifest)
    : undefined;
  return {
    ...updatesState,
    isUpdateAvailable: context.isUpdateAvailable,
    isUpdatePending: context.isUpdatePending,
    isChecking: context.isChecking,
    isDownloading: context.isDownloading,
    availableUpdate,
    downloadedUpdate,
    checkError: context.checkError,
    downloadError: context.downloadError,
    lastCheckForUpdateTimeSinceRestart: context.isChecking
      ? new Date()
      : updatesState.lastCheckForUpdateTimeSinceRestart,
  };
};
