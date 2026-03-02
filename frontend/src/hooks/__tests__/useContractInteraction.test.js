import { renderHook } from '@testing-library/react';
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useContractInteraction } from '../useContractInteraction';

describe('useContractInteraction', () => {
    const mockAbiData = {
        abi: [
            {
                name: 'registrarArquivo',
                type: 'function',
            },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        window.ethereum = undefined;
        import.meta.env.VITE_CONTRACT_ADDRESS = '0xcontractaddress';
        import.meta.env.VITE_RPC_URL = 'https://rpc.example.com';
    });

    describe('getContract', () => {
        it('deve retornar um contrato com JsonRpcProvider quando needSigner é false', async () => {
            const mockContract = { address: '0xcontractaddress' };
            const mockProvider = {};

            ethers.JsonRpcProvider.mockImplementation(function () { return mockProvider; });
            ethers.Contract.mockImplementation(function () { return mockContract; });

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const contract = await result.current.getContract(false);

            expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://rpc.example.com');
            expect(ethers.Contract).toHaveBeenCalledWith(
                '0xcontractaddress',
                mockAbiData.abi,
                mockProvider
            );
            expect(contract).toBe(mockContract);
        });

        it('deve retornar um contrato com signer quando needSigner é true', async () => {
            const mockSigner = {};
            const mockProvider = {
                getSigner: vi.fn().mockResolvedValue(mockSigner),
            };
            const mockContract = { address: '0xcontractaddress' };

            window.ethereum = { isMetaMask: true };
            ethers.BrowserProvider.mockImplementation(function () { return mockProvider; });
            ethers.Contract.mockImplementation(function () { return mockContract; });

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const contract = await result.current.getContract(true);

            expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum);
            expect(mockProvider.getSigner).toHaveBeenCalled();
            expect(ethers.Contract).toHaveBeenCalledWith(
                '0xcontractaddress',
                mockAbiData.abi,
                mockSigner
            );
            expect(contract).toBe(mockContract);
        });

        it('deve lançar erro quando needSigner é true mas MetaMask não está disponível', async () => {
            window.ethereum = undefined;

            const { result } = renderHook(() => useContractInteraction(mockAbiData));

            await expect(result.current.getContract(true)).rejects.toThrow(
                'MetaMask não encontrada'
            );
        });

        it('deve usar JsonRpcProvider quando needSigner não é fornecido', async () => {
            const mockContract = { address: '0xcontractaddress' };
            const mockProvider = {};

            ethers.JsonRpcProvider.mockImplementation(function () { return mockProvider; });
            ethers.Contract.mockImplementation(function () { return mockContract; });

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const contract = await result.current.getContract();

            expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('https://rpc.example.com');
            expect(ethers.Contract).toHaveBeenCalledWith(
                '0xcontractaddress',
                mockAbiData.abi,
                mockProvider
            );
            expect(contract).toBe(mockContract);
        });
    });

    describe('estimateGasPrice', () => {
        it('deve retornar gas price formatado quando feeData.gasPrice está disponível', async () => {
            const mockGasPrice = BigInt('25000000000');
            const mockFeeData = { gasPrice: mockGasPrice };
            const mockProvider = {
                getFeeData: vi.fn().mockResolvedValue(mockFeeData),
            };

            window.ethereum = { isMetaMask: true };
            ethers.BrowserProvider.mockImplementation(function () { return mockProvider; });
            ethers.formatUnits.mockReturnValue('25.0');

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const gasPrice = await result.current.estimateGasPrice();

            expect(ethers.BrowserProvider).toHaveBeenCalledWith(window.ethereum);
            expect(mockProvider.getFeeData).toHaveBeenCalled();
            expect(ethers.formatUnits).toHaveBeenCalledWith(mockGasPrice, 'gwei');
            expect(gasPrice).toBe('25.0');
        });

        it('deve usar eth_feeHistory quando feeData.gasPrice não está disponível', async () => {
            const mockFeeData = { gasPrice: null };
            const mockProvider = {
                getFeeData: vi.fn().mockResolvedValue(mockFeeData),
            };
            const mockHistory = {
                baseFeePerGas: ['0x3b9aca00', '0x3b9aca00', '0x3b9aca00', '0x3b9aca00', '0x4a817c80'],
            };

            window.ethereum = {
                isMetaMask: true,
                request: vi.fn().mockResolvedValue(mockHistory),
            };
            ethers.BrowserProvider.mockImplementation(function () { return mockProvider; });
            ethers.formatUnits.mockReturnValue('27.0');

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const gasPrice = await result.current.estimateGasPrice();

            expect(window.ethereum.request).toHaveBeenCalledWith({
                method: 'eth_feeHistory',
                params: ['0x4', 'latest', [50]],
            });
            expect(ethers.formatUnits).toHaveBeenCalled();
            expect(gasPrice).toBe('27.0');
        });

        it('deve calcular gas price corretamente com baseFee + priorityFee', async () => {
            const mockFeeData = { gasPrice: null };
            const mockProvider = {
                getFeeData: vi.fn().mockResolvedValue(mockFeeData),
            };
            const baseFeeHex = '0x5f5e100'; // 100000000 em decimal
            const mockHistory = {
                baseFeePerGas: [baseFeeHex],
            };

            window.ethereum = {
                isMetaMask: true,
                request: vi.fn().mockResolvedValue(mockHistory),
            };
            ethers.BrowserProvider.mockImplementation(function () { return mockProvider; });
            ethers.formatUnits.mockImplementation((value) => value.toString());

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            await result.current.estimateGasPrice();

            const expectedBaseFee = BigInt('100000000');
            const expectedPriorityFee = BigInt('2000000000');
            const expectedTotal = expectedBaseFee + expectedPriorityFee;

            expect(ethers.formatUnits).toHaveBeenCalledWith(expectedTotal, 'gwei');
        });

        it('deve retornar 25 quando ocorrer um erro', async () => {
            window.ethereum = { isMetaMask: true };
            const mockProvider = {
                getFeeData: vi.fn().mockRejectedValue(new Error('Network error')),
            };
            ethers.BrowserProvider.mockImplementation(function () { return mockProvider; });

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const gasPrice = await result.current.estimateGasPrice();

            expect(consoleWarnSpy).toHaveBeenCalledWith('Erro ao estimar gas price:', expect.any(Error));
            expect(gasPrice).toBe(25);

            consoleWarnSpy.mockRestore();
        });

        it('deve retornar 25 quando window.ethereum não está disponível', async () => {
            window.ethereum = undefined;
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const { result } = renderHook(() => useContractInteraction(mockAbiData));
            const gasPrice = await result.current.estimateGasPrice();

            expect(gasPrice).toBe(25);
            consoleWarnSpy.mockRestore();
        });
    });

});
