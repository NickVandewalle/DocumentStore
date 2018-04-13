pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Doug.sol";
import "../contracts/DocumentManager.sol";

contract TestDocumentManager {
    Doug doug = Doug(DeployedAddresses.Doug());
    DocumentManager documentManager = DocumentManager(DeployedAddresses.DocumentManager());

    function testDoug_ShouldBeCorrectlyConfigured() public {
        address documentstoreAddress = doug.contracts("documentstore");
        Assert.equal(DeployedAddresses.DocumentStore(), documentstoreAddress, "documentstore should be registered");

        address documentManagerAddress = doug.contracts("documentmanager");
        Assert.equal(DeployedAddresses.DocumentManager(), documentManagerAddress, "documentmanager should be registered");

        address notExisting = doug.contracts("notExisting");
        Assert.equal(address(0x0), notExisting, "An unregistered identifier should return an empty address");
    }

    function testRegistration_NewHash_ShouldSucceed() public {
        bool registered = documentManager.registerDocument("doc1Hash", "doc1", "2018-01-01", "Willy", "Willy@Somers.be");
        Assert.isTrue(registered, "First register should have succeeded");
    }

    function testRegistration_DuplicateHash_ShouldFail() public {
        bool registered = documentManager.registerDocument("doc1Hash", "doc1", "2018-01-01", "Willy", "Willy@Somers.be");
        Assert.isFalse(registered, "Second register should have failed");
    }

    function testRegistration_NewHashAsm_ShouldSucceed() public {
        bool registered = documentManager.registerDocument("doc1HashASM", "doc1ASM", "2018-01-02", "Willy", "Willy@Somers.be");
        Assert.isTrue(registered, "Third (asssembly) register should have succeeded");
    }

    function testIsDocumentRegistered_RegisteredDocument_ShouldReturnStoredData() public {
        bool registered;
        bytes32 title;
        bytes32 releaseDate;
        bytes32 authorName;
        bytes32 authorMail;

        (registered, title, releaseDate, authorName, authorMail) = documentManager.isDocumentRegistered("doc1Hash");

        Assert.equal(true, registered, "Should be registered");
        Assert.equal(bytes32("doc1"), title, "The title should be 'doc1'");
        Assert.equal(bytes32("2018-01-01"), releaseDate, "The releaseDate should be '2018-01-01'");
        Assert.equal(bytes32("Willy"), authorName, "The authorName should be 'Willy'");
        Assert.equal(bytes32("Willy@Somers.be"), authorMail, "The authorMail should be 'Willy@Somers.be'");
    }

    function testIsDocumentRegistered_RegisteredDocumentAsm_ShouldReturnStoredData() public {
        bool registered;
        bytes32 title;
        bytes32 releaseDate;
        bytes32 authorName;
        bytes32 authorMail;

        (registered, title, releaseDate, authorName, authorMail) = documentManager.isDocumentRegistered("doc1Hash");

        Assert.equal(true, registered, "Should be registered");
        Assert.equal(bytes32("doc1"), title, "The title should be 'doc1'");
        Assert.equal(bytes32("2018-01-01"), releaseDate, "The releaseDate should be '2018-01-01'");
        Assert.equal(bytes32("Willy"), authorName, "The authorName should be 'Willy'");
        Assert.equal(bytes32("Willy@Somers.be"), authorMail, "The authorMail should be 'Willy@Somers.be'");
    }

    function testIsDocumentRegistered_UnregisteredDocument_ShouldReturnNullData() public {
        bool registered;
        bytes32 title;
        bytes32 releaseDate;
        bytes32 authorName;
        bytes32 authorMail;

        (registered, title, releaseDate, authorName, authorMail) = documentManager.isDocumentRegistered("doc2Hash");

        Assert.equal(false, registered, "Should not be registered");
        Assert.equal(bytes32(0x0), title, "The title should be empty");
        Assert.equal(bytes32(0x0), releaseDate, "The releaseDate should be empty");
        Assert.equal(bytes32(0x0), authorName, "The authorName should be empty");
        Assert.equal(bytes32(0x0), authorMail, "The authorMail should be empty");
    }

    function testGetDocumentListFromAuthor_ExistingAuthor_ShouldReturnStoredDocumentHashes() public {

        bool registered = documentManager.registerDocument("A", "AA", "2018-01-01", "Sergio", "Sergio@Quisquater.be");
        Assert.isTrue(registered, "Registration of A should have succeeded");

        registered = documentManager.registerDocumentAsm("B", "BB", "2018-01-02", "Eddy", "Eddy@Wally.be");
        Assert.isTrue(registered, "Registration of B (assembly) should have succeeded");

        registered = documentManager.registerDocument("C", "CC", "2018-01-03", "Sergio", "Sergio@Quisquater.be");
        Assert.isTrue(registered, "Registration of C should have succeeded");

        bytes32 authorMail;
        bytes32[10] memory titles;
        bytes32[10] memory releaseDates;
        (authorMail, titles, releaseDates) = documentManager.getDocumentListFromAuthor("Sergio", 0, 1);

        Assert.equal(bytes32("Sergio@Quisquater.be"), authorMail, "The authorMail should be 'Sergio@Quisquater.be'");

        Assert.equal(bytes32("AA"), titles[0], "First title should be 'AA'");
        Assert.equal(bytes32("2018-01-01"), releaseDates[0], "First release date should be '2018-01-01'");

        Assert.equal(bytes32("CC"), titles[1], "Second title should be 'CC'");
        Assert.equal(bytes32("2018-01-03"), releaseDates[1], "Second release date should be '2018-01-03'");

        for(uint i = 2; i < 10; i++) {
            Assert.equal(bytes32(0x0), titles[i], "Third title (and everything after) should be empty");
            Assert.equal(bytes32(0x0), releaseDates[i], "Third release date (and everything after) should be empty");
        }
    }

    function testGetAmountOfDocumentsFromAuthor_ExistingAuthors_ShouldReturnAmountOfStoredDocumentHashes() public {
        uint amountOfDocuments = documentManager.getAmountOfDocumentsFromAuthor("Willy");
        Assert.equal(2, amountOfDocuments, "The amount of registered documents for 'Willy' should be 2");

        amountOfDocuments = documentManager.getAmountOfDocumentsFromAuthor("Sergio");
        Assert.equal(2, amountOfDocuments, "The amount of registered documents for 'Sergio' should be 2");

        amountOfDocuments = documentManager.getAmountOfDocumentsFromAuthor("Eddy");
        Assert.equal(1, amountOfDocuments, "The amount of registered documents for 'Eddy' should be 1");
    }
}
