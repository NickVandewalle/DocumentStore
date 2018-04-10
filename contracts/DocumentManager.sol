pragma solidity ^0.4.17;

import './ContractProvider.sol';
import './DocumentStore.sol';

contract DocumentManager is DocumentBase {

  function getDocumentStore() private view returns (DocumentStore) {
    address documentStoreAddress = ContractProvider(DOUG).contracts("documentstore");
    return DocumentStore(documentStoreAddress);
  }

  function isDocumentRegistered(bytes32 sdocHash) external constant returns (bool, bytes32, bytes32, bytes32, bytes32) {
    return getDocumentStore().isDocumentRegistered(sdocHash);
  }

  function registerDocument(bytes32 sdocHash, bytes32 title, bytes32 releaseDate, bytes32 authorName, bytes32 authorMail) external returns (bool) {
    return getDocumentStore().registerDocument(sdocHash, title, releaseDate, authorName, authorMail);
  }

  function getAmountOfDocumentsFromAuthor(bytes32 authorName) external constant returns (uint256 nrOfDocuments) {
    return getDocumentStore().getAmountOfDocumentsFromAuthor(authorName);
  }

  //no check on correct indices => responsability of frontend
  function getDocumentListFromAuthor(bytes32 authorName, uint256 startIndex, uint256 endIndex) external constant returns (bytes32 authorMail, bytes32[pageSize] memory titles, bytes32[pageSize] memory releaseDates)  {
    return getDocumentStore().getDocumentListFromAuthor(authorName, startIndex, endIndex);
  }
}