(function() {
  'use strict';
  var api = 'https://46.101.48.218:4430';
  $(document).ready(function() {
    var url = api + '/resources/';
    getManifest(url);
  });

  // Gets the Manifests in JSON
  function getManifest(url, resource) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'json';
    req.onload = function() {
      if (req.status === 200) {
        var json = req.response;
        if(resource) {
          var maxDownloads = 0;
          guardabosques(json, maxDownloads, resource);
        } else {
          addResources(json);
        }
      } else {
        console.error(Error('XMLHttpRequest Error: ' + req.statusText));
      }
    };
    req.onerror = function() {
      console.error(Error('Network Error'));
    };
    req.send();
  }

  // Adds the resources to the content table
  function addResources(data) {
    var tbody = $("tbody");
    data.forEach(function(resource) {
      var row = getRow(resource);
      tbody.append(row);
    });
    clickResource();
  }

  // When click in a resource gets the respective url regarding the protocol
  function clickResource() {
    $('.resource').on('click', 'button', function(event){
      event.preventDefault();
      var url = api + '/resource/';
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
          console.error(Error('bad request'));
          break;
        }
        var resource =  $(this).closest('.resource');
        resource.addClass('downloading');
        resource.find('button').prop('disabled', true);
        url = url + resource.attr('id');
        getManifest(url, resource);
      });
  }

  // Auxiliar function
  function getRow(resource) {
    var row = '<tr class="resource" id="'+resource.id+'"><td class="col-md-5" id="link">'+resource.name+'</td>';
    resource.protocols.forEach(function(protocol) {
      row = row + '<td class="col-md-1"><button type="button" id="';
      switch(protocol){
        case "h11":
          row = row + 'h11" class="btn btn-xs btn-default">HTTP/1.1';
        break;
        case "s31":
          row = row + 's31" class="btn btn-xs btn-success">SPDY/3.1';
        break;
        case "h2":
          row = row + 'h2" class="btn btn-xs btn-primary">HTTP/2';
        break;
      }
      row = row + '</button></td>';
    });
    row = row + '<td class="col-md-1 download"></td></tr>';
    return row;
  }

})();