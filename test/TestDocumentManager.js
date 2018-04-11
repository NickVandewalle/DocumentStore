var Owned = artifacts.require("Owned.sol");
var ContractProvider = artifacts.require("ContractProvider");
var Doug = artifacts.require("Doug");
var DougEnabled = artifacts.require("DougEnabled");
var DocumentBase = artifacts.require("DocumentBase");
var DocumentStore = artifacts.require("DocumentStore");
var DocumentManager = artifacts.require("DocumentManager");

contract('DocumentManager', function(accounts) {

  it("should have correctly configured Doug", async () => {
    let dougInstance = await Doug.deployed();
    let documentStoreInstance = await DocumentStore.deployed(); 
    let documentManagerInstance = await DocumentManager.deployed(); 
    let documentStoreAddress = await dougInstance.contracts('documentstore');
    let documentManagerAddress = await dougInstance.contracts('documentmanager');
    let notExistingAddress = await dougInstance.contracts('notexisting');

    assert.equal(documentStoreAddress.valueOf(), documentStoreInstance.address, "DocumentStore was not correctly registered");
    assert.equal(documentManagerAddress.valueOf(), documentManagerInstance.address, "DocumentManager was not correctly registered");
    assert.notEqual(notExistingAddress.valueOf(), 0x0.toString(), "An unregistered identifier should return an empty address");
  });
  
  it("should be possible to register a document", function () {
    var documentManagerInstance, isRegisteredResult;

    return DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.registerDocument("doc1Hash", "doc1", "2018-01-01", "Willy", "Willy@Somers.be");
    }).then(function(result) {
        return documentManagerInstance.isDocumentRegistered.call("doc1Hash");
    }).then(function(result) {
        isRegisteredResult = result;
    }).then(function() {
        assert.isTrue(isRegisteredResult[0], "Should be registered");
        assert.equal("doc1", toAscii(isRegisteredResult[1]), "Title should be 'doc1'");
        assert.equal("2018-01-01", toAscii(isRegisteredResult[2]), "Release date should be '2018-01-01'");
        assert.equal("Willy", toAscii(isRegisteredResult[3]), "Author should be 'Willy'");
        assert.equal("Willy@Somers.be", toAscii(isRegisteredResult[4]), "Email should be 'Willy@Somers.be'");
    });
  });
  
  it("should be possible to get a list of documents by author", function () {
    var documentManagerInstance, amountOfDocuments, documentList;

    return DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.registerDocument("A", "AA", "2018-01-01", "Sergio", "Sergio@Quisquater.be");
    }).then(function(result) {
        return documentManagerInstance.registerDocument("B", "BB", "2018-01-02", "Eddy", "Eddy@Wally.be");
    }).then(function(result) {
        return documentManagerInstance.registerDocument("C", "CC", "2018-01-03", "Sergio", "Sergio@Quisquater.be");
    }).then(function(result) {
        return documentManagerInstance.getAmountOfDocumentsFromAuthor.call("Sergio");
    }).then(function(result) {
        amountOfDocuments = result;
        return documentManagerInstance.getDocumentListFromAuthor.call("Sergio", 0, 1);
    }).then(function(result) {
        documentList = result;
        
        assert.equal(2, amountOfDocuments.toNumber(), "2 documents should be registered");
        assert.equal("Sergio@Quisquater.be", toAscii(documentList[0]), "The authorMail should be 'Sergio@Quisquater.be'");
        assert.equal("AA", toAscii(documentList[1][0]), "First title should be 'AA'");
        assert.equal("2018-01-01", toAscii(documentList[2][0]), "First release date should be '2018-01-01'");
        assert.equal("CC", toAscii(documentList[1][1]), "Second title should be 'CC'");
        assert.equal("2018-01-03", toAscii(documentList[2][1]), "Second release date should be '2018-01-03'");
    });
  });

  // A utility function to convert bytes32 to their ascii-variant. 
  // Due to a bug in web3-eth@1.0.0, web3.fromAscii(input, [padding]) can't be used to convert ascii to bytes32 because the padding argument is ignored.
  // SO instead of converting the results back to ascii, we have to convert our input into bytes32 and trim all remaining nullvalues afterwards.
  // This behavior is fixed in web3-eth@1.1.0 by using web3.eth.abi.encodeParameter(...);
  function toAscii(input) { 
      return web3.toAscii(input).replace(/\u0000/g, '')
  }
});
