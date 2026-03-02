import { renderHook, act } from '@testing-library/react';
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletConnection } from '../useWalletConnection';

describe('useWalletConnection - connectWallet', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.ethereum = {
			isMetaMask: true,
			request: vi.fn(),
			on: vi.fn(),
			removeListener: vi.fn(),
		};
	});

	it('deve exibir alerta quando MetaMask não estiver disponível', async () => {
		window.ethereum = undefined;

		const { result } = renderHook(() => useWalletConnection());

		await act(async () => {
			await result.current.connectWallet();
		});

		expect(global.alert).toHaveBeenCalledWith('Por favor, instale a extensão MetaMask no seu navegador!');
		expect(result.current.account).toBe('');
		expect(ethers.BrowserProvider).not.toHaveBeenCalled();
	});

	it('deve conectar carteira e definir account quando provider retornar contas', async () => {
		const mockSend = vi.fn().mockResolvedValue(['0xabc123']);
		const mockProvider = { send: mockSend };

		ethers.BrowserProvider.mockImplementation(function () {
			return mockProvider;
		});

		const { result } = renderHook(() => useWalletConnection());

		await act(async () => {
			await result.current.connectWallet();
		});

		expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum);
		expect(mockSend).toHaveBeenCalledWith('eth_requestAccounts', []);
		expect(result.current.account).toBe('0xabc123');
	});

	it('deve tratar erro do provider e manter account vazio', async () => {
		const mockError = new Error('Falha ao conectar');
		const mockSend = vi.fn().mockRejectedValue(mockError);
		const mockProvider = { send: mockSend };
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		ethers.BrowserProvider.mockImplementation(function () {
			return mockProvider;
		});

		const { result } = renderHook(() => useWalletConnection());

		await act(async () => {
			await result.current.connectWallet();
		});

		expect(mockSend).toHaveBeenCalledWith('eth_requestAccounts', []);
		expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao conectar carteira:', mockError);
		expect(result.current.account).toBe('');

		consoleErrorSpy.mockRestore();
	});
});
