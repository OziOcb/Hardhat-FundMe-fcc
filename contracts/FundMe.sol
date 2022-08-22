// SPDX-License-Identifier: MIT
// Pragma
pragma solidity ^0.8.8;
// Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
// Error Codes
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts

/** @title A contract for crowd founding
 *  @author Ozi
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
  // Tyoe Declerations
  using PriceConverter for uint256;

  // State Variables
  mapping(address => uint256) public addressToAmountFunded;
  address[] public funders;
  // Could we make this constant?
  address public immutable owner;
  uint256 public constant MINIMUM_USD = 50 * 10**18;
  AggregatorV3Interface public priceFeed;

  // Modifires
  modifier onlyOwner() {
    // require(msg.sender == owner);
    if (msg.sender != owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address priceFeedAddress) {
    owner = msg.sender;
    priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  /**
   *  @notice This function funds this contract
   *  @dev This implements price feeds as our library
   */
  function fund() public payable {
    require(
      msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
      "You need to spend more ETH!"
    );
    // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
    addressToAmountFunded[msg.sender] += msg.value;
    funders.push(msg.sender);
  }

  function withdraw() public payable onlyOwner {
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      addressToAmountFunded[funder] = 0;
    }
    funders = new address[](0);
    // payable(msg.sender).transfer(address(this).balance);
    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }("");
    require(callSuccess, "Call failed");
  }
}
