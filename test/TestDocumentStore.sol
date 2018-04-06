pragma solidity ^0.4.17;

import "../contracts/DocumentStore.sol";
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

contract TestDocumentStore {
    CMC cmc = CMC(DeployedAddresses.CMC());

    function testCMCWasCorrectlyConfigured() public {
        address documentStoreDB = cmc.getContract("DocumentStoreDB");
        Assert.notEqual(address(0x0), documentStoreDB, "DocumentStoreDB should be registered");

        address documentStore = cmc.getContract("DocumentStore");
        Assert.notEqual(address(0x0), documentStore, "DocumentStore should be registered");
        
        address notExisting = cmc.getContract("notExisting");
        Assert.equal(address(0x0), notExisting, "NotExisting should not be registered");
    }

    /*
    function testGetAdopterAddressByPetId() public {
        address expected = this;
        address adopter = adoption.adopters(8);
        Assert.equal(adopter, expected, "Owner of pet ID 8 should be recorded");
    }

    function testGetAdopterAddressByPetInArray() public {
        address expected = this;
        address[16] memory adopters = adoption.getAdopters();

        Assert.equal(adopters[8], expected, "Owner of pet ID 8 should be recorded.");
    }
    */
}