import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("FileValidatorModule", module => {
    const validador = module.contract("ValidadorArquivo")
    return { validador }
})