'use strict';

function appController ($ionicSideMenuDelegate,
                        $scope,
                        $rootScope,
                        loginService,
                        $state,
                        $ionicModal,
                        CONFIG,
                        $ionicActionSheet,
                        $window,
                        $cordovaAppVersion,
                        $ionicPlatform) {
  var appVm = this;

  appVm.user;
  appVm.openMenu = openMenu;
  appVm.batteryLevel;
  appVm.checkLocationNum;
  appVm.threshold;
  appVm.isFromOptions;
  appVm.changeDistance;

  appVm.logout = logout;
  appVm.verProfile = verProfile;
  appVm.closeProfile = closeProfile;
  appVm.openTermsModal = openTermsModal;
  appVm.closeTermsModal = closeTermsModal;
  appVm.openAboutModal = openAboutModal;
  appVm.closeAboutModal = closeAboutModal;
  appVm.closeDebugModal = closeDebugModal;
  appVm.changeCheckLocationNum = changeCheckLocationNum;
  appVm.showDebugModal = showDebugModal;
  appVm.goToHelp = goToHelp;
  appVm.changeThreshold = changeThreshold;

  _.assign(appVm, {
    support: CONFIG.support || 'info@pupilabox.net.ec',
    debugMode: CONFIG.debug || false
  });

  init();

  return appVm;

  function init () {
    appVm.user = loginService.getUser();
    registerRootListeners();
    setBatteryLevel();

    $ionicModal.fromTemplateUrl('templates/user.html', {
      scope: $scope,
      animation: 'slide-in-up',
    }).then(function (modal) {
      $scope.userModal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/terms.html', {
      scope: $scope,
      animation: 'slide-in-up',
    }).then(function (modal) {
      $scope.termsModal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/about.html', {
      scope: $scope,
      animation: 'slide-in-up',
    }).then(function (modal) {
      $scope.aboutModal = modal;
    });

    $ionicModal.fromTemplateUrl('templates/debug.html', {
      scope: $scope,
      animation: 'slide-in-up',
    }).then(function (modal) {
      $scope.debugModal = modal;
    });

    appVm.checkLocationNum = CONFIG.check_location_num;
    appVm.threshold = CONFIG.threshold / 1000;

    $ionicPlatform.ready(function () {
      if ($window.ionic.Platform.platform() !== 'macintel') {
        $cordovaAppVersion.getVersionNumber().then(function (version) {
          appVm.appVersion = version;
        });

        $cordovaAppVersion.getVersionCode().then(function (build) {
           appVm.appBuild = build;
        });
      }
    });
  }

  function openMenu () {
    $ionicSideMenuDelegate.toggleRight();
  }

  function registerRootListeners () {
    var $rootListeners = {
      loginSucess: $rootScope.$on('login:success', function () {
        appVm.user = loginService.getUser();
      })
    };

    for (var unbind in $rootListeners) {
      $scope.$on('$destroy', $rootListeners[unbind]);
    }
  }

  function logout () {
    loginService.logout();
    appVm.user = null;
    $state.go('login');
  }

  function verProfile () {
    $scope.userModal.show();
  }

  function closeProfile () {
    $scope.userModal.hide();
  }

  function openTermsModal () {
    $ionicSideMenuDelegate.toggleRight();
    $scope.termsModal.show();
  }

  function closeTermsModal () {
    $scope.termsModal.hide();
  }

  function openAboutModal () {
    $scope.aboutModal.show();
  }

  function showDebugModal (req) {
    if(req==='localStorage'){
      appVm.debugInfo =  $window.localStorage;
    }
    $scope.debugModal.show();
  }

  function closeDebugModal () {
    $scope.debugModal.hide();
  }

  function closeAboutModal () {
    $scope.aboutModal.hide();
  }

  function setBatteryLevel () {
    appVm.batteryLevel = $window.localStorage.getItem('batteryLevel') || 100;
  }

  function changeCheckLocationNum(){
    CONFIG.check_location_num = appVm.checkLocationNum;
  }

  function goToHelp(){
    $ionicSideMenuDelegate.toggleRight();
    appVm.isFromOptions = true;
    $state.go('help');
  }

  function changeThreshold() {
    CONFIG.threshold = appVm.threshold * 1000;
  }
}

angular.module('app.controllers')
  .controller('AppController', appController);
