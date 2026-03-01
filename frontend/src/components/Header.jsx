import AccountMenu from './AccountMenu';

const Header = ({ walletState }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Validador de Arquivos Web3</h1>

        <div className="flex items-center space-x-3">
          {walletState.account ? (
            <AccountMenu walletState={walletState} />
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
  );
};

export default Header;
