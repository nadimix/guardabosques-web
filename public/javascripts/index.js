(function() {
  'use strict';

  $(document).ready(function() {
    clickResource();
  });

  function clickResource() {
    $('#resource > span').click(function(event){
      event.preventDefault();
      let resourceID =  $(this).attr('id');
      let url = '/files/' + resourceID;
      let maxDownloads = 0;
      guardabosques(url, maxDownloads);
    });
  }
})();
