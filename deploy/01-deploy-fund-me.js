const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  // Kazdy priceFeedAddres jest inny zaleznie od tego na jakim jest networku
  // Tutaj zostanie na podstawie chainId wybrany odpowiedni address
  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  let ethUsdPriceFeedAddress
  // Jezeli network jest developerski - uzyj mockow
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
    // jezeli jest to prawdziwy network = uzyj prawdziwych feedow
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  // Mock dla localhosta

  const fundMe = await deploy("FundMe", {
    from: deployer,
    gasLimit: 4000000,
    args: [ethUsdPriceFeedAddress], // puszczam PriceFeedAddress jako argument
    // log: true oznacza ze podczas deolpjowania w konsoli pojawi sie sporo przydatnego info
    log: true,
  })
  log("------------------------------------------")
}

module.exports.tags = ["all", "fundme"]
