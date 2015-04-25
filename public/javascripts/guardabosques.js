'use strict';

let queue;
let destination = [];
let finished;

// Inizialization
function guardabosques (url, maxDownloads) {
  $(document).ready(function () {
    var resource;
    var blobs = [];
    // Fetch resource.json
    getFile(url, 'json').then(function(response) {
      console.log('Success!', response);
      queue = response.chunks;
      var fileName = response.name;
      return downloadService(maxDownloads, fileName);
    });
  });
}

// Fetch the resource
function getFile(resource, responseType, retries) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    var numCandidates = 0;
    var url;
    var id;
    if(responseType === 'blob') {
      id = resource.id;
      url = resource.candidates[retries];
      req.responseType = responseType;
      numCandidates = resource.candidates.length;
    } else {
      url = resource;
      req.responseType = 'json';
    }
    req.open('GET', url);

    req.onload = function() {
      if(req.status == 200) {
          resolve(req.response);
      } else {
        // Retry if possible
        retries = retries + 1;
        if (numCandidates > 0 && numCandidates > retries) {
          console.warn('Retrying ' + retries, resource);
          resolve(getFile(resource, responseType, retries));
        } else {
          reject(Error(req.statusText));
        }
      }
    };
    req.onerror = function() {
      retries = retries + 1;
      if(numCandidates > 0 && numCandidates > retries) {
        console.warn('Retrying ' + retries, resource);
        resolve(getFile(resource, responseType, retries));
      } else {
        reject(Error('Network Error'));
      }
    };
    req.send();
  });
}

function downloadService(maxDownloads, fileName) {
  let activeDowns = 0;
  let finished = false;
  let numChunks = queue.length;
  console.log(resource);
  if (maxDownloads === 0 || maxDownloads > numChunks) {
    maxDownloads = numChunks;
  }
  console.log('Num Chunks to download: ' + numChunks + ' concurrents: ' + maxDownloads);
  for (let i = 0; i < maxDownloads; i++) {
    getFileNotPromised('blob', 0, numChunks, false, fileName);
  }
}

function joinChunks(chunks) {
  console.log('chunks', chunks);
  let blobs = [];
  for (let i = 0; i < chunks.length; i++) {
    blobs[chunks[i].id] = chunks[i].blob;
  }
  return new Blob(blobs);
}

// Fetch the resource
function getFileNotPromised(responseType, retries, numChunks, retry, fileName) {
  let req = new XMLHttpRequest();
  let numCandidates = 0;
  let url;
  let id;
  let resource;
  console.log('destination.length', destination.length);
  if (queue.length > 0) {
    if (responseType === 'blob' && !retry) {
      resource = queue.shift();
      console.log('resource', resource);
      console.log('queue', queue);
      id = resource.id;
      url = resource.candidates[retries];
      req.responseType = responseType;
      numCandidates = resource.candidates.length;
    } else if (responseType === 'blob' && retry) {
      resource = queue;
      id = resource.id;
      url = resource.candidates[retries];
      req.responseType = responseType;
      numCandidates = resource.candidates.length;
    } else {
      url = queue;
      req.responseType = 'json';
    }
    req.open('GET', url);

    req.onload = function() {
      if (req.status == 200) {
        let chunk = {
          id: id,
          blob: req.response
        }
        destination.push(chunk);
        getFileNotPromised(responseType, retries, numChunks, false, fileName);
      } else {
        // Retry if possible
        retries = retries + 1;
        if(numCandidates > 0 && numCandidates > retries) {
          console.warn('Retrying ' + retries, resource);
          getFileNotPromised(responseType, retries, numChunks, true, fileName);
        } else {
          console.error(Error(req.statusText));
        }
      }
    };
    req.onerror = function() {
      // Retry if possible
      retries = retries + 1;
      if (numCandidates > 0 && numCandidates > retries) {
        console.warn('Retrying ' + retries, resource);
        getFileNotPromised(responseType, retries, numChunks, true, fileName);
      } else {
        console.error(Error('Network Error'));
      }
    };
    req.send();
  } else if (destination.length === numChunks) {
    finished = true;
    console.info('All chunks has been downloaded');
    let fileBlob = joinChunks(destination);
    console.log('Joint blob', fileBlob);
    let url = URL.createObjectURL(fileBlob);
    appendBlobURL(url, fileName);
  }
}

// Blob download handler
function downloadBlobs(chunks) {
  return getFile(chunks, 'blob', 0);
}

// Create a blob representation of the original file
function joinBlobs(blobs) {
  return new Promise(function(resolve, reject) {
    var blob = new Blob(blobs);
    if (blob) {
      resolve(blob);
    } else {
      reject(Error("Couldn't join the downloaded blobs"));
    }
  });
}

// Appends the blob Url to a download link into the page
function appendBlobURL(url, name) {
  return new Promise(function(resolve, reject) {
    var link = document.createElement('a');
    link.innerHTML = 'download now';
    link.type = 'application/octet-stream';
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    resolve();
  });
}
