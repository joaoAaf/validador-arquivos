import { describe, it, beforeEach } from 'node:test'
import { expect } from 'chai'
import { network } from 'hardhat'
import { ethers as ethLib } from 'ethers'

describe("ValidadorArquivo", function () {
    let contrato
    let ethers

    beforeEach(async function () {
        // Conexão com a rede local do Hardhat
        const connection = await network.connect()
        ethers = connection.ethers

        // Deploy do contrato
        const ValidadorArquivo = await ethers.getContractFactory("ValidadorArquivo")
        contrato = await ValidadorArquivo.deploy()
    })

    it("Deve registrar e validar um hash de um arquivo corretamente", async function () {
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
        const hashFalso = ethLib.keccak256(ethLib.toUtf8Bytes("arquivo_falso"))
        const resultado = await contrato.validarArquivo(hashFalso)

        expect(resultado.ehValido).to.equal(false)
    })
})