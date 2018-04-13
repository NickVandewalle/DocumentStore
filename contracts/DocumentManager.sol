pragma solidity ^0.4.17;

import './ContractProvider.sol';
import './DocumentStore.sol';

contract DocumentManager is DocumentBase {

  function getPageSize() public pure returns (uint) {
    return pageSize;
  }

  function getDocumentStore() private view returns (DocumentStore) {
    address documentStoreAddress = ContractProvider(DOUG).contracts("documentstore");
    return DocumentStore(documentStoreAddress);
  }

  function isDocumentRegistered(bytes32 sdocHash) public constant returns (bool, bytes32, bytes32, bytes32, bytes32) {
    return getDocumentStore().isDocumentRegistered(sdocHash);
  }

  function registerDocument(bytes32 sdocHash, bytes32 title, bytes32 releaseDate, bytes32 authorName, bytes32 authorMail) public returns (bool) {
    return getDocumentStore().registerDocument(sdocHash, title, releaseDate, authorName, authorMail);
  }

  function registerDocumentAsm(bytes32 sdocHash, bytes32 title, bytes32 releaseDate, bytes32 authorName, bytes32 authorMail) public returns (bool) {
    return getDocumentStore().registerDocument(sdocHash, title, releaseDate, authorName, authorMail);
  }

  function getAmountOfDocumentsFromAuthor(bytes32 authorName) public constant returns (uint256 nrOfDocuments) {
    return getDocumentStore().getAmountOfDocumentsFromAuthor(authorName);
  }

  //no check on correct indices => responsability of frontend
  function getDocumentListFromAuthor(bytes32 authorName, uint256 startIndex, uint256 endIndex) public constant returns (bytes32 authorMail, bytes32[pageSize] memory titles, bytes32[pageSize] memory releaseDates)  {
    return getDocumentStore().getDocumentListFromAuthor(authorName, startIndex, endIndex);
  }

  //no check on correct indices => responsability of frontend
  function getDocumentListFromAuthorAsm(bytes32 authorName, uint256 startIndex, uint256 endIndex) public constant returns (bytes32 authorMail, bytes32[pageSize] memory titles, bytes32[pageSize] memory releaseDates)  {
    return getDocumentStore().getDocumentListFromAuthorAsm(authorName, startIndex, endIndex);
  }
}
