import { useState } from 'react';
import { ethers } from 'ethers';

export const useWalletConnection = () => {
  const [account, setAccount] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Por favor, instale a extensão MetaMask no seu navegador!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
    }
  };

  const disconnectWallet = () => {
    setAccount("");
    setShowAccountMenu(false);
  };

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  return {
    account,
    showAccountMenu,
    connectWallet,
    disconnectWallet,
    toggleAccountMenu
  };
};
