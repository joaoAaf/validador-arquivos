import ActionButton from './ActionButton';
import FileInput from './FileInput';
import FormInput from './FormInput';
import Section from './Section';

const RegisterSection = ({ fileOps, walletState }) => {
  return (
    <Section title="Registrar Arquivo">
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
    </Section>
  );
};

export default RegisterSection;
