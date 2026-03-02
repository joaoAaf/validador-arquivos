import { vi } from 'vitest';

// Mock do ethers
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    JsonRpcProvider: vi.fn(),
    Contract: vi.fn(),
    formatUnits: vi.fn(),
    parseUnits: vi.fn(),
  },
}));

// Mock window.alert
globalThis.alert = vi.fn();

// Mock crypto.subtle.digest para testes
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: async (algorithm) => {
        // Simula retorno de hash SHA-256 (64 caracteres hex)
        if (algorithm === 'SHA-256') {
          return new Uint8Array(32).fill(0xAA);
        }
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }
    }
  }
});
