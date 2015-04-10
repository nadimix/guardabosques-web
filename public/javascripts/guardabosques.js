'use strict';

function guardabosques(resourceID) {
  $(document).ready(function() {
    resourceHandler(resourceID);
  });
}

function resourceHandler(resourceID) {
  $.support.cors = true;
  $.ajax({
    type: 'GET',
    url: '/files/' + resourceID,
    success: function(data) {
      resources = data;
      console.log(JSON.stringify(resources));
    },
    dataType: 'json',
    async: true
  });
}