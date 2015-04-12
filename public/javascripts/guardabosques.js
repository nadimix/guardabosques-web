'use strict';

var helper = {
  concurrency: 2,
  maxRetries: 2,
  id: '',
  chunks: []
};

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
  downloadFile(helper);
}
// End download handler

// Downloads a single file into a blob
function downloadFile(helper) {
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
  
  if (IDBTransaction) {
    IDBTransaction.READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
    IDBTransaction.READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
  }

  var dbVersion = 1.0;
  var dbName = 'guardabosques_' + Date.now();
  var connect = indexedDB.open(dbName, dbVersion);
  var objectStore = helper.id;
  var database;

  // IndexedDB connection handlers
  connect.onerror = function(event) {
    console.error("Error creating/accessing IndexedDB database: " + event);
  };

  connect.onsuccess = function(event) {
    console.info("Success creating/accessing IndexedDB database: " + event);

    database = connect.result;
    database.onerror = function (event) {
      console.error("Error creating/accessing IndexedDB database: " + event);
    };
    database.onblocked = function (event) {
      console.log('Database blocked: ' + event);
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
          console.log('Inserting: ' + chunkId + ' blob: ' + blob);
          database.transaction([objectStore], IDBTransaction.READ_WRITE).objectStore(objectStore).put(blob, chunkId).onsuccess = function(event) {
            console.info('Transaction: ' +chunkId+ ' success');
            currentChunk = currentChunk + 1;
            if(currentChunk < numChunks) {
              console.info('Downloading the next chunk');
              getChunkFile(chunks, maxRetries, currentChunk);
            } else {
              console.info('Download finished');
              var arrayBlob = [];
              var index = 0;
              var arrayId = [];
              chunks.forEach(function(chunk) {
                arrayId.push(chunk.digest);
              });
              console.log(arrayId);
              console.log(arrayBlob);
              fetchChunksFromDB(index, arrayId, arrayBlob);
            }
          }
        } else {
          if(chunk.retries < maxRetries && numCandidates >= maxRetries ) {
            console.warn('Retrying because integrity test failed: ' + chunkId);
            chunk.retries = chunk.retries + 1;
            getChunkFile(chunks, maxRetries, currentChunk);
          } else {
          console.error('chunk cannot be downloaded');
          }
        }
      } else {
        if(chunk.retries < maxRetries) {
          console.warn('Retrying because not 200 status code: ' + chunkId);
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

  function fetchChunksFromDB(index, arrayId, arrayBlob) {
    var id = arrayId[index];
    console.info('Fetching: ' + id);
    database.transaction([objectStore], IDBTransaction.READ_WRITE).objectStore(objectStore).get(id).onsuccess = function(event) {
      console.info('blob #' + index + ': ' + event.target.result);
      arrayBlob.push(event.target.result);
      if(arrayBlob.length < arrayId.length) {
        index = index + 1;
        fetchChunksFromDB(index, arrayId, arrayBlob);
      } else {
        console.info(arrayBlob);
        var blobJoined = new Blob(arrayBlob);
        var j = 0;
        var urlFile = URL.createObjectURL(blobJoined);
        console.info(urlFile);
        var link = document.createElement('a');
        link.innerHTML = 'download now';
        link.type = 'application/octet-stream';
        link.download = 'ubuntu-14.04.2-desktop-amd64.iso',
        link.href = urlFile;
        document.body.appendChild(link);
        cleanDatabase(arrayId, j);
      }
    }
  }

  function cleanDatabase(arrayId, index) {
    var id = arrayId[index];
    database.transaction([objectStore], IDBTransaction.READ_WRITE).objectStore(objectStore).delete(id).onsuccess = function(event) {
      console.info('delete: ' +id+ ' success');
      index = index + 1;
      if(index < arrayId.length) {
        cleanDatabase(arrayId, index);
      } else {
        console.info('Database cleaned successfully');
      }
    }
  }

  function checkChunkIntegrity(contentLength, blobSize, url) {
    if (Number(blobSize) === Number(contentLength)) {
      console.info('chunk '+url+' retrieved successfully');
      return true;
    } else {
      return false;
    }
  }
}

// Setters
function setHelper(resource) {
  helper.maxRetries = resource.numRetries || 2;
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
// End setters