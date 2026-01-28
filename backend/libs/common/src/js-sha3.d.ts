declare module 'js-sha3' {
  type Message = string | number[] | ArrayBuffer | Uint8Array;

  interface Hasher {
    update(message: Message): Hasher;
    hex(): string;
    toString(): string;
    arrayBuffer(): ArrayBuffer;
    digest(): number[];
    array(): number[];
  }

  interface Hash {
    (message: Message): string;
    hex(message: Message): string;
    arrayBuffer(message: Message): ArrayBuffer;
    digest(message: Message): number[];
    array(message: Message): number[];
    create(): Hasher;
    update(message: Message): Hasher;
  }

  export const keccak256: Hash;
  export const keccak224: Hash;
  export const keccak384: Hash;
  export const keccak512: Hash;
  export const sha3_224: Hash;
  export const sha3_256: Hash;
  export const sha3_384: Hash;
  export const sha3_512: Hash;
  export const shake128: Hash;
  export const shake256: Hash;
}
