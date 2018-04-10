var Owned = artifacts.require("Owned.sol");
var ContractProvider = artifacts.require("ContractProvider");
var Doug = artifacts.require("Doug");
var DougEnabled = artifacts.require("DougEnabled");
var DocumentBase = artifacts.require("DocumentBase");
var DocumentStore = artifacts.require("DocumentStore");
var DocumentManager = artifacts.require("DocumentManager");

module.exports = function(deployer) {
  deployer.deploy(Doug);
  deployer.deploy(DocumentStore);
  deployer.deploy(DocumentManager);

  var dougInstance, docStore, docManager;
  deployer.then(function() {
    return Doug.deployed();
  }).then(function(instance) {
    dougInstance = instance;
    return DocumentStore.deployed();
  }).then(function(instance) {
    docStore = instance;
    dougInstance.addContract("documentstore", docStore.address);
    return DocumentManager.deployed();
  }).then(function(instance) {
    docManager = instance;
    dougInstance.addContract("documentmanager", docManager.address);
  });
};