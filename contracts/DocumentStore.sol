pragma solidity ^0.4.17;

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

contract CMC is Mortal, Rejector {
    mapping (bytes32 => address) _contracts;
    
    function addContract(bytes32 identifier, address contractAddress) public onlyOwner {
        _contracts[identifier] = contractAddress;
    }
    
    function removeContract(bytes32 identifier) public onlyOwner returns (bool) {
        if (_contracts[identifier] == 0x0) return false;
        
        _contracts[identifier] = 0x0;
        return true;
    }
    
    function getContract(bytes32 name) public view returns (address) {
        return _contracts[name];
    }
}

contract CMCEnabled is Mortal, Rejector {    
    address cmc;
    
    function setCMC(address cmc_) public onlyOwner returns (bool) {
        if (cmc != 0x0 && msg.sender != cmc_) return false;
        
        cmc = cmc_;
        return true;
    }
    
    function getContract(bytes32 identifier) internal view returns (address) {
        return CMC(cmc).getContract(identifier);
    }
}

contract DocumentStore is CMCEnabled {
    bytes32 public DBIdentifier;

    function setDBIdentifier(bytes32 identifier) public {
        DBIdentifier = identifier;
    }

    function getDB() internal view returns (DocumentStoreDB) {
        return DocumentStoreDB(getContract(DBIdentifier));
    }

    function register(bytes32 documentHash, bytes32 title, bytes32 author) public returns (bool) {
        return getDB().register(documentHash, title, author);
    }

    function getByHash(bytes32 requestedHash) public view returns (bytes32 documentHash, bytes32 title, bytes32 author) {
        return getDB().getByHash(requestedHash);
    }

    function getByAuthor(bytes32 author) public view returns (bytes32[25] documentHashes, bytes32[25] titles, bytes32[25] authors) {
        return getDB().getByAuthor(author);
    }
}

contract DocumentStoreDB is CMCEnabled {

    struct Document {
        bytes32 documentHash;
        bytes32 title;
        bytes32 author;
    }

    mapping (bytes32 => Document) _documentsByHash;
    mapping (bytes32 => Document[]) _documentsByAuthor;
    Document[] _documents;
    
    function register(bytes32 documentHash, bytes32 title, bytes32 author) public returns (bool) {
        if (_documentsByHash[documentHash].documentHash != 0x0) return false; // Already registered, we can abort early.

        // Not registered yet, compose a document and store it in the lookups.
        Document memory document = Document({ documentHash: documentHash, title: title, author: author });
        _documentsByHash[documentHash] = document;
        _documentsByAuthor[author].push(document);
        _documents.push(document);
        return true;
    }

    function getByHash(bytes32 requestedHash) public view returns (bytes32 documentHash, bytes32 title, bytes32 author) {
        Document memory document = _documentsByHash[requestedHash];

        documentHash = document.documentHash;
        title = document.title;
        author = document.author;
    }

    function getByAuthor(bytes32 requestedAuthor) public view returns (bytes32[25] documentHashes, bytes32[25] titles, bytes32[25] authors) {
        Document[] memory documents = _documentsByAuthor[requestedAuthor];

        for(uint i = 0; i < documents.length; i++) {
            documentHashes[i] = documents[i].documentHash;
            titles[i] = documents[i].title;
            authors[i] = documents[i].author;
        }
    }
}