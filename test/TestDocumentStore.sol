pragma solidity ^0.4.17;

import "../contracts/DocumentStore.sol";
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

contract TestDocumentStore {
    CMC cmc = CMC(DeployedAddresses.CMC());
    DocumentStore documentStore = DocumentStore(DeployedAddresses.DocumentStore());
    DocumentStoreDB documentStoreDB = DocumentStoreDB(DeployedAddresses.DocumentStoreDB());

    function testCMCWasCorrectlyConfigured() public {
        address documentStoreDBAddress = cmc.getContract("DocumentStoreDB");
        Assert.equal(DeployedAddresses.DocumentStoreDB(), documentStoreDBAddress, "DocumentStoreDB should be registered");

        address documentStoreAddress = cmc.getContract("DocumentStore");
        Assert.equal(DeployedAddresses.DocumentStore(), documentStoreAddress, "DocumentStore should be registered");
        
        address notExisting = cmc.getContract("notExisting");
        Assert.equal(address(0x0), notExisting, "An unregistered identifier should return an empty address");
    }

    function testDuplicateRegistration() public {
        var firstWasRegistered = documentStore.register(bytes32("hash123"), bytes32("title123"), bytes32("author123"));
        Assert.isTrue(firstWasRegistered, "First register should have succeeded");

        var secondWasRegistered = documentStore.register(bytes32("hash123"), bytes32("title123"), bytes32("author123"));
        Assert.isFalse(secondWasRegistered, "Second register should have failed");
    }

    function testGetByHash() public {
        var wasRegistered = documentStore.register(bytes32("hash456"), bytes32("title456"), bytes32("author456"));
        Assert.isTrue(wasRegistered, "Register should have succeeded");

        var (documentHash, title, author) = documentStore.getByHash(bytes32("hash456"));

        Assert.equal(bytes32("hash456"), documentHash, "The documentHash should be 'hash456'");
        Assert.equal(bytes32("title456"), title, "The documentHash should be 'title456'");
        Assert.equal(bytes32("author456"), author, "The documentHash should be 'author456'");
    }
    
    function testGetByAuthor() public {
        var firstWasRegistered = documentStore.register(bytes32("A"), bytes32("AA"), bytes32("Jos"));
        Assert.isTrue(firstWasRegistered, "Register(A) should have succeeded");
        
        var secondWasRegistered = documentStore.register(bytes32("B"), bytes32("BB"), bytes32("Willy"));
        Assert.isTrue(secondWasRegistered, "Register(B) should have succeeded");
        
        var thirdWasRegistered = documentStore.register(bytes32("C"), bytes32("CC"), bytes32("Jos"));
        Assert.isTrue(thirdWasRegistered, "Register(C) should have succeeded");

        var (documentHash, title, author) = documentStore.getByAuthor(bytes32("Jos"));

        var documentHashArray = bytes32[25](documentHash);
        var titleArray = bytes32[25](title);
        var authorArray = bytes32[25](author);

        Assert.equal(bytes32("A"), documentHashArray[0], "First document should be 'A'");
        Assert.equal(bytes32("AA"), titleArray[0], "First title should be 'AA'");
        Assert.equal(bytes32("Jos"), authorArray[0], "First author should be 'Jos'");

        Assert.equal(bytes32("C"), documentHashArray[1], "Second document should be 'C'");
        Assert.equal(bytes32("CC"), titleArray[1], "Second title should be 'CC'");
        Assert.equal(bytes32("Jos"), authorArray[1], "Second author should be 'Jos'");

        Assert.equal(bytes32(0x0), documentHashArray[2], "Third document (and everything after) should be empty");
        Assert.equal(bytes32(0x0), titleArray[2], "Third title (and everything after) should be empty");
        Assert.equal(bytes32(0x0), authorArray[2], "Third author (and everything after) should be empty");
    }
}