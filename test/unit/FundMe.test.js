const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", function () {
  let fundMe
  let deployer
  let mockV3Aggregator
  // Uzywam tego utility jako pomocy - https://docs.ethers.io/v5/api/utils/display-logic/#utils-parseEther
  const sendValue = ethers.utils.parseEther("1") // = 1000000000000000000 = 1ETH
  //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  beforeEach(async function () {
    // Przypisuje adres portfela deployera (patrz hadhat.config.js)
    deployer = (await getNamedAccounts()).deployer
    // deploy kontraktu fundMe uzywajac paczki Hardhat-deploy
    // Uzywajac tagu "all" robie doplou wszystkich plikow znajdujacych sie w folderze 'deploy'
    // Tag all powininen byc dodany na koncu kazdego z tych plikow!
    // np:
    // module.exports.tags = ["all", "mocks"]
    await deployments.fixture(["all"])
    //                         ^^^^^
    // Przypisuje najswierzsza wesje kontraktow
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", function () {
    it("sets the aggregator address correctly", async function () {
      const response = await fundMe.priceFeed()
      // assert.equal(response, mockV3Aggregator.address)
      expect(response).to.equal(mockV3Aggregator.address)
    })
  })

  describe("fund", function () {
    it("fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
    it("updates the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.addressToAmountFunded(deployer)
      expect(response.toString()).to.equal(sendValue.toString())
    })

    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue })
      const funder = await fundMe.funders(0)
      expect(funder).to.equal(deployer)
    })

    describe("withdraw", function () {
      beforeEach(async function () {
        // Dzieki temu kazdy z ponizszych testow bedzie posiadal srodki do wyplacenia
        await fundMe.fund({ value: sendValue })
      })

      it("withdraw ETH from a single founder", async function () {
        // Arrange
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        )

        // Act
        const transactionResponse = await fundMe.withdraw()
        const transactionRecept = await transactionResponse.wait(1)

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

        // Assert
        expect(endingFundMeBalance).to.equal(0)
        expect(
          startingFundMeBalance.add(startingDeployerBalance).toString()
        ).to.equal(endingDeployerBalance.add(gasCost).toString())
      })

      // it("", async function () {})
    })
  })
})
