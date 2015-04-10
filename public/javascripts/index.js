(function() {
  'use strict';

  $(document).ready(function() {
    clickResource();
  });

  function clickResource() {
    $('#resource > span').click(function(){
      var resourceID =  $(this).attr('id');
      console.log(resourceID);
      guardabosques(resourceID);
    });
  }
})();