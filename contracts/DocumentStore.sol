pragma solidity ^0.4.17;

import "./DocumentBase.sol";
import "./ContractProvider.sol";

contract DocumentStore is DocumentBase {

    event DocumentRegistered(bool succes, bytes32 docHash);

    struct Author {
        bytes32 name;
        bytes32 mail;
    }

    struct Document {
        bytes32 title;
        bytes32 releaseDate;
        Author author;
        bool isEntity;
    }

    mapping(bytes32 => bytes32[]) private documentsOfAuthor; //documentsOfAuthor[authorName] = array of docHashes
    mapping(bytes32 => Document) private documents; //documents[docHash] = Document

    modifier onlyByDocumentManager() {        
        require(DOUG != 0x0);
        address documentManager = ContractProvider(DOUG).contracts("documentmanager");
        require(msg.sender == documentManager);

        _;
    }

    function isDocumentRegistered(bytes32 docHash) onlyByDocumentManager external constant returns (bool, bytes32, bytes32, bytes32, bytes32) {
        if (documents[docHash].isEntity)
            return (true, documents[docHash].title, documents[docHash].releaseDate, documents[docHash].author.name, documents[docHash].author.mail);
        else
            return (false, 0x0, 0x0, 0x0, 0x0);
    }

    //return if registration was succesful
    function registerDocument(bytes32 docHash, bytes32 title, bytes32 releaseDate, bytes32 authorName, bytes32 authorMail) onlyByDocumentManager external returns (bool) {
        if (documents[docHash].isEntity) {
            DocumentRegistered(false, docHash);
            return false;
        } else {
            documents[docHash] = Document(title, releaseDate, Author(authorName, authorMail), true);
            documentsOfAuthor[authorName].push(docHash);
            DocumentRegistered(true, docHash);
            return true;
        }
    }

    //return if registration was succesful
    function registerDocumentAsm(bytes32 docHash, bytes32 title, bytes32 releaseDate, bytes32 authorName, bytes32 authorMail) onlyByDocumentManager external returns (bool) {
        bool succes = false;

        assembly {
            mstore(0x0, authorName)
            mstore(0x20, 0x1)                       //skip DOUG byte
            let docauth := keccak256(0x0, 0x40) 	  //documentsOfAuthor[authorName]
            let nrOfDocuments := sload(docauth)

            mstore(0x0, docauth)
            let docauth0 := keccak256(0x0, 0x20)   //address of documentsOfAuthor[authorName][0]

            mstore(0x0, docHash)
            mstore(0x20, 0x2)                      //skip DOUG byte + first mapping
            let doc := keccak256(0x0, 0x40)        //address of documents[docHash]
            
            if eq(sload(add(doc, 0x4)), 0) {                            //doesn't exists
                sstore(docauth, add(nrOfDocuments, 1))                  //store amount of documents
                sstore(add(docauth0, mul(nrOfDocuments, 0x1)), docHash) //store dochash
                sstore(doc, title)                            //store document
                sstore(add(doc, 0x1), releaseDate)
                sstore(add(doc, 0x2), authorName)
                sstore(add(doc, 0x3), authorMail)
                sstore(add(doc, 0x4), 1)
                succes := 1
            }
        }

        DocumentRegistered(succes, docHash);
        return (succes);
    }

    function getAmountOfDocumentsFromAuthor(bytes32 authorName) onlyByDocumentManager external constant returns(uint256 nrOfDocuments) {
        assembly {
            mstore(0x0, authorName)
            mstore(0x20, 0x1)                        //skip DOUG byte
            let docauth := keccak256(0x0, 0x40) 	   //documentsOfAuthor[authorName]
            nrOfDocuments := sload(docauth)
        }

        return nrOfDocuments;
    }

    //no check on correct indices => responsability of frontend
    function getDocumentListFromAuthor(bytes32 authorName, uint256 startIndex, uint256 endIndex) onlyByDocumentManager external constant returns (bytes32 authorMail, bytes32[pageSize] memory titles, bytes32[pageSize] memory releaseDates) {
        require(endIndex - startIndex < 10);

        authorMail = documents[documentsOfAuthor[authorName][0]].author.mail;
        for (uint256 i = startIndex; i <= endIndex; i++) {
            titles[i-startIndex] = documents[documentsOfAuthor[authorName][i]].title;
            releaseDates[i-startIndex] = documents[documentsOfAuthor[authorName][i]].releaseDate;
        }

        return (authorMail, titles, releaseDates);
    }

    //no check on correct indices => responsability of frontend
    function getDocumentListFromAuthorAsm(bytes32 authorName, uint256 startIndex, uint256 endIndex) onlyByDocumentManager external constant returns (bytes32 authorMail, bytes32[pageSize] memory titles, bytes32[pageSize] memory releaseDates) {
        require(endIndex - startIndex < 10);

        assembly {
            mstore(0x0, authorName)
            mstore(0x20, 0x1)                        //skip DOUG byte
            let docauth := keccak256(0x0, 0x40) 	   //documentsOfAuthor[authorName]
            //nrOfDocuments := sload(docauth)        //length not needed

            mstore(0x0, docauth)
            let docauth0 := keccak256(0x0, 0x20)  //address of documentsOfAuthor[authorName][0]

            for
                { let i := startIndex }
                lt(i, add(endIndex, 1))
                { i := add(i, 1) }
            {
                let docHash := sload(add(docauth0, mul(i, 0x1)))

                mstore(0x0, docHash)                   //store docHash to memory
                mstore(0x20, 0x2)           //skip doug byte + first mapping
                let doc := keccak256(0x0, 0x40)        //address of documents[docHash]

                if eq(i, 0) { authorMail := sload(add(doc, 0x3)) }  //+2 for Author Struct, +1 for second byte

                mstore(add(titles, mul(sub(i, startIndex), 0x20)), sload(doc))
                mstore(add(releaseDates, mul(sub(i, startIndex), 0x20)), sload(add(doc, 0x1)))
            }
        }

        return (authorMail, titles, releaseDates);
    }
}