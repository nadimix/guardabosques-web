(function() {
  'use strict';

  var resources = [];

  var resource = {
    id: '',
    name: '',
    length: '',
    candidates: []
  };

  $(document).ready(function() {
    resourceHandler();
  });

  function resourceHandler() {
    $.support.cors = true;
    $.ajax({
      type: 'GET',
      url: '/files',
      success: function(data) {
        resources = data;
        console.log(JSON.stringify(resources));
        listResources();
        clickResourceHandler();
      },
      dataType: 'json',
      async: true
    });
  }

  function listResources() {
    resources.forEach(function(resource){
      console.log(resource.name);
      $('#resources').append('<li id="resource">'+resource.name+': <span class="resource_link" id="'+resource.id+'">download</span></li>');
    });
  }

  function clickResourceHandler() {
    $('#resource > span').click(function(){
      cleanResource();
      resource.id = $(this).attr('id');
      setResource(resource);
    });
  }

  function setResource(resource) {
    resources.forEach(function(res){
      if(res.id === resource.id) {
        resource.name = res.name;
        resource.candidates = res.candidates;
        getLength(resource);
      }
    });
  }

  function getLength(resource) {
    $.ajax({
      type: 'HEAD',
      url: resource.candidates[0].url,
      success: function(data, textStatus, jqXHR) {
        resource.length = jqXHR.getResponseHeader('Content-Length');
      }
    });
  }

  function cleanResource() {
    resource = {
      id: '',
      name: '',
      length: '',
      candidates: []
    };
  }
})();