(function() {
  'use strict';

  $(document).ready(function() {
    clickResource();
  });

  function clickResource() {
    $('#resource > span').click(function(event){
      event.preventDefault();
      var resourceID =  $(this).attr('id');
      console.log(resourceID);
      var url = '/files/' + resourceID;
      guardabosques(url);
    });
  }
})();