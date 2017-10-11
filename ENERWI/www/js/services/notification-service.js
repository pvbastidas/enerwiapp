'use strict';
angular.module('app.services')
.service('notificationService', function ($rootScope, CONFIG) {

  return {
    addNotification: addNotification
  };

  function addNotification (message, type, duration) {
    var d = duration || CONFIG.duration_notification;
    $rootScope.$emit('notification', message, d, type);
  }

});
