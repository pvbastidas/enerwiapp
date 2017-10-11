'use strict';

function pointsController (geoService, CONFIG, notificationService) {
  var pVm = this;

  pVm.points = [];

  init();

  return pVm;

  function init () {
    var lastLocation = geoService.getLastLocation();
    if (lastLocation && lastLocation.coords) {
      var latlon = {lat: lastLocation.coords.latitude, lon: lastLocation.coords.longitude};
      geoService.isUserInStorePoint(latlon).then(function(result) {

        var lastNearestChargingPoints = geoService.getLastNearestChargingPoints();
        if (result && lastNearestChargingPoints) {
          pVm.points = lastNearestChargingPoints;
        } else {
          getStorePoints(latlon);
        }
      });
    } else {
      geoService.getCurrentLocation().then(function(location) {
        var latlon = {lat: location.coords.latitude, lon: location.coords.longitude};
        getStorePoints(latlon);
      });
    }
  }

  function getStorePoints(latlon) {
    geoService.getNearestChargingPoints(latlon, CONFIG.threshold)
      .then(function (data) {
        pVm.points = data;
      },
      function() {
        notificationService.addNotification('Por favor intente de nuevo.', 'danger');
      });
  }
}

angular.module('app.controllers')
.controller('pointsController', pointsController);
