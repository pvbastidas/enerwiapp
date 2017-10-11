'use strict';

function promotionsDetailController ($stateParams, $scope, $rootScope, $window, CONFIG) {
  var promodtVm = this;

  promodtVm.promotion = {};


  init();
  return promodtVm;

  function init () {
    var id = $stateParams.promotionId;

    promodtVm.promotion = JSON.parse($window.localStorage.getItem('promotion'));

    try {
      var latLng = new google.maps.LatLng(promodtVm.promotion.store.location.lat, promodtVm.promotion.store.location.lon);

    } catch (e) {
      console.log('ERROR: no se pudo conseguir latLng', e);
      return;
    }

    var mapOptions = {
      center: latLng,
      zoom: CONFIG.map_zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl:false,
      zoomControl: false,
      scrollwheel: false,
      draggable: false
    };

    $scope.map = new google.maps.Map(document.getElementById("map_store"), mapOptions);

    var pinIcon = new google.maps.MarkerImage("img/pin.png", null, null, null, new google.maps.Size(30,40));

    google.maps.event.addListenerOnce($scope.map, 'idle', function() {
      var userCurrentPosition = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: latLng,
        icon: pinIcon
      });
    });
  }

}

angular.module('app.controllers')
.controller('PromotionsDetailController', promotionsDetailController);
