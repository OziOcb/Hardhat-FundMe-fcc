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
        const transactionReceipt = await transactionResponse.wait(1)
        // Obliczam koszt gazu ktory zaostal zluzyty na odpalenie metody .withdraw
        // Poniewaz gasUsed i effectiveGasPrice sa BigNumbers, uzywam metody .mul()
        // zeby podzielic gasUsed przez effectiveGasPrice (mul = multiply)
        const { gasUsed, effectiveGasPrice } = transactionReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)
        //    ^^^^^^^

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

        // Assert
        expect(endingFundMeBalance).to.equal(0)
        // Uwaga! Pamietaj ze podczas odpalenia metody .withdraw
        // troche ETH zostanie wydane na pokrycie kosztow gazu
        // Dlatego w ponizszym tescie dodaje gasCost
        // Ogolnie ten test dodaje poczatkowy balans kontraktu z
        // poczatkowym balansem deployera i porownuje wynik z
        // koncowym balansem deployera (pamietajac o odjeciiu hajsu za gaz)
        expect(
          startingFundMeBalance.add(startingDeployerBalance).toString()
        ).to.equal(endingDeployerBalance.add(gasCost).toString())
        //                              ^^^^^^^^^^^^^
      })

      it("allows us to withdraw with multiple funders", async function () {
        // Arrange
        // Pobieram liste dostepnych adresow/portfeli
        const accounts = await ethers.getSigners()
        // Robiac loopa przelewam srodki z 6 portfeli
        for (let i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(accounts[i])
          await fundMeConnectedContract.fund({ value: sendValue })
        }
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        )

        // Act
        const txResponse = await fundMe.withdraw()
        const txReceipt = await txResponse.wait(1)
        const { gasUsed, effectiveGasPrice } = txReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)

        // Assert
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

        expect(endingFundMeBalance).to.equal(0)
        expect(
          startingFundMeBalance.add(startingDeployerBalance).toString()
        ).to.equal(endingDeployerBalance.add(gasCost).toString())

        // Upewniam sie ze funders zostalo zresetowane
        // Czuli tablica funders powinna byc pusta
        // a kazdy z funderow powininen pokazywac 0 jako ilsoc przelanego hajsu
        await expect(fundMe.funders(0)).to.be.reverted
        for (let i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.addressToAmountFunded(accounts[i].address),
            0
          )
        }
      })

      it("only allows the owner to withdraw", async function () {
        const accounts = await ethers.getSigners()
        const attacker = accounts[1]
        const attackerConnectedContract = fundMe.connect(attacker)
        await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
          "FundMe__NotOwner"
        )
      })
      // it("", async function () {})
    })
  })
})
