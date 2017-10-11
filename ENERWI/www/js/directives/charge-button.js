'use strict';
function chargeButton($parse, $rootScope, notificationService, $timeout) {
  var directive = {
    templateUrl: 'templates/charge-button.html',
    restrict: 'E',
    controllerAs: 'cb',
    controller: chargeButtonCtrl,
    scope: true,
    link: linkFn
  };

  return directive;

  function chargeButtonCtrl ($scope, $rootScope, chargeService) {
    var cb = this;

    init();
    return cb;

    function init() {
      $scope.service = chargeService;
      $scope.time = 0;
      chargeService.getChargingTime()
        .then(function (time) {
          if (time && time > 0) {
            $scope.time = time.toFixed();
          }
        });
    }

  }

  function linkFn(scope, element, attr){
    var e = element.children().children().children();
    var mytimeout = $timeout(onTimeout,1000);

    changeState();

    scope.onPress = function() {
      if (!scope.state) {
        $parse(attr.startCharge)(scope).then(function(result){
          scope.time = 0;
          mytimeout = $timeout(onTimeout,1000);
          changeState();
        });
      } else {
        $timeout.cancel(mytimeout);
        $parse(attr.stopCharge)(scope, {time: scope.time}).then(function(result){
          changeState();
        });
      }
    }

    function onTimeout(){
      scope.time++;
      mytimeout = $timeout(onTimeout, 1000);
    };

    function changeState() {
      if (!!scope.service.getCurrentStorePoint()) {
        e.removeClass('stop');
        scope.state = true;
      } else {
        e.addClass('stop');
        scope.state = false;
      }
    }

    $rootScope.$on('charge:stop', function () {
      e.addClass('stop');
      scope.state = false;
      notificationService.addNotification('Su recarga ha sido detenida.');
    })
  }
}

angular.module('app.directives')
  .directive('chargeButton', chargeButton);
