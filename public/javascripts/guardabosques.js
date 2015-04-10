'use strict';

var helper = {
  concurrency: 2,
  numRetries: 2,
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
      console.log(JSON.stringify(resource));
      downloadHandler(resource);
    },
    dataType: 'json',
    async: true
  });
}
// End resource fetch

// Download handler
function downloadHandler(resource) {
  setHelper(resource);
  console.log(JSON.stringify(helper));
  setQueue(helper);
  console.log(queue);

  // TODO gestionar queue (downloadFile(url, index))
  var i = 0;
  queue.forEach(function(url) {
    downloadFile(url, i);
    i++;
  });
}
// End download handler

// Downloads a single file into a blob
function downloadFile(url, index) {
  var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
  var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
  var dbVersion = 1.0;

  var database;

  var connect = indexedDB.open("guardabosquesDB2", dbVersion);
  var objectStore = 'chunks';

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
          console.log('true');
          getChunkFile(url, index);
        };
      }
      else {
        console.log('true');
        getChunkFile(url, index);
      }
    }
    else {
      console.log('true');
      getChunkFile(url, index);
    }
  };

  // For future use. Currently only in latest Firefox versions
  connect.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
  };
  // End IndexedDB connection handlers

  // Create/open database
  function createObjectStore (database) {
      // Create an objectStore
      console.log("Creating objectStore")
      database.createObjectStore(objectStore);
  }

  function getChunkFile(url, index) {
    // Create XHR
    var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);
    // Set the responseType to blob
    xhr.responseType = "blob";

    xhr.addEventListener("load", function () {
      if (xhr.status === 200) {
        console.log("chunk retrieved");

        // Blob as response
        var blob = xhr.response;
        console.log("Blob:" + blob + "size: " + blob.size);

        // Put the received blob into IndexedDB
        putChunkInDB(blob, index);
      }
    }, false);
    // Send XHR
    xhr.send();
  }

  function putChunkInDB(blob, index) {
    console.log("Putting elephants in IndexedDB");

    // Open a transaction to the database
    var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
    var transaction = database.transaction([objectStore], readWriteMode);

    // Put the blob into the database
    console.log('index: ' + index);
    var put = transaction.objectStore(objectStore).put(blob, index);
  }
}

// Setters
function setHelper(resource) {
  helper.concurrency = resource.concurrency || 2;
  helper.numRetries = resource.numRetries || 2; // TODO

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