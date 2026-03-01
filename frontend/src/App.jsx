import { useState } from 'react';
import { ethers } from 'ethers';
import abiData from './abi.json';

const FormInput = ({ label, id, ...props }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      id={id}
      {...props}
      className="w-full bg-gray-800 border border-gray-700 text-white rounded-md p-3 text-sm focus:border-teal-500 focus:ring-teal-500 focus:outline-none transition"
    />
  </div>
);

const FileInput = ({ label, id, onChange, disabled, ...props }) => (
  <div className="mb-6">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <div
      className={`w-full border border-gray-700 rounded-md p-3 text-sm ${disabled ? 'bg-gray-900 text-gray-500' : 'bg-gray-800 text-gray-400'
        }`}
    >
      <input
        id={id}
        type="file"
        onChange={onChange}
        disabled={disabled}
        {...props}
        className="block w-full text-sm text-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-600 file:text-white
                  file:cursor-pointer
                  hover:file:bg-teal-700 transition
                  disabled:file:bg-gray-700 disabled:file:text-gray-300 disabled:file:cursor-not-allowed"
      />
    </div>
  </div>
);

const ActionButton = ({ loading, disabled, children, ...props }) => (
  <button
    {...props}
    disabled={loading || disabled}
    className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded-md 
               hover:bg-teal-700 transition duration-150 ease-in-out
               disabled:opacity-50 disabled:cursor-not-allowed
               flex items-center justify-center space-x-2"
  >
    {loading ? (
      <>
        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
        <span>Aguarde...</span>
      </>
    ) : (
      <span>{children}</span>
    )}
  </button>
);

function App() {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState('');
  const [name, setName] = useState('');
  const [modalData, setModalData] = useState(null);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);

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

    setLoadingRegister(true);
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

          setLoadingRegister(false);
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

    setLoadingRegister(false);
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoadingValidate(true);
    try {
      const hashGerado = await generateHash(file);
      const hashBytes32 = "0x" + hashGerado;

      // Validação é leitura, não cobra taxas e não precisa de assinatura
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

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Header: Título e Conexão da Carteira */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Validador de Arquivos Web3</h1>

          <div className="flex items-center space-x-3">
            {account ? (
              <div className="flex items-center gap-2.5 bg-gray-800 border border-gray-700 px-4 py-2 rounded-full">
                <span className="h-3 w-3 rounded-full bg-teal-500 animate-pulse"></span>
                <span className="text-sm font-medium text-gray-200">
                  {`Conectado: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-teal-600 text-white font-bold py-2.5 px-6 rounded-md hover:bg-teal-700 transition duration-150 flex items-center gap-2"
              >
                <img src="/src/assets/metamask-icon.svg" alt="" className="h-5 w-5" />
                Conectar MetaMask
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* Secção de Registro */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl">
          <h2 className="text-xl font-bold mb-6 border-l-4 border-teal-600 pl-3">
            Registrar Arquivo
          </h2>
          <form onSubmit={handleRegister}>
            <FormInput
              label="Descrição do Arquivo"
              id="desc"
              type="text"
              placeholder="Ex: Contrato Social da Empresa"
              maxLength="255"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={!account}
              required
            />
            <FormInput
              label="Nome do Emissor"
              id="name"
              type="text"
              placeholder="Ex: Empresa ABC Ltda."
              maxLength="255"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!account}
              required
            />
            <FileInput
              label="Selecione o Arquivo"
              id="file"
              onChange={(e) => setFile(e.target.files[0])}
              disabled={!account}
              required
            />
            <ActionButton
              type={account ? "submit" : "button"}
              loading={loadingRegister}
              onClick={!account ? connectWallet : undefined}
            >
              {account ? "Registrar na Blockchain" : "Conectar MetaMask"}
            </ActionButton>
          </form>
        </section>

        {/* Secção de Validação */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold mb-6 border-l-4 border-teal-600 pl-3">
            Validar Arquivo
          </h2>
          <form onSubmit={handleValidate} className="flex-grow flex flex-col justify-between">
            <FileInput
              label="Selecione o Arquivo para Validação"
              id="validateFile"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <div className="pt-4">
              <ActionButton type="submit" loading={loadingValidate}>
                Validar Autenticidade
              </ActionButton>
            </div>
          </form>
        </section>
      </main>

      {/* Modal de Respostas */}
      {modalData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-md">
          <div className="bg-gray-900/95 border border-gray-700 p-8 rounded-lg shadow-2xl max-w-2xl w-full relative">
            <h2 className="text-2xl font-bold mb-6">{modalData.title}</h2>

            {modalData.data ? (
              <div className="mb-6 overflow-hidden rounded-lg border border-gray-700">
                <table className="w-full">
                  <tbody>
                    {modalData.data.map((item, index) => (
                      <tr key={index} className="border-b border-gray-700 last:border-b-0">
                        <td className="bg-gray-800 px-4 py-3 font-semibold text-gray-300 w-1/3">
                          {item.label}
                        </td>
                        <td className="bg-gray-850 px-4 py-3 text-gray-200 break-all">
                          {item.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-300 mb-6 whitespace-pre-wrap">{modalData.message}</p>
            )}

            {modalData.txLink && (
              <a
                href={modalData.txLink}
                target="_blank"
                rel="noreferrer"
                className="block text-teal-400 font-medium mb-6 hover:text-teal-300 underline break-all"
              >
                Ver Transação na PolygonScan
              </a>
            )}
            <button
              onClick={() => setModalData(null)}
              className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-md hover:bg-gray-600 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;