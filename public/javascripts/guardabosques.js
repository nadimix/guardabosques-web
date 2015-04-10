'use strict';

function guardabosques(url) {
  $(document).ready(function() {
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
    },
    dataType: 'json',
    async: true
  });
}
// End resource fetch

// Chunk download logic
function downloadHandler(resource) {
  var concurrency = resource.concurrency;

}
// end chunck download logic