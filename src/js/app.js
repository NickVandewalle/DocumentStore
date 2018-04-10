function toAscii(hex) {
  return web3.toAscii(hex).replace(/\u0000/g, '');
}

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

    $.getJSON('LocManager.json', function(data) {
      var LocManagerArtifact = data;
      App.contracts.LocManager = TruffleContract(LocManagerArtifact);
      App.contracts.LocManager.setProvider(App.web3Provider);
      return true;
    });

    $.getJSON('LetterOfCreditDb.json', function(data) {
      var LetterOfCreditDbArtifact = data;
      App.contracts.LetterOfCreditDb = TruffleContract(LetterOfCreditDbArtifact);
      App.contracts.LetterOfCreditDb.setProvider(App.web3Provider);
      return true;
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#btnIsRegistered', App.handleIsRegistered);
    $(document).on('click', '#btnRegister', App.handleRegister);
    $(document).on('click', '#btnListDocuments', App.handleListDocuments);
    $(document).on('click', '#btnTestData', App.handleFillWithTestData);
    $(document).on('change', "#fileInput", App.handleLoadFile);

    var locdbInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.LetterOfCreditDb.deployed().then(function(instance) {
        locdbInstance = instance;
        var event = locdbInstance.DocumentRegistered(function(error, result) {
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

    $("#docHash").val("aaa");
    $("#title").val("testtitel");
    $("#date").val("2018-01-01");
    $("#author").val("bart");
    $("#mail").val("bart@mail.be");
  },

  handleIsRegistered: function(event) {
    event.preventDefault();

    $("#list").empty();

    var docHash = $("#docHash").val();

    var locManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.LocManager.deployed().then(function(instance) {
        locManagerInstance = instance;
        return locManagerInstance.isDocumentRegistered(docHash);
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

    var docHash = $("#docHash").val();
    var title = $("#title").val();
    var date = $("#date").val();
    var author = $("#author").val();
    var mail = $("#mail").val();

    var locManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.LocManager.deployed().then(function(instance) {
        locManagerInstance = instance;
        return locManagerInstance.isDocumentRegistered.call(docHash);
      }).then(function(result) {
        console.log(result);
        if (result[0] == true) {
            $("#txtResult").val("AlreadyRegistered: " + toAscii(result[3]));
            return false;
        }
        else {
            return locManagerInstance.registerDocument(docHash, title, date, author, mail, {from: account});
        }
      }).then(function(result) {
        // if (result !== false)
        //   $("#txtResult").val("Registration succeeded");
      }).catch(function(err) {
        if (err.message.includes("invalid address"))
          alert("Pleas log in your metamask account.");
        console.error(err.message);
      });
    }); //web3
  },

  handleListDocuments: function(event) {
    event.preventDefault();

    $("#list").empty();

    var locManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error(error);
      }
      var account = accounts[0];
      App.contracts.LocManager.deployed().then(function(instance) {
        var author = $("#author").val();
        locManagerInstance = instance;
        return locManagerInstance.getDocumentListFromAuthor.call(author);
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
