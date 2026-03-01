import ActionButton from './ActionButton';
import FileInput from './FileInput';
import Section from './Section';

const ValidateSection = ({ fileOps }) => {
  return (
    <Section title="Validar Arquivo" className="flex flex-col">
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
    </Section>
  );
};

export default ValidateSection;
