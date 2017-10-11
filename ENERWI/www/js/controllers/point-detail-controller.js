'use strict';

function pointDetailController (geoService, CONFIG, $stateParams, $scope, $rootScope, chargeService, notificationService, $state) {
  var pdVm = this, latlon;

  pdVm.currentStorePoint = {};
  pdVm.isUserInStore = false;
  pdVm.isCharging = false;
  pdVm.showInfo = false;
  pdVm.showHistory = false;

  pdVm.startCharge = startCharge;
  pdVm.showInfoDetails = showInfoDetails;
  pdVm.showHistoryPane = showHistoryPane;
  pdVm.updateScreen = updateScreen;
  pdVm.getTime = getTime;
  pdVm.charges = [];

  init();
  return pdVm;

  function init () {
  	var store_id = $stateParams.pointId;
    pdVm.currentStorePoint = geoService.getStorePointById(store_id);
    latlon = {lat: pdVm.currentStorePoint.location.lat, lon: pdVm.currentStorePoint.location.lon};

    geoService.isUserInStorePoint(latlon, pdVm.currentStorePoint.store_min_distance).then(function(result) {
      pdVm.isUserInStore = result;
    })

  	var latLng = new google.maps.LatLng(pdVm.currentStorePoint.location.lat, pdVm.currentStorePoint.location.lon);

    var mapOptions = {
      center: latLng,
      zoom: CONFIG.map_zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl:false,
      zoomControl: false,
      scrollwheel: false,
      draggable: false,
      fullscreenControl: false
    };

    $scope.map = new google.maps.Map(document.getElementById("map_point"), mapOptions);

    var pinIcon = new google.maps.MarkerImage("img/pin.png", null, null, null, new google.maps.Size(30,40));

    chargeService.getHistoryStore(store_id)
      .then(function(charges) {
        pdVm.charges = charges.data;
      },
      function() {
        // TODO: Notificacion de error
      });

    google.maps.event.addListenerOnce($scope.map, 'idle', function() {
      var userCurrentPosition = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: latLng,
        icon: pinIcon
      });
    });
  }

  function startCharge() {
    if (pdVm.isUserInStore) {
    	return chargeService.startChargeInLocation(pdVm.currentStorePoint).then(function () {
        notificationService.addNotification('Su recarga ha iniciado correctamente.');
        $state.go('home');
        return true;
    	}, function() {
        notificationService.addNotification('Error al iniciar su carga, por favor intente de nuevo.', 'danger');
        return false;
      });
    }
  }

  function showInfoDetails () {
    pdVm.showInfo = !pdVm.showInfo;
  }

  function showHistoryPane () {
    pdVm.showHistory = !pdVm.showHistory;

  }

  function updateScreen () {
    geoService.isUserInStorePoint(latlon, pdVm.currentStorePoint.store_min_distance).then(function(result) {
      pdVm.isUserInStore = result;
      pdVm.currentStorePoint.distance = Math.round(geoService.getLastDistance());
      $scope.$broadcast('scroll.refreshComplete');
    });
  }

  function getTime(startDate, endDate) {
    var time = chargeService.getDatesTime(startDate, endDate);

    if (time > 0) {
      return (time / 60).toFixed(2);
    }

    return time;
  }
}

angular.module('app.controllers')
.controller('PointDetailController', pointDetailController);
