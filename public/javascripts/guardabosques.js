'use strict';

var resource;

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
      resource = data;
      console.log('resource: ' + JSON.stringify(resource));
      downloadFile(resource);
    },
    dataType: 'json',
    async: true
  });
}
// End resource fetch

// Downloads a single file into a blob
function downloadFile(resource) {
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;

  if (IDBTransaction) {
    IDBTransaction.READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
    IDBTransaction.READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
  }

  var dbVersion = 1.0;
  var dbName = 'guardabosques_' + Date.now();
  var connect = indexedDB.open(dbName, dbVersion);
  var objectStore = resource.id;
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
          getChunkFile(resource.chunks, 0, 0);
        };
      }
      else {
        getChunkFile(resource.chunks, 0, 0);
      }
    }
    else {
      getChunkFile(resource.chunks, 0, 0);
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

  function getChunkFile(chunks, currentChunk, retries) {
    var chunk = chunks[currentChunk];
    var url = chunk.candidates[retries];
    var numChunks = chunks.length;
    var chunkId = chunk.digest;
    var numCandidates = chunk.candidates.length;

    console.log('chunk digest-id: ' + chunkId);
    // Create XHR
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";

    // Check for errors at network level
    xhr.onerror = function(event) {
      console.error('Error connecting to the server: ' + url + ' ' + event +
      ' Retrying with another candidate... for: ' + chunkId);
      if(retries < numCandidates) {
        console.warn('Retrying because integrity test failed: ' + chunkId);
        retries = retries + 1;
        getChunkFile(chunks, currentChunk, retries);
      } else {
        console.error('Error downloadin the file');
      }
    }

    // When start downloading
    xhr.onload = function(event) {
      console.warn('chunks: ' + chunks);
      if(xhr.status === 200) {
        var contentLength = xhr.getResponseHeader('Content-Length');
        var blob = xhr.response;
        if(checkChunkIntegrity(contentLength, blob.size, url)) {
          // Put the received blob into IndexedDB
          console.info('Inserting: ' + chunkId + ' blob: ' + blob);
          insertChunkIntoDB(chunks, blob, chunkId, currentChunk, retries, numChunks);
        } else {
          if(retries < numCandidates) {
            console.warn('Retrying because integrity test failed: ' + chunkId);
            retries = retries + 1;
            getChunkFile(chunks, currentChunk, retries);
          } else {
          console.error('chunk cannot be downloaded');
          }
        }
      } else {
        console.warn('num candidates: ' + numCandidates + ' chunk retries: ' + retries);
        if(retries < numCandidates) {
          console.warn('Retrying because not 200 status code: ' + chunkId);
          retries = retries + 1;
          getChunkFile(chunks, currentChunk, retries);
        } else {
          console.error('chunk reached maxRetries');
        }
      }
    };
    // Send XHR
    xhr.send();
  }

  function insertChunkIntoDB(chunks, blob, chunkId, currentChunk, retries, numChunks) {
    var insert = database.transaction([objectStore], IDBTransaction.READ_WRITE).objectStore(objectStore).put(blob, chunkId);
    insert.onerror = function(event) {
      console.info('Transaction: ' +chunkId+ ' failed, rolling back');
      cleanDatabase(getArrayId(chunks), 0);
    }
    insert.onsuccess = function(event) {
      console.info('Transaction: ' +chunkId+ ' success');
      currentChunk = currentChunk + 1;
      if(currentChunk < numChunks) {
        console.info('Downloading the next chunk');
        getChunkFile(chunks, currentChunk, 0);
      } else {
        console.info('Download finished');
        fetchChunksFromDB(getArrayId(chunks), 0, []);
      }
    }
  }

  function getArrayId(chunks) {
    var arrayId = [];
    chunks.forEach(function(chunk) {
      arrayId.push(chunk.digest);
    });
    return arrayId;
  }

  function fetchChunksFromDB(arrayId, index, arrayBlob) {
    var id = arrayId[index];
    console.info('Fetching: ' + id);
    database.transaction([objectStore], IDBTransaction.READ_WRITE).objectStore(objectStore).get(id).onsuccess = function(event) {
      console.info('blob #' + index + ': ' + event.target.result);
      arrayBlob.push(event.target.result);
      if(arrayBlob.length < arrayId.length) {
        index = index + 1;
        fetchChunksFromDB(arrayId, index, arrayBlob);
      } else {
        console.info(arrayBlob);
        var blobJoined = new Blob(arrayBlob);
        var urlFile = URL.createObjectURL(blobJoined);
        console.info(urlFile);
        var link = document.createElement('a');
        link.innerHTML = 'download now';
        link.type = 'application/octet-stream';
        link.download = resource.name,
        link.href = urlFile;
        document.body.appendChild(link);

        cleanDatabase(arrayId, 0);
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
