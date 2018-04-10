pragma solidity ^0.4.4;

contract Owned {
  address owner;

  modifier onlyOwner() {
    if (msg.sender==owner) {
      _;
    }
  }

  function owned() public {
    owner = msg.sender;
  }

  function changeOwner(address newOwner) public onlyOwner {
    owner = newOwner;
  }

  function getOwner() public constant returns (address){
    return owner;
  }
}
