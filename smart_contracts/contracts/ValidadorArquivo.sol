// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ValidadorArquivo {
    // Estrutura para armazenar os dados do arquivo
    struct DadosArquivo {
        uint40 timestamp;
        string descricao;
        string nomeEmissor;
    }

    // Mapeamento para armazenar os dados dos arquivos usando o hash do arquivo como chave
    mapping(bytes32 => DadosArquivo) private arquivos;

    // Endereço do administrador do contrato que terá permissão para registrar os arquivos
    address public carteiraAdmin;

    // Executado quando o contrato é implantado, definindo o criador do contrato como administrador
    constructor() {
        carteiraAdmin = msg.sender;
    }

    // Função para registrar um arquivo
    function registrarArquivo(
        bytes32 hashArquivo,
        string memory descricao,
        string memory nomeEmissor
    ) public {
        require(
            msg.sender == carteiraAdmin,
            "Apenas o administrador pode registrar arquivos."
        );
        require(
            arquivos[hashArquivo].timestamp == 0,
            "Este arquivo ja foi registrado."
        );
        require(
            bytes(descricao).length > 0,
            "A descricao do arquivo nao pode ser vazia."
        );
        require(
            bytes(descricao).length <= 255,
            "A descricao do arquivo nao pode exceder 255 caracteres."
        );
        require(
            bytes(nomeEmissor).length > 0,
            "O nome do emissor nao pode ser vazio."
        );
        require(
            bytes(nomeEmissor).length <= 255,
            "O nome do emissor nao pode exceder 255 caracteres."
        );

        // Armazenar os dados do arquivo no mapeamento
        arquivos[hashArquivo] = DadosArquivo({
            timestamp: uint40(block.timestamp),
            descricao: descricao,
            nomeEmissor: nomeEmissor
        });
    }

    // Função para validar um arquivo
    function validarArquivo(
        bytes32 hashArquivo
    )
        public
        view
        returns (
            bool ehValido,
            string memory descricao,
            string memory nomeEmissor,
            uint256 timestamp
        )
    {
        DadosArquivo memory dados = arquivos[hashArquivo];
        if (dados.timestamp != 0) {
            return (
                true,
                dados.descricao,
                dados.nomeEmissor,
                uint256(dados.timestamp)
            );
        }
        return (false, "", "", 0);
    }
}
