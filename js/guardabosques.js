'use strict';

// Global variables
var queue;
var blobs;
var filename;
var htmlResource;

// Main function
function guardabosques(json, maxDownloads, resource) {
  blobs = [];
  queue = json.chunks;
  filename = json.name;
  htmlResource = resource;
  downloadHandler(maxDownloads);
}

// Download management
function downloadHandler(maxDownloads) {
  var numChunks = queue.length;
  if (maxDownloads === 0 || maxDownloads > numChunks) {
    maxDownloads = numChunks;
  }
  console.info('Downloading: ' + numChunks + ' with ' + maxDownloads + ' concurrences');
  for (var i = 0; i < maxDownloads; i++) {
    getChunks(numChunks, 0, false);
  }
}

// Chunks download
function getChunks(numChunks, retries, resourceToRetry) {
  var req = new XMLHttpRequest();
  if (queue.length > 0 || retries > 0) {
    // Sets the resource depending on if its a retransmission or not.
    var resource = retries > 0 ? resourceToRetry : queue.shift();
    var id = resource.id;
    var url = resource.candidates[retries];
    var numCandidates = resource.candidates.length;
    console.log('Remaining... ', queue.length + 1);
    console.log('Downloading', resource);
    req.open('GET', url, true);
    req.responseType = 'blob';
    req.onload = function () {
      if (req.status === 200) {
        var chunk = {
          id: id,
          blob: req.response
        };
        blobs.push(chunk);
        getChunks(numChunks, 0, null);
      } else {
        // Retry if possible
        retries = retries + 1;
        if (numCandidates > 0 && numCandidates > retries) {
          console.warn('Retrying ' + retries, resource);
          getChunks(numChunks, retries, resource);
        } else {
          console.error(Error(req.statusText));
        }
      }
    };
    req.onerror = function () {
      // Retry if possible
      retries = retries + 1;
      if (numCandidates > 0 && numCandidates > retries) {
        console.warn('Retrying ' + retries, resource);
        getChunks(numChunks, retries, resource);
      } else {
        console.error(Error('Network Error'));
      }
    };
    req.send();
  } else if (blobs.length === numChunks) {
    console.info('All chunks have been downloaded');
    var fileBlob = joinChunks(blobs);
    var urlBlob = URL.createObjectURL(fileBlob);
    console.log(urlBlob);
    appendBlobURL(urlBlob, filename);
  }
}

function joinChunks(chunks) {
  var destBlobs = [];
  for (var i = 0; i < chunks.length; i++) {
    destBlobs[chunks[i].id] = chunks[i].blob;
  }
  return new Blob(destBlobs);
}

// Appends the blob Url to a download link into the page
function appendBlobURL(url, name) {
  var link = document.createElement('a');
  link.innerHTML = 'download now';
  link.type = 'application/octet-stream';
  link.download = name;
  link.href = url;
  htmlResource.find('.download').append(link);
  htmlResource.find('button').prop('disabled', false);
}