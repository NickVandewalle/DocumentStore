/*
var a, b;
deployer.then(function() {
  // Create a new version of A
  return A.new();
}).then(function(instance) {
  a = instance;
  // Get the deployed instance of B
  return B.deployed();
}).then(function(instance) {
  b = instance;
  // Set the new instance of A's address on B via B's setA() function.
  return b.setA(a.address);
});
*/

var CMC = artifacts.require("CMC.sol");
var DocumentStore = artifacts.require("DocumentStore.sol");
var DocumentStoreDB = artifacts.require("DocumentStoreDB.sol");

var cmc, documentStoreDB, documentStore;
var dbIdentifier = "DocumentStoreDB";
var storeIdentifier = "DocumentStore";

module.exports = function(deployer) 
{
    deployer
        .deploy(CMC)
        .then(function(instance) { return CMC.deployed(); })
        .then(function(instance) 
        { 
            cmc = instance;
            return deployer
                .deploy(DocumentStoreDB)
                .then(function(instance) { return DocumentStoreDB.deployed(); })
                .then(function(instance) 
                {
                    console.log(typeof instance);
                    documentStoreDB = instance;
                    return documentStoreDB.setCMC(cmc.address); 
                })
                .then(function(instance) { return cmc.addContract(dbIdentifier, documentStoreDB.address); });
        })
        .then(function(instance) 
        {
            return deployer
                .deploy(DocumentStore)
                .then(function(instance) { return DocumentStore.deployed(); })
                .then(function(instance)
                {
                    document = instance;
                    return document.setCMC(cmc.address);
                })
                .then(function(instance) { return cmc.addContract(storeIdentifier, document.address); })
                .then(function(instance) { return document.setDBIdentifier(dbIdentifier); });
        });
};