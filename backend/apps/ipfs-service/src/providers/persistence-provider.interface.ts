/**
 * The result of a successful Add operation.
 */
export interface AddResult {
  cid: string;
  assetHash: string;
}

/**
 * Defines the contract for any IPFS persistence provider.
 */
export interface IPersistenceProvider {
  readonly name: string;

  /**
   * Adds a file from a given path to the IPFS network, returning its CID and hash.
   * This is the "upload" step.
   */
  add(filePath: string, filename: string): Promise<AddResult>;

  /**
   * Instructs the provider to pin an *existing* CID for long-term storage.
   */
  pin(cid: string, name: string): Promise<void>;

  isHealthy(): Promise<boolean>;
}
