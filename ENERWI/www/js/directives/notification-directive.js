'use strict';
function notification () {
  var directive = {
    templateUrl: 'templates/notification.html',
    restrict: 'E',
    controllerAs: 'nc',
    controller: notificationCtrl
  }
  return directive;

  function notificationCtrl ($scope, $rootScope, $timeout) {
    var nc = this;

    nc.new_notification = null;
    nc.type;

    nc.closeMessage = closeMessage;

    init();
    return nc;

    function init () {
      var $rootListeners = {
        newNotification: $rootScope.$on('notification', function (event, message, duration, type) {
          nc.new_notification = message;
          nc.type = type;
          $timeout(function () {
            nc.new_notification = null;
          }, duration);
        })
      };

      for (var unbind in $rootListeners) {
        $scope.$on('$destroy', $rootListeners[unbind]);
      }
    }
    function closeMessage () {
      nc.new_notification = null;
    }
  }
}
angular.module('app.directives')
.directive('notification', notification)
