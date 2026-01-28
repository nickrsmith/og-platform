// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../js-sha3.d.ts" />
import { createReadStream } from 'fs';
import { keccak256 } from 'js-sha3';

export async function _calculateHashStream(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = keccak256.create();
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve('0x' + hash.hex()));
    stream.on('error', (err) => reject(err));
  });
}
