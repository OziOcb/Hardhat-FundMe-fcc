module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  await deploy("FundMe", {
    from: deployer,
    gasLimit: 4000000,
    args: [],
  })
}
