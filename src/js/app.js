// A utility function to convert bytes32 to their ascii-variant.
// Due to a bug in web3-eth@1.0.0, web3.fromAscii(input, [padding]) can't be used to convert ascii to bytes32 because the padding argument is ignored.
// SO instead of converting the results back to ascii, we have to convert our input into bytes32 and trim all remaining nullvalues afterwards.
// This behavior is fixed in web3-eth@1.1.0 by using web3.eth.abi.encodeParameter(...);
function toAscii(hex) {
  return web3.toAscii(hex).replace(/\u0000/g, '');
}

function toBytes32(str) {
  //return web3.fromAscii(str, 32);
  return web3.toAscii(str).replace(/\u0000/g, '');
};

function clearFields() {
  $("#txtEvent").val("");
  $("#txtResult").val("");
}

function clearDocResults() {
  $("#nrOfDocuments").val("");
  $("#pageSize").val("");
}

function showTable(nrOfDocuments, pageSize, from, to, result, calculatePaging) {

  var author = $("#author").val();
  $("#docList").dataTable().fnDestroy();
  $('#tbody').empty();

  $("#txtResult").val("Displaying " + (to-from) + " / " + nrOfDocuments);
  var listBody = $('#docList').children('tbody');

  if (calculatePaging) {
    var paging = $(".pagination");
    paging.empty();

    //$('<li class="page-item"><a class="page-link" id="pagelink0" href="#">&laquo;</a></li>').appendTo(paging);
    for (i=0; i < Math.ceil(nrOfDocuments/pageSize); i++) {
      $('<li class="page-item"><a class="page-link" id=' + ("pagelink" + i) + ' href="#">' + (i+1) + '</a></li>').appendTo(paging);
    }
    //$('<li class="page-item"><a class="page-link" id=' + ("pagelink" + nrOfDocuments) + ' href="#">&raquo;</a></li>').appendTo(paging);
  }

  for (i=0; i < (to-from); i++) {
    $('<tr><th>' + author + '</th><th>' + toAscii(result[0]) + '</th><th>' + toAscii(result[1][i]) + '</th><th>' + toAscii(result[2][i]) + '</th></tr>').appendTo(listBody);
  }

  $('#docList').DataTable({
   "destroy": true,
   "processing": true,
   "bPaginate": false,
   "bLengthChange": false,
   "iDisplayLength": pageSize,
   "bFilter": true,
   "bInfo": false,
   "bAutoWidth": true,
   "ordering": false
  });
  $('#example').dataTable().fnDraw();
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

    $.getJSON('DocumentManager.json', function(data) {
      var DocumentManagerArtifact = data;
      App.contracts.DocumentManager = TruffleContract(DocumentManagerArtifact);
      App.contracts.DocumentManager.setProvider(App.web3Provider);
      return true;
    });

    //catch event in DocumentStore
    $.getJSON('DocumentStore.json', function(data) {
      var DocumentStoreArtifact = data;
      App.contracts.DocumentStore = TruffleContract(DocumentStoreArtifact);
      App.contracts.DocumentStore.setProvider(App.web3Provider);
      return true;
    });

    var documentStoreInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error("Event, accounts: " + error);
      }
      var account = accounts[0];
      App.contracts.DocumentStore.deployed().then(function(instance) {
        documentStoreInstance = instance;
        var docEvent = documentStoreInstance.DocumentRegistered(function(error, result) {
          if (error) {
            $("#txtEvent").val("event triggered: error = " + error);
            return;
          }
          else if (result) {
            $("#txtEvent").val("event triggered: " + result.args.succes);
          }
        })
      })
    });

    return App.bindEvents();
  },

  bindEvents: function() {

    $(document).on('click', '#btnIsRegistered', App.handleIsRegistered);
    $(document).on('click', '#btnRegister', App.handleRegister);
    $(document).on('click', '#btnListDocuments', App.handleListDocuments);
    $(document).on('click', '#btnTestData', App.handleFillWithTestData);
    $(document).on('change', "#fileInput", App.handleLoadFile);
    $(document).on('click', ".page-link", App.handlePaginate);

  },

  handleLoadFile: function(event) {
    event.preventDefault();

    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function(event) {
      var binary = reader.result;
      $("#docHash").val(CryptoJS.SHA256(binary).toString());
      $("#title").val(file.name);
    }
    reader.readAsText(file);
  },

  handleFillWithTestData: function(event) {
    event.preventDefault();

    $("#docHash").val("98baea967b6d0a86d2940c3fdf0a986e86ed358a5dae2b1ce430882a9492f94e");
    $("#title").val("MyPdf.pdf");
    $("#date").val("2017-12-01");
    $("#author").val("auteur_naam");
    $("#mail").val("naam@mail.be");
  },

  handleIsRegistered: function(event) {
    event.preventDefault();

    clearFields();

    var docHash = toBytes32($("#docHash").val());
    if (docHash == "" )
      $("#txtResult").val("select a file first");
    else {
      var documentManagerInstance;
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.error("IsRegistered, accounts: " + error);
          if (err.message.includes("invalid address"))
            alert("Pleas log in your metamask account.");
        }
        var account = accounts[0];
        App.contracts.DocumentManager.deployed().then(function(instance) {
          documentManagerInstance = instance;
          return documentManagerInstance.isDocumentRegistered(docHash);
        }).then(function(result) {
          if (result[0] == true)
            $("#txtResult").val("Is registered to " + toAscii(result[3]) + " (" + toAscii(result[4]) + "): " + toAscii(result[1]) + " (" + toAscii(result[2]) + ")");
          else {
            $("#txtResult").val("Not registered yet");
          }
          return true;
        }).catch(function(err) {
          console.error("IsRegistered: " + err.message);
        });
      });
    }
  },

  handleRegister: function(event) {
    event.preventDefault();

    clearFields();

    var docHash = toBytes32($("#docHash").val());
    var title = $("#title").val();
    var date = $("#date").val();
    var author = $("#author").val();
    var mail = $("#mail").val();

    var documentManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error("Register, accounts: " + error);
        if (err.message.includes("invalid address"))
          alert("Pleas log in your metamask account.");
      }
      var account = accounts[0];
      App.contracts.DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.isDocumentRegistered.call(docHash);
      }).then(function(result) {
        if (result[0] == true) {
            $("#txtResult").val("Already registered to " + toAscii(result[3]) + " (" + toAscii(result[4]) + "): " + toAscii(result[1]) + " (" + toAscii(result[2]) + ")");
            return false;
        }
        else {
          if ($("#cbAssembly").is(":checked"))
            documentManagerInstance.registerDocumentAsm(docHash, title, date, author, mail, {from: account});
          else
            documentManagerInstance.registerDocument(docHash, title, date, author, mail, {from: account});
        }
      }).catch(function(err) {
        if (err.message.includes("invalid address"))
          alert("Pleas log in your metamask account.");
        console.error("RegisterDoc: " + err.message);
      });
    });
  },

  handleListDocuments: function(event) {
    event.preventDefault();

    clearFields();
    clearDocResults();

    var documentManagerInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.error("ListDocs, accounts: " + error);
        if (err.message.includes("invalid address"))
          alert("Pleas log in your metamask account.");
      }
      var account = accounts[0];
      var author = $("#author").val();
      var firstBatch = 0;
      var nrOfDocuments = 0;
      var pageSize = 0;
      App.contracts.DocumentManager.deployed().then(function(instance) {
        documentManagerInstance = instance;
        return documentManagerInstance.getAmountOfDocumentsFromAuthor.call(author);
      }).then(function(result) {
        nrOfDocuments = result.c[0];
        $("#nrOfDocuments").val(nrOfDocuments);
        if (nrOfDocuments == 0) {
          $("#txtResult").val("no results");
          return 0;
        }
        else
          return documentManagerInstance.getPageSize.call();
      }).then(function(result) {
        if (nrOfDocuments > 0) {
          pageSize = result.c[0];
          $("#pageSize").val(pageSize);
          firstBatch = pageSize;
          if (firstBatch > nrOfDocuments)
            firstBatch = nrOfDocuments;
          if ($("#cbAssembly").is(":checked")) {
            return documentManagerInstance.getDocumentListFromAuthorAsm.call(author, 0, firstBatch-1);
          }
          else {
            return documentManagerInstance.getDocumentListFromAuthor.call(author, 0, firstBatch-1);
          }
        }
        else
          return false;
      }).then(function(result) {
        if (nrOfDocuments > 0) {
          showTable(nrOfDocuments, pageSize, 0, firstBatch, result, true);
        }
        return true;
      }).catch(function(err) {
        console.error("List docs: " + err.message);
      });
    });
  },

  handlePaginate: function(event) {
     event.preventDefault();

     var id = event.target.id.replace("pagelink", "");
     var nrOfDocuments = $("#nrOfDocuments").val();
     var pageSize = $("#pageSize").val();
     var from = id * pageSize * 1;
     var to = Number(from) + Number(pageSize); //Number: otherwise js concatenates variables as strings
     if (to > nrOfDocuments)
      to = nrOfDocuments;

     var documentManagerInstance;
     web3.eth.getAccounts(function(error, accounts) {
       if (error) {
         console.error("Paginate, accounts: " + error);
         if (err.message.includes("invalid address"))
           alert("Pleas log in your metamask account.");
       }
       var account = accounts[0];
       var author = $("#author").val();

       App.contracts.DocumentManager.deployed().then(function(instance) {
         documentManagerInstance = instance;
         if ($("#cbAssembly").is(":checked")) {
           return documentManagerInstance.getDocumentListFromAuthorAsm.call(author, from, to-1);
         }
         else {
           return documentManagerInstance.getDocumentListFromAuthor.call(author, from, to-1);
         }
       }).then(function(result) {
         showTable(nrOfDocuments, pageSize, from, to, result, false);
         return true;
       }).catch(function(err) {
         console.error("List doc paging: " + err.message);
       });
     });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
