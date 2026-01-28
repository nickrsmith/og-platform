import { StoragePool } from '../enums/ipfs-storage-pool.enum';
import { IpfsJobType } from '../enums/ipfs-job-type.enum';

export interface IpfsPersistenceJobResult {
  providerName: string;
  contentCID: string | undefined;
  thumbnailManifestCID: string | undefined;
  assetHash: string | undefined;
}

/**
 * A map of temporary file paths to their corresponding database record IDs.
 */
export interface FileToPinRecordMap {
  tempFilePath: string;
  pinRecordId: string;
  originalName?: string;
}

/**
 * The payload for pinning all files related to a single release.
 */
export interface PinReleaseFilesPayload {
  pool: StoragePool;
  userId: string;
  organizationId: string;
  releaseId: string;
  siteAddress: string;
  actorPeerId: string;
  mainFile?: FileToPinRecordMap; // Use a single object for the main file
  thumbnailFiles?: FileToPinRecordMap[]; // Use an array for thumbnails
  existingThumbnailCIDs?: string[];
}

/**
 * The payload for pinning a single file for an organization's logo.
 */
export interface PinOrganizationLogoPayload {
  organizationId: string;
  pinRecordId: string; // The ID of the IPFSPinRecord in the indexer
  tempFilePath: string; // Logo is required
  originalName?: string;
}

/**
 * A type union of all possible IPFS job payloads.
 */
export type IpfsJobPayload =
  | PinReleaseFilesPayload
  | PinOrganizationLogoPayload;

/**
 * The structure of the data that is PLACED ONTO THE BULLMQ QUEUE.
 * It includes the job name (type) and a typed payload.
 */
export interface IpfsJob {
  name: IpfsJobType;
  data: IpfsJobPayload;
}

/**
 * A type guard helper to correctly infer the payload type based on the job name.
 */
export function getTypedIpfsJobPayload<T extends IpfsJobPayload>(
  name: IpfsJobType,
  data: IpfsJobPayload,
): T {
  // In the future, we could add validation here to ensure the data shape
  // matches the expected payload for the given job name.
  // For now, the cast provides the necessary type safety in our code.
  return data as T;
}
