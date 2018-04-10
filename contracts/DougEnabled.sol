pragma solidity ^0.4.17;

contract DougEnabled {
  address DOUG;

  function setDougAddress(address dougAddr) public returns (bool result) {
    if (DOUG != 0x0 && msg.sender != DOUG) {
      return false;
    }
    DOUG = dougAddr;
    return true;
  }

  function remove() public {
    if (msg.sender == DOUG) {
      selfdestruct(DOUG);
    }
  }
}