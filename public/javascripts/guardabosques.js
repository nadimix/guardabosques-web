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
}
// End download handler

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