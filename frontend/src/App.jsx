import abiData from './abi.json';
import Header from './components/Header';
import RegisterSection from './components/RegisterSection';
import ResponseModal from './components/ResponseModal';
import ValidateSection from './components/ValidateSection';
import { useContractInteraction } from './hooks/useContractInteraction';
import { useFileOperations } from './hooks/useFileOperations';
import { useWalletConnection } from './hooks/useWalletConnection';

function App() {
  const walletState = useWalletConnection();
  const contractInteraction = useContractInteraction(abiData);
  const fileOps = useFileOperations(contractInteraction, walletState.account);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Header walletState={walletState} />

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <RegisterSection fileOps={fileOps} walletState={walletState} />
        <ValidateSection fileOps={fileOps} />
      </main>

      <ResponseModal 
        modalData={fileOps.modalData} 
        onClose={() => fileOps.setModalData(null)} 
      />
    </div>
  );
}

export default App;