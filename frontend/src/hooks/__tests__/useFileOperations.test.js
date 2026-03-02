import { renderHook, act } from '@testing-library/react';
import { ethers } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileOperations } from '../useFileOperations';

describe('useFileOperations', () => {
    const makeEvent = () => ({ preventDefault: vi.fn() });
    const makeFile = () => ({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        import.meta.env.VITE_SCAN_URL = 'https://scan.example/tx/';
        window.confirm = vi.fn();
    });

    describe('handleRegister', () => {
        it('deve alertar dados inválidos quando não houver arquivo', async () => {
            const contractInteraction = {
                getContract: vi.fn(),
                estimateGasPrice: vi.fn(),
            };

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                await result.current.handleRegister(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith('Dados inválidos');
            expect(contractInteraction.estimateGasPrice).not.toHaveBeenCalled();
            expect(contractInteraction.getContract).not.toHaveBeenCalled();
        });

        it('deve alertar quando conta não estiver conectada', async () => {
            const contractInteraction = {
                getContract: vi.fn(),
                estimateGasPrice: vi.fn(),
            };

            const { result } = renderHook(() => useFileOperations(contractInteraction, ''));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
                result.current.setDesc('Documento');
                result.current.setName('João');
            });

            await act(async () => {
                await result.current.handleRegister(event);
            });

            expect(global.alert).toHaveBeenCalledWith('Por favor, conecte sua MetaMask primeiro!');
            expect(contractInteraction.estimateGasPrice).not.toHaveBeenCalled();
        });

        it('deve registrar arquivo com sucesso e limpar formulário', async () => {
            const tx = {
                hash: '0xhash123',
                wait: vi.fn().mockResolvedValue(undefined),
            };
            const contract = {
                registrarArquivo: vi.fn().mockResolvedValue(tx),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn().mockResolvedValue('25'),
            };

            ethers.parseUnits.mockReturnValue(30000000000n);

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
                result.current.setDesc('Contrato de prestação');
                result.current.setName('Empresa XYZ');
            });

            await act(async () => {
                await result.current.handleRegister(event);
            });

            const expectedHash = `0x${'aa'.repeat(32)}`;

            expect(contractInteraction.estimateGasPrice).toHaveBeenCalled();
            expect(contractInteraction.getContract).toHaveBeenCalledWith(true);
            expect(ethers.parseUnits).toHaveBeenCalledWith('30.000000000', 'gwei');
            expect(contract.registrarArquivo).toHaveBeenCalledWith(
                expectedHash,
                'Contrato de prestação',
                'Empresa XYZ',
                { gasPrice: 30000000000n }
            );
            expect(tx.wait).toHaveBeenCalled();
            expect(result.current.modalData).toEqual({
                title: 'Sucesso!',
                message: 'Arquivo registrado na blockchain.',
                txLink: 'https://scan.example/tx/0xhash123',
            });
            expect(result.current.file).toBeNull();
            expect(result.current.desc).toBe('');
            expect(result.current.name).toBe('');
            expect(result.current.loadingRegister).toBe(false);
        });

        it('deve tentar novamente com gas maior após erro de gas e confirmação do usuário', async () => {
            const tx = {
                hash: '0xhashretry',
                wait: vi.fn().mockResolvedValue(undefined),
            };
            const contract = {
                registrarArquivo: vi
                    .fn()
                    .mockRejectedValueOnce(new Error('gas price below minimum'))
                    .mockResolvedValueOnce(tx),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn().mockResolvedValue('20'),
            };

            window.confirm.mockReturnValue(true);
            ethers.parseUnits.mockReturnValue(1n);

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
                result.current.setDesc('Doc');
                result.current.setName('Nome');
            });

            await act(async () => {
                await result.current.handleRegister(event);
            });

            expect(contract.registrarArquivo).toHaveBeenCalledTimes(2);
            expect(window.confirm).toHaveBeenCalledTimes(1);
            expect(ethers.parseUnits).toHaveBeenNthCalledWith(1, '25.000000000', 'gwei');
            expect(ethers.parseUnits).toHaveBeenNthCalledWith(2, '30.000000000', 'gwei');
            expect(result.current.modalData?.title).toBe('Sucesso!');
        });

        it('deve alertar operação cancelada quando usuário não confirma nova tentativa', async () => {
            const contract = {
                registrarArquivo: vi.fn().mockRejectedValue(new Error('replacement fee too low')),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn().mockResolvedValue('20'),
            };

            window.confirm.mockReturnValue(false);
            ethers.parseUnits.mockReturnValue(1n);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
                result.current.setDesc('Doc');
                result.current.setName('Nome');
            });

            await act(async () => {
                await result.current.handleRegister(event);
            });

            expect(global.alert).toHaveBeenCalledWith('Operação cancelada pelo usuário.');
            expect(result.current.loadingRegister).toBe(false);
            consoleErrorSpy.mockRestore();
        });

        it('deve exibir alerta de carteira administradora quando erro contiver Administradora', async () => {
            const contract = {
                registrarArquivo: vi.fn().mockRejectedValue(new Error('Apenas carteira Administradora pode registrar')),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn().mockResolvedValue('25'),
            };

            ethers.parseUnits.mockReturnValue(1n);
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
                result.current.setDesc('Doc');
                result.current.setName('Nome');
            });

            await act(async () => {
                await result.current.handleRegister(event);
            });

            expect(global.alert).toHaveBeenCalledWith(
                'Erro ao registrar. Verifique se você está conectado com a carteira Administradora.'
            );
            expect(result.current.loadingRegister).toBe(false);
            consoleErrorSpy.mockRestore();
        });
    });

    describe('handleValidate', () => {
        it('deve retornar sem processar quando não houver arquivo', async () => {
            const contractInteraction = {
                getContract: vi.fn(),
                estimateGasPrice: vi.fn(),
            };

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                await result.current.handleValidate(event);
            });

            expect(event.preventDefault).toHaveBeenCalled();
            expect(contractInteraction.getContract).not.toHaveBeenCalled();
            expect(result.current.loadingValidate).toBe(false);
        });

        it('deve definir modal de arquivo válido quando contrato retornar sucesso', async () => {
            const contract = {
                validarArquivo: vi.fn().mockResolvedValue([true, 'Descrição Teste', 'Emissor Teste', 1700000000]),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn(),
            };

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
            });

            await act(async () => {
                await result.current.handleValidate(event);
            });

            const expectedHash = `0x${'aa'.repeat(32)}`;

            expect(contractInteraction.getContract).toHaveBeenCalledWith(false);
            expect(contract.validarArquivo).toHaveBeenCalledWith(expectedHash);
            expect(result.current.modalData.title).toBe('Arquivo Válido');
            expect(result.current.modalData.data[0]).toEqual({ label: 'Emissor', value: 'Emissor Teste' });
            expect(result.current.modalData.data[1]).toEqual({ label: 'Descrição', value: 'Descrição Teste' });
            expect(result.current.modalData.data[2].label).toBe('Data de Registro');
            expect(typeof result.current.modalData.data[2].value).toBe('string');
            expect(result.current.loadingValidate).toBe(false);
        });

        it('deve definir modal de arquivo inválido quando contrato retornar false', async () => {
            const contract = {
                validarArquivo: vi.fn().mockResolvedValue([false, '', '', 0]),
            };
            const contractInteraction = {
                getContract: vi.fn().mockResolvedValue(contract),
                estimateGasPrice: vi.fn(),
            };

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
            });

            await act(async () => {
                await result.current.handleValidate(event);
            });

            expect(result.current.modalData).toEqual({
                title: 'Arquivo Inválido',
                message:
                    'Este arquivo não consta na blockchain ou não foi registrado pela carteira administradora do contrato.',
            });
            expect(result.current.loadingValidate).toBe(false);
        });

        it('deve alertar em caso de erro na validação', async () => {
            const contractInteraction = {
                getContract: vi.fn().mockRejectedValue(new Error('falha rpc')),
                estimateGasPrice: vi.fn(),
            };
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const { result } = renderHook(() => useFileOperations(contractInteraction, '0xabc'));
            const event = makeEvent();

            await act(async () => {
                result.current.setFile(makeFile());
            });

            await act(async () => {
                await result.current.handleValidate(event);
            });

            expect(global.alert).toHaveBeenCalledWith('Erro na validação. Tente novamente.');
            expect(result.current.loadingValidate).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });
});
