import { useState } from 'react';
import { ethers } from 'ethers';
import abiData from './abi.json';

function App() {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado para armazenar a carteira conectada
  const [account, setAccount] = useState("");

  // Função para criar o Hash SHA-256 no navegador
  const generateHash = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Conecta com a MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Por favor, instale a extensão MetaMask no seu navegador!");
      return;
    }
    try {
      // Cria um provedor usando a MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Solicita ao usuário que conecte a conta
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]); // Salva o endereço conectado no estado
    } catch (error) {
      console.error("Erro ao conectar carteira:", error);
    }
  };

  // Obtém o contrato usando a MetaMask (apenas para escrita/assinatura)
  const getContract = async (needSigner = false) => {
    if (needSigner) {
      // Para registrar, precisamos da MetaMask e do Signer
      if (!window.ethereum) throw new Error("MetaMask não encontrada");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abiData.abi, signer);
    } else {
      // Para validação, usamos um RPC público
      const rpcUrl = import.meta.env.VITE_RPC_URL;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      return new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abiData.abi, provider);
    }
  };

  // Estima o gas price usando eth_feeHistory do RPC
  const estimateGasPrice = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const feeData = await provider.getFeeData();
      
      if (feeData.gasPrice) {
        // Retorna gasPrice em Gwei
        return ethers.formatUnits(feeData.gasPrice, 'gwei');
      }
      
      // Se getFeeData não funcionar, usa eth_feeHistory via JSON-RPC
      const history = await window.ethereum.request({
        method: 'eth_feeHistory',
        params: ['0x4', 'latest', [50]], // últimos 4 blocos, percentil 50
      });
      
      const baseFee = BigInt(history.baseFeePerGas[history.baseFeePerGas.length - 1]);
      const priorityFee = BigInt('2000000000'); // 2 Gwei como padrão
      const gasPrice = baseFee + priorityFee;
      
      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.warn('Erro ao estimar gas price:', error);
      return 25; // Fallback para 25 Gwei
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file || desc.length > 255 || name.length > 255) return alert("Dados inválidos");
    if (!account) return alert("Por favor, conecte sua MetaMask primeiro!");

    setLoading(true);
    let currentGasPrice = null;
    let tentativas = 0;
    const maxTentativas = 5;

    try {
      const hashGerado = await generateHash(file);
      const hashBytes32 = "0x" + hashGerado;

      // Estima o gas price inicial
      const estimatedPrice = await estimateGasPrice();
      currentGasPrice = parseFloat(estimatedPrice) + 5; // Adiciona 5 Gwei de margem

      while (tentativas < maxTentativas) {
        try {
          // Pega o contrato com a capacidade de assinar transações
          const contract = await getContract(true);

          // Garante que não passará de 9 casas decimais para evitar falha no parseUnits
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
          
          setLoading(false);
          return;
        } catch (error) {
          const errorMsg = error.message || '';
          
          // Verifica se é erro de gas price insuficiente
          if (errorMsg.includes('gas price below minimum') || 
              errorMsg.includes('gas tip cap') ||
              errorMsg.includes('transaction gas price') ||
              errorMsg.includes('replacement fee too low')) {
            
            tentativas++;
            if (tentativas < maxTentativas) {
              currentGasPrice += 5; // Aumenta 5 Gwei
              
              const confirmed = window.confirm(
                `Gas price insuficiente. Tentando novamente com ${currentGasPrice.toFixed(2)} Gwei...\n` +
                `Tentativa ${tentativas}/${maxTentativas}`
              );
              
              if (!confirmed) {
                throw new Error("Operação cancelada pelo usuário");
              }
              continue; // Tenta novamente com o novo gas price
            } else {
              throw new Error("Número máximo de tentativas atingido. A rede pode estar muito congestionada.");
            }
          } else {
            // Outro tipo de erro
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
    
    setLoading(false);
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const hashGerado = await generateHash(file);
      const hashBytes32 = "0x" + hashGerado;

      // Validação é leitura, não cobra taxas e não precisa de assinatura
      const contract = await getContract(false);

      const result = await contract.validarArquivo(hashBytes32);

      if (result[0] === true) {
        setModalData({
          title: "Arquivo Válido",
          message: `Emissor: ${result[2]} | Descrição: ${result[1]} | Data: ${new Date(Number(result[3]) * 1000).toLocaleString()}`
        });
      } else {
        setModalData({ title: "Arquivo Inválido", message: "Este arquivo não consta na blockchain ou não foi registrado pela carteira administradora do contrato." });
      }
    } catch (error) {
      console.error(error);
      alert("Erro na validação. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Validador de Arquivos Web3</h1>

      {/* PAINEL DE CONEXÃO DA CARTEIRA */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        {account ? (
          <p>🟢 Conectado: <strong>{account}</strong></p>
        ) : (
          <button onClick={connectWallet} style={{ padding: '10px', background: '#f6851b', color: 'white', border: 'none', cursor: 'pointer' }}>
            Conectar MetaMask
          </button>
        )}
      </div>

      {/* Seção de Registro */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h2>Registrar Arquivo (Apenas Admin)</h2>
        <form onSubmit={handleRegister}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required /><br /><br />
          <input type="text" placeholder="Descrição (Max 255)" maxLength="255" value={desc} onChange={(e) => setDesc(e.target.value)} required /><br /><br />
          <input type="text" placeholder="Nome do Emissor" maxLength="255" value={name} onChange={(e) => setName(e.target.value)} required /><br /><br />
          <button type="submit" disabled={loading || !account}>Registrar</button>
        </form>
      </div>

      {/* Seção de Validação */}
      <div style={{ border: '1px solid #ccc', padding: '20px' }}>
        <h2>Validar Arquivo (Público)</h2>
        <form onSubmit={handleValidate}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required /><br /><br />
          <button type="submit" disabled={loading}>Validar</button>
        </form>
      </div>

      {/* Modal de Respostas */}
      {modalData && (
        <div style={{ position: 'fixed', top: '20%', left: '30%', background: 'white', padding: '30px', border: '2px solid black', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
          <h2>{modalData.title}</h2>
          <p>{modalData.message}</p>
          {modalData.txLink && <a href={modalData.txLink} target="_blank" rel="noreferrer">Ver Transação na PolygonScan</a>}
          <br /><br />
          <button onClick={() => setModalData(null)}>Fechar</button>
        </div>
      )}
    </div>
  );
}

export default App;