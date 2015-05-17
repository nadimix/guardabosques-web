(function() {
  'use strict';

  $(document).ready(function() {
    clickResource();
  });

  function clickResource() {
    $('.resource').find('> td').find('> button').click(function(event){
      event.preventDefault();
      var url = 'https://46.101.48.218:4430/';
      switch ($(this).attr('id')) {
        case "h11":
          url = url + 'h11/';
          break;
        case "h2":
          url = url + 'h2/';
          break;
        case "s31":
          url = url + 's31/';
          break;
        default:
          url = '';
          console.error('bad request');
          break;
      }
      var resourceID =  $(this).parent().parent().attr('id');
      url = url + resourceID;
      console.info('URL', url);
      var maxDownloads = 1;
      guardabosques(url, maxDownloads);
    });
  }
})();
