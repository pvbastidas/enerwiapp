'use strict';
angular.module('app.services')
  .service('chargeService',
    function ($q, $window, CONFIG, $http, loginService, $cordovaDevice, $interval, geoService, $rootScope) {

      var lastLocation, promise, payload = {}, startChargingDate = null;
      var locationCheckLogs = 0;

      return {
        startChargeInLocation: startChargeInLocation,
        stopChargeInLocation: stopChargeInLocation,
        getCurrentChargeLocation: getCurrentChargeLocation,
        getHistory: getHistory,
        getHistoryStore: getHistoryStore,
        getCurrentStorePoint: getCurrentStorePoint,
        getDatesTime: getDatesTime,
        getChargingTime: getChargingTime
      };

      function postToService(action, store_id) {
        var uuid = $window.ionic.Platform.platform() === 'macintel' ? 'testuuid': $cordovaDevice.getUUID();
        var headers = {
          'Authorization': 'Bearer ' + loginService.getUser()['accessToken']
        };

        payload._id = loginService.getUser()['_id'];
        payload.device_id = uuid;
        payload.store_id = store_id;

        return $http.post(CONFIG.track_charge_url + action, payload, { headers: headers });
      }

      function checkLocation(tolerance) {
        lastLocation = geoService.getLastLocation();
        var latlon = {lat: lastLocation.coords.latitude, lon: lastLocation.coords.longitude};
        geoService.isUserInStorePoint(latlon, tolerance).then(function(result) {
          var cancel = false;
          if (CONFIG.check_location_num && !result){
            if(locationCheckLogs < CONFIG.check_location_num){
              locationCheckLogs += 1;
            }else{
              cancel = true;
              locationCheckLogs = 0;
            }
          }

          if (cancel) {
            $interval.cancel(promise);
            stopChargeInLocation(payload.store_id).then(function() {
              $rootScope.$emit('charge:stop');
            });
          }
        });

        // Enviar el ack
        var currentStorePoint = getCurrentStorePoint();

        if (currentStorePoint) {
          postToService('/start', currentStorePoint.id).then(function(response) {
            console.log('Enviado ', JSON.stringify(response));
          });
        }
      }

      function getCurrentChargeLocation(){
        var currentChargeLocation = geoService.getLastLocation();
        return lastLocation || currentChargeLocation;
      }

      function startChargeInLocation(store){
        // set the interval
        return postToService('/start', store.id).then(function() {
          startChargingDate = new Date();
          $window.localStorage.setItem('currentStorePoint', JSON.stringify(store));
          promise = $interval(function(){
            checkLocation(store.store_min_distance);
          }, CONFIG.check_location_time || 60000);
        });
      }

      function stopChargeInLocation(store_id){
        return postToService('/stop', store_id).then(function() {
          startChargingDate = null;
          $window.localStorage.removeItem('currentStorePoint');
          $interval.cancel(promise);
        });
      }

      function getHistory(page, limit) {
        var access_token = loginService.getUser()['accessToken'];
        var _id = loginService.getUser()['_id'];

        var headers = {
          'Authorization': 'Bearer ' + access_token
        };

        return $http.get(
          CONFIG.track_charge_url + _.join(
            ['/history', page || 1, limit || 10, _id], '/'),
          { headers: headers });
      }

      function getHistoryStore(store_id) {
        var access_token = loginService.getUser()['accessToken'];
        var _id = loginService.getUser()['_id'];

        var headers = {
          'Authorization': 'Bearer ' + access_token
        };

        return $http.get(
          CONFIG.track_charge_url + _.join(
            ['/history_by_store', _id, store_id], '/'),
          { headers: headers });
      }

      function getCurrentStorePoint () {
        return JSON.parse($window.localStorage.getItem('currentStorePoint'));
      }

      function getChargingTime() {
        var currentStorePoint = getCurrentStorePoint();

        if (currentStorePoint && !startChargingDate) {
          return postToService('/current', currentStorePoint.id).then(function(currentCharge) {
             return getDatesTime(currentCharge.data.startDate, new Date());
          }, function() {
            // Si no hay carga en progreso debemos detener el charge button
            $rootScope.$emit('charge:stop');
            startChargingDate = null;
            $window.localStorage.removeItem('currentStorePoint');
          });
        } else {
          var time = getDatesTime(startChargingDate, new Date());
          return $q.when(time);
        }
      }

      function getDatesTime(startDate, endDate) {
        if (startDate && endDate) {
          var diff = new Date(endDate).getTime() - new Date(startDate).getTime();
          return diff / 1000;
        }

        return 0;
      }
});
