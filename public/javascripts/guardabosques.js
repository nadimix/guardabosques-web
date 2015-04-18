'use strict';

// Inizialization
function guardabosques (url) {
  $(document).ready(function () {
    const indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
    const IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction;
    var database;
    var resource;
    // Fetch resource.json
    getFile(url, 'json').then(function(response) {
      resource = response;
      console.log('Success!', response);
      // Open the DataBase
      return openDb();
    }).catch(function(error) {
      console.error('Failed!', error);
    }).then(function(result){
      database = result;
      console.log('Success!', result);
      // fetch the chunks
      var chunks = resource.chunks;
      return Promise.all(
        chunks.map(downloadBlobs) // Array of promises
      )
    }).then(function(blobs) {
      console.log('Success!', blobs);
      let blobJoined = new Blob(blobs);
      let urlFile = URL.createObjectURL(blobJoined);
      console.log(urlFile);
      let link = document.createElement('a');
      link.innerHTML = 'download now';
      link.type = 'application/octet-stream';
      link.download = resource.name,
      link.href = urlFile;
      document.body.appendChild(link);
    }).then(function(){
      console.info('Finished!');
    }).catch(function(error) {
      console.error('Failed!', error);
    });
  });
}

// Fetch the resource
function getFile(url, responseType, id, digest) {
  return new Promise(function(resolve, reject) {
    let req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = responseType === 'json' ? 'json' : 'blob';

    req.onload = function() {
      if(req.status == 200) {
        if(req.responseType === 'blob') {
          console.log(req.response);
          // resolve([req.response, id, digest]);
          resolve(req.response);
        } else {
          resolve(req.response);
        }
      } else {
        reject(Error(req.statusText));
      }
    };
    req.onerror = function() {
      reject(Error('Network Error'));
    };
    req.send();
  });
}

// Open Database
function openDb() {
  return new Promise(function(resolve, reject) {
    var dbName = 'guardabosques_' + Date.now();
    var dbVersion = 1.0;
    var connect = indexedDB.open(dbName, dbVersion);

    connect.onsuccess = function(event) {
      resolve(this.result);
    }
    connect.onerror = function(event) {
      reject(Error("Database Open Error"));
    }
    connect.onupgradeneeded = function(event) {
      var store = event.currentTarget.result.createObjectStore(
        dbName, { keyPath: 'id', autoIncrement: true });

      store.createIndex('chunkid', 'chunkid', { unique: true });
      store.createIndex('blob', 'blob', { unique: true });
      resolve('connect.onupgradeneeded');
    }
  });
}

// Blob download handler
function downloadBlobs(chunks) {
  return getFile(chunks.candidates[0], 'blob', chunks.id, chunks.digest);
}

// Array helper
function getArray(element) {
  return new Promise(function(resolve, reject) {
    if(candidates.length > 0) {
      resolve({
        'candidates': element.candidates,
        'id': element.id,
        'digest': element.diget
      });
    } else {
      reject(Error('No candidates'));
    }
  });
}
