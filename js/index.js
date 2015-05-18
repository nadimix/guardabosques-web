(function() {
  'use strict';

  $(document).ready(function() {
    var url = 'https://localhost:4430/resources/';
    getManifest(url).then(addResources, onError);
  });

  function addResources(data) {
    console.info(JSON.stringify(data));
    var tbody = $("tbody");
    data.forEach(function(resource) {
      var row = getRow(resource);
      console.log(row);
      tbody.append(row);
    });
    clickResource();
  }

  function onError(error) {
    console.error(error);
  }

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
    row = row + '</tr>';
    return row;
  }

  function getManifest(url) {
    return new Promise(function(resolve, reject) {
      var req;
      req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'json';
      req.onload = function() {
        if (req.status === 200) {
          resolve(req.response);
        } else {
          reject(Error(req.statusText));
        }
      };
      req.onerror = function() {
        reject(Error('Network Error'));
      };
      req.send();
    });
  }

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
