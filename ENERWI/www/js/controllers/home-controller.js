'use strict';

function homeController ($scope, $window, leafletData, CONFIG, geoService, notificationService, $ionicPlatform, chargeService, $state, $ionicPopup) {
  var hcVm = this;

  hcVm.userCurrentPosition;
  hcVm.gpsEnabled = true;
  hcVm.title;
  hcVm.isUserCharging = false;
  hcVm.currentStorePoint;
  hcVm.isChargeFinished = false;
  hcVm.weHavePoints = true;

  hcVm.init = init;
  hcVm.centerToCurrentLocation = centerToCurrentLocation;
  hcVm.stopCharge = stopCharge;
  hcVm.startCharge = startCharge;
  hcVm.goToMap = goToMap;
  hcVm.updateScreen = updateScreen;

  init();

  return hcVm;

  function init() {
    hcVm.title = 'Mapa';

    var currentPosition;

    $ionicPlatform.ready(function () {
      hcVm.currentStorePoint = chargeService.getCurrentStorePoint();
      hcVm.isUserCharging = !!hcVm.currentStorePoint;
      hcVm.title = hcVm.isUserCharging ? 'Cargando' : 'Mapa';
      hcVm.weHavePoints = true;
      hcVm.gpsEnabled = true;

      if($window.cordova && $window.cordova.plugins) {
        $window.cordova.plugins.diagnostic.isLocationEnabled(function (gpsEnabled) {
          if (gpsEnabled) {
            enableGps();
          } else {
            hcVm.gpsEnabled = false;
          }
        }, function() {
          notificationService.addNotification('Ha ocurrido un inconvniente obteniendo su localización.', 'danger');
        });
      } else {
        // assume we are in chrome web
        enableGps();
      }
    });
  }

  function enableGps(){
    geoService.getCurrentLocation().then(function(position) {
      drawMap(position);
    }, function (error) {
      if (error === 'PERMISSION_DENIED') {
        hcVm.gpsEnabled = false;
      }
    });
  }

  function centerToCurrentLocation() {
    notificationService.addNotification('Obteniendo su localización.');
    var currentPosition;
    var lastLocation = geoService.getLastLocation();
    var latlonLastLocation = {lat: lastLocation.coords.latitude, lon: lastLocation.coords.longitude};
    geoService.getCurrentLocation().then(function(position) {
      currentPosition = position;
      var lastLonCurrent = {lat: currentPosition.coords.latitude, lon: currentPosition.coords.longitude};
      if (geoService.getDistances(latlonLastLocation, lastLonCurrent) > CONFIG.min_distance_for_store) {
        drawMap(currentPosition);
      } else {
        var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        hcVm.userCurrentPosition.setPosition(initialLocation);
        $scope.map.setCenter(initialLocation);
      }
    });
  }

  function exec(currentPosition, nearestPoints, allEnerwiPoints) {
    $scope.nearestPoints = nearestPoints;

    var allReachablePoints = [{lat:currentPosition.coords.latitude, lon:currentPosition.coords.longitude}];

    var latLng = new google.maps.LatLng(currentPosition.coords.latitude, currentPosition.coords.longitude);

    var mapOptions = {
      center: latLng,
      zoom: CONFIG.map_zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl:false,
      zoomControl: false,
      fullscreenControl: false
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    google.maps.event.addListenerOnce($scope.map, 'idle', function() {
      var markers = [];
      var reachableMarkers = [];

      var userIcon = new google.maps.MarkerImage("img/user.png", null, null, null, new google.maps.Size(30,30));
      var pinIcon = new google.maps.MarkerImage("img/pin.png", null, null, null, new google.maps.Size(30,40));

      hcVm.userCurrentPosition = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: latLng,
        icon: userIcon
      });

      markers.push(hcVm.userCurrentPosition);

      _.forEach(allEnerwiPoints, function(e){
        var latLng2 = new google.maps.LatLng(e.location.lat, e.location.lon);
        var m = new google.maps.Marker({
          map: $scope.map,
          animation: google.maps.Animation.DROP,
          position: latLng2,
          icon: pinIcon,
        });

        var image = e.image.url ? e.image.url : 'img/store_image_default.png';
        var infowindow = new google.maps.InfoWindow({
          content: '<div id="content">'+
            '<h4>'+ e.name +'</h4>'+
            '<div class="row">' +
            '<div class="col-20"><a href="#/points/' + e.id + '"><img class="popup-image" src=' + image + '></img></a></div>' +
            '<p class="col-70 container-align-center">' + e.address + '</p>' +
            '<div class="col-10 container-align-center"> <a href="#/points/' + e.id + '"><img class="popup-icon" src="img/chevronRight.png"></img></a></div>' +
            '</div>'+
            '</div>'
        });

        m.addListener('click', function() {
          infowindow.open(map, m);
          infowindow.setPosition()
        });

        markers.push(m);

        if(_.find(nearestPoints, {'id': e.id})){
          allReachablePoints.push({lat: e.location.lat, lon: e.location.lon});
          reachableMarkers.push(m);
        }
      });

      var bounds = (reachableMarkers.length > 0) ? createBoundsForMarkers(reachableMarkers) : null;

      if (bounds && (geoService.getAvgDistance(allReachablePoints) > CONFIG.min_distance_zoom)) {
        $scope.map.fitBounds(bounds);
      }
    });

    if (isUserInStore(nearestPoints) && !hcVm.isUserCharging) {
      showConfirmModal(nearestPoints[0]);
    }
  }

  function drawMap(currentPosition) {
    var latLon = {lat: currentPosition.coords.latitude, lon: currentPosition.coords.longitude};
    var allEnerwiPoints;

    geoService.getAllEnerwiPoints(latLon)
      .then(function(aewp){
        allEnerwiPoints = aewp;
        return geoService.getNearestChargingPoints(latLon, CONFIG.threshold || 1000);
      })
      .then(function(nearestPoints){
        if(!nearestPoints.length){
          geoService.getNearestChargingPoints(latLon, CONFIG.max_threshold)
            .then(function(somePoints){
              if (somePoints.length === 0){
                hcVm.weHavePoints = false;
              }
              exec(currentPosition, somePoints, allEnerwiPoints);
            });
        }else{
          exec(currentPosition, nearestPoints, allEnerwiPoints);
        }
    });
  }

  function getBoundsZoomLevel(bounds, mapDim) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
      var sin = Math.sin(lat * Math.PI / 180);
      var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  }

  function createMarkerForPoint(point) {
    return new google.maps.Marker({
      position: new google.maps.LatLng(point.lat, point.lng)
    });
  }

  function createBoundsForMarkers(markers) {
    var bounds = new google.maps.LatLngBounds();
    _.forEach(markers, function(e) {
      bounds.extend(e.getPosition());
    });
    return bounds;
  }

  function stopCharge(time) {
    hcVm.chargingTime = time;
    return chargeService.stopChargeInLocation(hcVm.currentStorePoint.id).then(function() {
      notificationService.addNotification('Su carga ha sido detenida.');
      hcVm.isChargeFinished = true;
      return true;
    },
    function() {
      notificationService.addNotification('Error al detener su carga, por favor intente de nuevo.', 'danger');
      return false;
    });
  }


  function startCharge() {
    return chargeService.startChargeInLocation(hcVm.currentStorePoint).then(function () {
      notificationService.addNotification('Su recarga ha iniciado correctamente.');
      return true;
    }, function() {
      notificationService.addNotification('Error al iniciar su carga, por favor intente de nuevo.', 'danger');
      return false;
    });
  }

  function goToMap () {
    init();
  }

  function updateScreen () {
    init();
    $scope.$broadcast('scroll.refreshComplete');
  }

  function isUserInStore (nearestPoints) {
    var store = nearestPoints.length > 0 ? nearestPoints[0] : undefined;
    return store && (parseFloat(store.distance) <= (store.store_min_distance || CONFIG.min_distance_for_store));
  }

  function showConfirmModal(currentStore) {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Punto de carga disponible',
      template: 'Usted está en el punto de carga ' + currentStore.name + ' desea iniciar la carga ahora?',
      cancelText: 'No',
      okText: 'Si'
    });

    confirmPopup.then(function(response) {
      if(response) {
        hcVm.currentStorePoint = currentStore;
        startCharge().then(function () {
          hcVm.isUserCharging = true;
        });
      }
    });
  }
}

angular.module('app.controllers')
.controller('HomeController', homeController);
