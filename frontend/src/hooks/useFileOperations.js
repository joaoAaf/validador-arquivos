import { useState } from 'react';
import { ethers } from 'ethers';

export const useFileOperations = (contractInteraction, account) => {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [modalData, setModalData] = useState(null);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);

  const { getContract, estimateGasPrice } = contractInteraction;

  const generateHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file || desc.length > 255 || name.length > 255) return alert("Dados inválidos");
    if (!account) return alert("Por favor, conecte sua MetaMask primeiro!");

    setLoadingRegister(true);
    let currentGasPrice = null;
    let tentativas = 0;
    const maxTentativas = 5;

    try {
      const hashGerado = await generateHash(file);
      const hashBytes32 = "0x" + hashGerado;

      const estimatedPrice = await estimateGasPrice();
      currentGasPrice = parseFloat(estimatedPrice) + 5;

      while (tentativas < maxTentativas) {
        try {
          const contract = await getContract(true);
          const gasPriceString = currentGasPrice.toFixed(9);
          const gasPrice = ethers.parseUnits(gasPriceString, 'gwei');

          const tx = await contract.registrarArquivo(hashBytes32, desc, name, {
            gasPrice: gasPrice,
          });

          await tx.wait();

          setModalData({
            title: "Sucesso!",
            message: "Arquivo registrado na blockchain.",
            txLink: `${import.meta.env.VITE_SCAN_URL}${tx.hash}`
          });

          setLoadingRegister(false);
          setFile(null);
          setDesc('');
          setName('');
          return;
        } catch (error) {
          const errorMsg = error.message || '';

          if (errorMsg.includes('gas price below minimum') ||
            errorMsg.includes('gas tip cap') ||
            errorMsg.includes('transaction gas price') ||
            errorMsg.includes('replacement fee too low')) {

            tentativas++;
            if (tentativas < maxTentativas) {
              currentGasPrice += 5;

              const confirmed = window.confirm(
                `Gas price insuficiente. Tentando novamente com ${currentGasPrice.toFixed(2)} Gwei...\n` +
                `Tentativa ${tentativas}/${maxTentativas}`
              );

              if (!confirmed) {
                throw new Error("Operação cancelada pelo usuário");
              }
              continue;
            } else {
              throw new Error("Número máximo de tentativas atingido. A rede pode estar muito congestionada.");
            }
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMsg = error.message || error.toString();

      if (errorMsg.includes("Operação cancelada")) {
        alert("Operação cancelada pelo usuário.");
      } else if (errorMsg.includes("Administradora")) {
        alert("Erro ao registrar. Verifique se você está conectado com a carteira Administradora.");
      } else {
        alert(`Erro ao registrar: ${errorMsg}`);
      }
    }

    setLoadingRegister(false);
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoadingValidate(true);
    try {
      const hashGerado = await generateHash(file);
      const hashBytes32 = "0x" + hashGerado;

      const contract = await getContract(false);
      const result = await contract.validarArquivo(hashBytes32);

      if (result[0] === true) {
        setModalData({
          title: "Arquivo Válido",
          data: [
            { label: "Emissor", value: result[2] },
            { label: "Descrição", value: result[1] },
            { label: "Data de Registro", value: new Date(Number(result[3]) * 1000).toLocaleString() }
          ]
        });
      } else {
        setModalData({
          title: "Arquivo Inválido",
          message: "Este arquivo não consta na blockchain ou não foi registrado pela carteira administradora do contrato."
        });
      }
    } catch (error) {
      console.error(error);
      alert("Erro na validação. Tente novamente.");
    }
    setLoadingValidate(false);
  };

  return {
    file,
    desc,
    name,
    modalData,
    loadingRegister,
    loadingValidate,
    setFile,
    setDesc,
    setName,
    setModalData,
    handleRegister,
    handleValidate
  };
};
