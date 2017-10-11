'use strict';
function smartButton() {
  var directive = {
    templateUrl: 'templates/smart-button.html',
    restrict: 'E',
    controllerAs: 'sb',
    controller: smartButtonCtrl,
    replace: true,
    scope: {
      icon: "@",
      name: "@",
      path: "@"
    }
  }
  return directive;

  function smartButtonCtrl ($scope, $rootScope, $timeout, $state) {
    var sb = this;
    sb.active = false;
    sb.path = $scope.path;
    sb.name = $scope.name;

    sb.onPress = onPress;

    init();
    return sb;

    function init() {
      if($state.current.name === $scope.path){
        sb.active = true;
        sb.img = $scope.icon + "-alt";
      }else{
        sb.active = false;
        sb.img = $scope.icon;
      }
    }

    function onPress () {
      $state.go(sb.path);
    }
  }
}

angular.module('app.directives')
  .directive('smartButton', smartButton);
