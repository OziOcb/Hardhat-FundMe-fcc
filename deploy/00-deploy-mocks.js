const { network } = require("hardhat")
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...")
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      // log: true oznacza ze podczas deolpjowania w konsoli pojawi sie sporo przydatnego info
      log: true,
      // Zeby dowiedziec sie jakich argumentow potrzebuje dany kontrakt ktory chce zmokowac
      // musze zajrzec w jego Constructor
      // W tym przypadku przegladajac ten kontrakt na githubie, lub znajdujac go w node_modules
      // https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.6/tests/MockV3Aggregator.sol
      args: [DECIMALS, INITIAL_ANSWER],
    })
    log("Mocks deployed!")
    log("-------------------------------------------------------------")
  }
}

// Dzieki temu moge deployowac tylko mocki uzywajac flagi --tags
// npx hardhat deploy --tags mocks
module.exports.tags = ["all", "mocks"]
