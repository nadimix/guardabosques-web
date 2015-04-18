'use strict';

// Inizialization
function guardabosques (url) {
  $(document).ready(function () {
    var resource;
    var blobs = [];
    // Fetch resource.json
    getFile(url, 'json').then(function(response) {
      resource = response;
      console.log('Success!', response);
      var chunks = resource.chunks;
      return chunks.map(downloadBlobs).reduce(function(sequence, blobPromise) {
        return sequence.then(function() {
          return blobPromise;
        }).catch(function(error) {
          console.error('Failed!', error);
        }).then(function(blob) {
          blobs.push(blob);
          console.log('blob', blob);
        }, function(err) {
          console.error(err);
        });
      }, Promise.resolve());
    }).catch(function(error) {
      console.error('Failed!', error);
    }).then(function() {
      console.log('Success!', blobs);
      // Join the array of blobs into a new blob
      return joinBlobs(blobs);
    }).then(function(blob) {
      console.log('Success!', blob);
      // generate the blob Url and append it to the page
      var url = URL.createObjectURL(blob);
      return appendBlobURL(url, resource.name);
    }).then(function() {
      console.info('Finished!');
    }).catch(function(error) {
      console.error('Failed!', error);
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
        if(numCandidates > 0 && numCandidates > retries) {
          console.warn('Retrying ' + retries, resource);
          resolve(getFile(resource, responseType, retries));
        } else {
          reject(Error(req.statusText));
        }
      }
    };
    req.onerror = function() {
      // Retry if possible
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
    link.download = name,
    link.href = url;
    document.body.appendChild(link);
    resolve();
  });
}
