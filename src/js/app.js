function toAscii(hex) {
  return web3.toAscii(hex).replace(/\u0000/g, '');
}

function getDocHash() { return web3.fromAscii($("#docHash").val()); }
function setDocHash(docHash) { $("#docHash").val(docHash) }

function getTitle() { return web3.fromAscii($("#title").val()); };
function setTitle(title) { $("#title").val(title) };

function getDate() { return web3.fromAscii($("#date").val()); };
function setDate(date) { $("#date").val(date) };

function getAuthor() { return web3.fromAscii($("#author").val()); };
function setAuthor(author) { $("#author").val(author) };

function getMail() { return web3.fromAscii($("#mail").val()); };
function setMail(mail) { $("#mail").val(mail) };

function getStartIndex() { return parseInt($("#startIndex").val()); }
function getEndIndex() { return parseInt($("#endIndex").val()); }

function setDocumentCount(count) { $("#txtDocumentCount").val(count); }

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {

    $.getJSON('DocumentManager.json', function(data) {
      var documentManagerArtifact = data;
      App.contracts.DocumentManager = TruffleContract(documentManagerArtifact);
      App.contracts.DocumentManager.setProvider(App.web3Provider);
      return true;
    });

    $.getJSON('DocumentStore.json', function(data) {
      var DocumentStoreArtifact = data;
      App.contracts.DocumentStore = TruffleContract(DocumentStoreArtifact);
      App.contracts.DocumentStore.setProvider(App.web3Provider);
      return true;
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#btnIsRegistered', App.handleIsRegistered);
    $(document).on('click', '#btnRegister', App.handleRegister);
    $(document).on('click', '#btnListDocuments', App.handleListDocuments);
    $(document).on('click', '#btnDocumentCount', App.handleDocumentCount);
    $(document).on('click', '#btnTestData', App.handleFillWithTestData);
    $(document).on('change', "#fileInput", App.handleLoadFile);

    var documentStoreInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.DocumentStore.deployed().then(function(instance) {
        documentStoreInstance = instance;
        var event = documentStoreInstance.DocumentRegistered(function(error, result) {
          if (error) {
            $("#txtResult").val("event triggered: error = " + error);
            return;
          }
          else {
            $("#txtResult").val("event triggered: " + result.args.succes);
            console.log(result);
          }
        })
      })
    })
  },

  handleLoadFile: function(event) { //hashing (ook) langs server kant?
    event.preventDefault();

    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(event) {
      var binary = reader.result;
      //$("#docHash").val(CryptoJS.SHA256(binary).toString());
      $("#docHash").val(CryptoJS.SHA256(binary)); //opzoeken hoe string naar bytes32 om te zetten
      $("#title").val(file.name);
    }
    reader.readAsText(file);
  },

  handleFillWithTestData: function(event) {
    event.preventDefault();

    setDocHash("Hash");
    setTitle("Title");
    setDate("2018-01-01");
    setAuthor("Author");
    setMail("Mail");
  },

  handleIsRegistered: function(event) {
    event.preventDefault();

    $("#list").empty();

    var docHash = getDocHash();

    var documentManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.isDocumentRegistered(docHash);
      }).then(function(result) {
        console.log(result);
        if (result[0] == true)
          $("#txtResult").val("AlreadyRegistered: " + toAscii(result[2]));
        else {
          $("#txtResult").val("NotRegisteredYet");
        }
        return true;
      }).catch(function(err) {
        console.error(err.message);
      });
    });
  },

  handleRegister: function(event) {
    event.preventDefault();

    $("#list").empty();
    $("#txtResult").val("");
    
    var docHash = getDocHash();
    var title = getTitle();
    var date = getDate();
    var author = getAuthor();
    var mail = getMail();

    var documentManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];

      App.contracts.DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.isDocumentRegistered.call(docHash);
      }).then(function(result) {
        console.log(result);
        if (result[0] == true) {
          $("#txtResult").val("AlreadyRegistered: " + toAscii(result[3]));
          return false;
        } else {
          return documentManagerInstance.registerDocument(docHash, title, date, author, mail, {from: account});
        }
      }).then(function(result) {
        console.log(result);
      }).catch(function(err) {
        if (err.message.includes("invalid address"))
          alert("Please log in your metamask account.");
        console.error(err.message);
      });
    }); //web3
  },

  handleDocumentCount: function(event) {
    event.preventDefault();

    setDocumentCount(0);
    
    App.contracts.DocumentManager.deployed().then(function(instance) {
      documentManagerInstance = instance;
      var author = getAuthor();
      return documentManagerInstance.getAmountOfDocumentsFromAuthor.call(author);
    }).then(function(result) {
      setDocumentCount(result[0]);
    });
  },

  handleListDocuments: function(event) {
    event.preventDefault();

    $("#list").empty();

    var documentManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        var startIndex = getStartIndex();
        var endIndex = getEndIndex();
        return documentManagerInstance.getDocumentListFromAuthor.call(author, startIndex, endIndex);
      }).then(function(result) {
        //console.log(result);
        //console.log(result[0].c[0]);
        if (result) {
          $("#txtResult").val(toAscii(result[1])); //mail
          var ul = $("#list");
          for (i = 0; i < result[0].c[0]; i++) {
            $('<li>' + toAscii(result[2][i]) + ', date = ' + toAscii(result[3][i]) + '</li>').appendTo(ul);
          }
        } else {
            $("#txtResult").val("no results");
        }
        return true;
      }).catch(function(err) {
        console.error(err.message);
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
