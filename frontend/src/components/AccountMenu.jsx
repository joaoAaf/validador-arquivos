const AccountMenu = ({ walletState }) => {
  return (
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
  );
};

export default AccountMenu;
