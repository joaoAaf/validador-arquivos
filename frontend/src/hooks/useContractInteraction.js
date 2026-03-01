import { ethers } from 'ethers';

export const useContractInteraction = (abiData) => {
  const getContract = async (needSigner = false) => {
    if (needSigner) {
      if (!window.ethereum) throw new Error("MetaMask não encontrada");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abiData.abi, signer);
    } else {
      const rpcUrl = import.meta.env.VITE_RPC_URL;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abiData.abi, provider);
    }
  };

  const estimateGasPrice = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const feeData = await provider.getFeeData();

      if (feeData.gasPrice) {
        return ethers.formatUnits(feeData.gasPrice, 'gwei');
      }

      const history = await window.ethereum.request({
        method: 'eth_feeHistory',
        params: ['0x4', 'latest', [50]],
      });

      const baseFee = BigInt(history.baseFeePerGas[history.baseFeePerGas.length - 1]);
      const priorityFee = BigInt('2000000000');
      const gasPrice = baseFee + priorityFee;

      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.warn('Erro ao estimar gas price:', error);
      return 25;
    }
  };

  return {
    getContract,
    estimateGasPrice
  };
};
