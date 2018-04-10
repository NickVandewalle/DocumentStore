pragma solidity ^0.4.17;

import './Owned.sol';
import './DougEnabled.sol';

contract Doug is Owned {

  mapping (bytes32 => address) public contracts;

  function Doug() public {
    owner = msg.sender;
  }

  function addContract(bytes32 name, address addr) public onlyOwner returns (bool result) {
    DougEnabled de = DougEnabled(addr);
    if (!de.setDougAddress(address(this))) { 
      return false; 
    }

    contracts[name] = addr;
    return true;
  }

  function removeContract(bytes32 name) public onlyOwner returns (bool result) {
    if (contracts[name] == 0x0) {
      return false;
    }

    contracts[name] = 0x0;
    return true;
  }

  function remove() public onlyOwner {
    address documentmanager = contracts["documentmanager"];
    address documentstore = contracts["documentstore"];

    if (documentmanager != 0x0) { DougEnabled(documentmanager).remove(); }
    if (documentstore != 0x0) { DougEnabled(documentstore).remove(); }

    selfdestruct(owner);
  }
}