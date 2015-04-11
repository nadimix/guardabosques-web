'use strict';

var helper = {
  concurrency: 2,
  maxRetries: 2,
  id: '',
  chunks: []
};

var queue = [];

function guardabosques(url) {
  $(document).ready(function () {
    resourceHandler(url);
  });
}

// Resource fetch from a LB
function resourceHandler(url) {
  $.support.cors = true;
  $.ajax({
    type: 'GET',
    url: url,
    success: function(data) {
      var resource = data;
      console.log('json: ' + JSON.stringify(resource));
      downloadHandler(resource);
    },
    dataType: 'json',
    async: true
  });
}
// End resource fetch

/** Download handler **/
function downloadHandler(resource) {
  setHelper(resource);
  console.log('helper: ' + JSON.stringify(helper));
  setQueue(helper);
  console.log('queue: ' + queue);
  downloadFile(helper);
}
// End download handler

// Downloads a single file into a blob
function downloadFile(helper) {
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
  var dbVersion = 1.0;

  var database;
  var dbName = 'guardabosques_' + Date.now();

  var connect = indexedDB.open(dbName, dbVersion);
  var objectStore = helper.id;

  // IndexedDB connection handlers
  connect.onerror = function(event) {
    console.log("Error creating/accessing IndexedDB database");
  };

  connect.onsuccess = function(event) {
    console.log("Success creating/accessing IndexedDB database");

    database = connect.result;
    database.onerror = function (event) {
      console.log("Error creating/accessing IndexedDB database");
    };

    // Provisional solution for Chrome using objectStore instead. Will be deprecated
    if (database.setVersion) {
      if (database.version != dbVersion) {
        var setVersion = database.setVersion(dbVersion);
        setVersion.onsuccess = function () {
          createObjectStore(database);
          getChunkFile(helper.chunks, helper.maxRetries, 0);
        };
      }
      else {
        getChunkFile(helper.chunks, helper.maxRetries, 0);
      }
    }
    else {
      getChunkFile(helper.chunks, helper.maxRetries, 0);
    }
  };

  // For future use. Currently only in latest Firefox versions
  connect.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };
  // End IndexedDB connection handlers

  // Create/open database
  function createObjectStore (database) {
      database.createObjectStore(objectStore);
  }

  function getChunkFile(chunks, maxRetries, currentChunk) {
    var chunk = chunks[currentChunk];
    var url = chunk.candidates[chunk.retries];
    var numChunks = chunks.length;
    var chunkId = chunk.digest;
    var numCandidates = chunk.candidates.length;
    console.log('id: ' + chunkId);

    // Create XHR
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";

    // When start downloading
    xhr.onload = function(event) {
      if(xhr.status === 200) {
        var contentLength = xhr.getResponseHeader('Content-Length');
        var blob = xhr.response;
        if(checkChunkIntegrity(contentLength, blob.size, url)) {
          // Put the received blob into IndexedDB
          putChunkInDB(blob, chunkId);
          console.log('Retrieving the next chunk if any');
          currentChunk = currentChunk + 1;
          console.log('currentChunk: ' + currentChunk + ' numChunks ' + numChunks);
          if(currentChunk < numChunks) {
            getChunkFile(chunks, maxRetries, currentChunk);
          } else {
            console.log('Download finished');
          }
        } else {
          if(chunk.retries < maxRetries && numCandidates >= maxRetries ) {
            chunk.retries = chunk.retries + 1;
            getChunkFile(chunks, maxRetries, currentChunk);
          } else {
          console.error('chunk cannot be downloaded');
          }
        }
      } else {
        if(chunk.retries < maxRetries) {
          chunk.retries = chunk.retries + 1;
          getChunkFile(chunks, maxRetries, currentChunk);
        } else {
          console.error('chunk reached maxRetries');
        }
      }
    };
    // Send XHR
    xhr.send();
  }

  function checkChunkIntegrity(contentLength, blobSize, url) {
    if (Number(blobSize) === Number(contentLength)) {
      console.log('chunk '+url+' retrieved successfully');
      return true;
    } else {
      return false;
    }
  }

  function putChunkInDB(blob, index) {
    console.log("Putting chunks in IndexedDB");

    // Open a transaction to the database
    var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
    var transaction = database.transaction([objectStore], readWriteMode);

    // Put the blob into the database
    console.log('index: ' + index);
    var put = transaction.objectStore(objectStore).put(blob, index);
    // TODO add event handler when insert is complete or not.
  }
}

// Setters
function setHelper(resource) {
  helper.concurrency = resource.concurrency || 2;
  helper.maxRetries = resource.numRetries || 2; // TODO
  helper.id = resource.id;
  var chunks = resource.segments;
  chunks.forEach(function (chunk) {
    var file = {
      downloaded: false,
      retries: 0,
      digest: chunk.digest,
      candidates: chunk.candidates
    }
    helper.chunks.push(file);
  });
}

function setQueue(helper) {
  helper.chunks.forEach(function (chunk) {
    queue.push(chunk.candidates[0]);
  });
}
// End setters