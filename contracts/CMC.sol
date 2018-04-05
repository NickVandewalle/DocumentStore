pragma solidity ^0.4.0;

import "./Utility.sol";

contract CMC is Mortal, Rejector {
    mapping (bytes32 => address) _contracts;
    
    function addContract(bytes32 identifier, address contractAddress) public onlyOwner {
        _contracts[identifier] = contractAddress;
    }
    
    function removeContract(bytes32 identifier) public onlyOwner returns (bool) {
        if (_contracts[identifier] == 0x0) return false;
        
        _contracts[identifier] = 0x0;
        return true;
    }
    
    function getContract(bytes32 name) public view returns (address) {
        return _contracts[name];
    }
}

contract CMCEnabled is Mortal, Rejector {    
    address cmc;
    
    function setCMC(address cmc_) public onlyOwner returns (bool) {
        if (cmc != 0x0 && msg.sender != cmc_) return false;
        
        cmc = cmc_;
        return true;
    }
    
    function getContract(bytes32 identifier) internal view returns (address) {
        return CMC(cmc).getContract(identifier);
    }
}