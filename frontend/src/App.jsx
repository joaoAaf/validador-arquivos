import abiData from './abi.json';
import { useContractInteraction } from './hooks/useContractInteraction';
import { useFileOperations } from './hooks/useFileOperations';
import { useWalletConnection } from './hooks/useWalletConnection';

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
  const walletState = useWalletConnection();
  const contractInteraction = useContractInteraction(abiData);
  const fileOps = useFileOperations(contractInteraction, walletState.account);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Header: Título e Conexão da Carteira */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Validador de Arquivos Web3</h1>

          <div className="flex items-center space-x-3">
            {walletState.account ? (
              <div className="relative">
                <button
                  onClick={walletState.toggleAccountMenu}
                  className="flex items-center gap-2.5 bg-gray-800 border border-gray-700 px-4 py-2 rounded-full hover:bg-gray-700 transition cursor-pointer"
                >
                  <span className="h-3 w-3 rounded-full bg-teal-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-gray-200">
                    {`Conectado: ${walletState.account.substring(0, 6)}...${walletState.account.substring(walletState.account.length - 4)}`}
                  </span>
                </button>

                {/* Menu de contexto */}
                {walletState.showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700 bg-gray-900">
                      <p className="text-xs text-gray-400 mb-1">Carteira Conectada</p>
                      <p className="text-sm font-mono text-teal-400 break-all">{walletState.account}</p>
                    </div>
                    <button
                      onClick={walletState.disconnectWallet}
                      className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <span className="text-lg">🔌</span>
                      Desconectar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={walletState.connectWallet}
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
          <form onSubmit={fileOps.handleRegister}>
            <FormInput
              label="Descrição do Arquivo"
              id="desc"
              type="text"
              placeholder="Ex: Contrato Social da Empresa"
              maxLength="255"
              value={fileOps.desc}
              onChange={(e) => fileOps.setDesc(e.target.value)}
              disabled={!walletState.account}
              required
            />
            <FormInput
              label="Nome do Emissor"
              id="name"
              type="text"
              placeholder="Ex: Empresa ABC Ltda."
              maxLength="255"
              value={fileOps.name}
              onChange={(e) => fileOps.setName(e.target.value)}
              disabled={!walletState.account}
              required
            />
            <FileInput
              label="Selecione o Arquivo"
              id="file"
              onChange={(e) => fileOps.setFile(e.target.files[0])}
              disabled={!walletState.account}
              required
            />
            <ActionButton
              type={walletState.account ? "submit" : "button"}
              loading={fileOps.loadingRegister}
              onClick={!walletState.account ? walletState.connectWallet : undefined}
            >
              {walletState.account ? "Registrar na Blockchain" : "Conectar MetaMask"}
            </ActionButton>
          </form>
        </section>

        {/* Secção de Validação */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-xl flex flex-col">
          <h2 className="text-xl font-bold mb-6 border-l-4 border-teal-600 pl-3">
            Validar Arquivo
          </h2>
          <form onSubmit={fileOps.handleValidate} className="flex-grow flex flex-col justify-between">
            <FileInput
              label="Selecione o Arquivo para Validação"
              id="validateFile"
              onChange={(e) => fileOps.setFile(e.target.files[0])}
              required
            />
            <div className="pt-4">
              <ActionButton type="submit" loading={fileOps.loadingValidate}>
                Validar Autenticidade
              </ActionButton>
            </div>
          </form>
        </section>
      </main>

      {/* Modal de Respostas */}
      {fileOps.modalData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[100] backdrop-blur-md">
          <div className="bg-gray-900/95 border border-gray-700 p-8 rounded-lg shadow-2xl max-w-2xl w-full relative">
            <h2 className="text-2xl font-bold mb-6">{fileOps.modalData.title}</h2>

            {fileOps.modalData.data ? (
              <div className="mb-6 overflow-hidden rounded-lg border border-gray-700">
                <table className="w-full">
                  <tbody>
                    {fileOps.modalData.data.map((item, index) => (
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
              <p className="text-gray-300 mb-6 whitespace-pre-wrap">{fileOps.modalData.message}</p>
            )}

            {fileOps.modalData.txLink && (
              <a
                href={fileOps.modalData.txLink}
                target="_blank"
                rel="noreferrer"
                className="block text-teal-400 font-medium mb-6 hover:text-teal-300 underline break-all"
              >
                Ver Transação na PolygonScan
              </a>
            )}
            <button
              onClick={() => fileOps.setModalData(null)}
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