import { describe, it } from 'node:test'
import { expect } from 'chai'
import { network } from 'hardhat'
import { ethers as ethLib } from 'ethers'

describe("ValidadorArquivo", function () {
    it("Deve registrar e validar um hash de um arquivo corretamente", async function () {
        const { ethers } = await network.connect()

        // Deploy do contrato
        const ValidadorArquivo = await ethers.getContractFactory("ValidadorArquivo")
        const contrato = await ValidadorArquivo.deploy()

        // Criação de um hash de teste para o arquivo
        const testeHash = ethLib.keccak256(ethLib.toUtf8Bytes("arquivo_de_teste"))

        // Registro do hash no contrato
        await contrato.registrarArquivo(testeHash, "Teste Contrato", "Fulano de Tal")

        // Validação do hash registrado
        const resultado = await contrato.validarArquivo(testeHash)

        // Verificação do resultado
        expect(resultado.ehValido).to.equal(true)
        expect(resultado.descricao).to.equal("Teste Contrato")
        expect(resultado.nomeEmissor).to.equal("Fulano de Tal")
    })

    it("Deve retornar invalido para arquivo inexistente", async function () {
        const { ethers } = await network.connect()
        
        const ValidadorArquivo = await ethers.getContractFactory("ValidadorArquivo");
        const contract = await ValidadorArquivo.deploy();

        const hashFalso = ethLib.keccak256(ethLib.toUtf8Bytes("arquivo_falso"));
        const resultado = await contract.validarArquivo(hashFalso);

        expect(resultado.ehValido).to.equal(false)
    })
})