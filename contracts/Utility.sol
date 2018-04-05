pragma solidity ^0.4.0;

contract Restricted {
    address owner;
    
    function Restricted() public {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyBy(address account) {
        require(msg.sender == account);
        _;
    }
}

contract Mortal is Restricted {
    function kill() onlyOwner public {
        selfdestruct(owner);
    }
}

contract Rejector {
    function () public {
        revert();
    }
}