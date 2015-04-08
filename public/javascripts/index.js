(function() {
  'use strict';

  var resources = [];

  $(document).ready(function() {
    getListResources();
  });

  function getListResources() {
    $.support.cors = true;
    $.ajax({
      type: 'GET',
      url: '/files',
      success: function(data) {
        resources = data;
        console.log(JSON.stringify(resources));
      },
      dataType: 'json'
    });
  }
})();