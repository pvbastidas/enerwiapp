// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('app.controllers', [])
angular.module('app.services', [])
angular.module('app.constants', [])
angular.module('app.directives', [])

angular.module('app', [
  'ionic',
  'ngCordova',
  'ngCordovaOauth',
  'app.controllers',
  'app.services',
  'app.constants',
  'app.directives',
  'ui-leaflet',
  'elasticsearch'
  ])

.run(function($ionicPlatform, $rootScope, loginService, $state, $window, $cordovaBatteryStatus, $location) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    ionic.Platform.isFullScreen = true;
  });

  document.addEventListener("deviceready", function () {
    $rootScope.$on('$cordovaBatteryStatus:status', function (e, result) {
      var batteryLevel = result.level;       // (0 - 100)

      console.log('batteryLevel >', batteryLevel);
      $window.localStorage.setItem('batteryLevel', batteryLevel);
    });
  }, false);

  $rootScope.$on('$stateChangeSuccess', function (event, previous, next) {
    if(loginService.isSignedIn()) {
      if (previous.name === 'login') {
        $state.go('home');
      }
    } else {
      var currentRoute = $location.path();
      loginService.routeRequiresLogin(currentRoute);
    }
  });
})

.filter('formatTimer', function() {
  return function(input)
  {
    function z(n) {return (n<10? '0' : '') + n;}
    var seconds = input % 60;
    var minutes = Math.floor(input / 60);
    var hours = Math.floor(minutes / 60);
    return (z(hours) +':'+z(minutes)+':'+z(seconds));
  };
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, CONFIG) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js

  $ionicConfigProvider.backButton.text('');

  $stateProvider

  .state('home', {
    url: '/home',
    cache: false,
    templateUrl: 'templates/home.html',
    controller: 'HomeController as hcVm'
  })
  .state('points', {
    url: '/points',
    cache: false,
    templateUrl: 'templates/points.html',
    controller: 'pointsController as pVm'
  })
  .state('point-detail', {
    url: '/points/:pointId',
    templateUrl: 'templates/point-detail.html',
    controller: 'PointDetailController as pdVm'
  })
  .state('history', {
    cache: false,
    url: '/history',
    templateUrl: 'templates/history.html',
    controller: 'HistoryController as historyVm'
  })
  .state('promotions', {
    url: '/promotions',
    templateUrl: 'templates/promotions.html',
    controller: 'PromocionesController as promoVm'
  })
  .state('promotion-detail', {
    url: '/promotions/:promotionId',
    templateUrl: 'templates/promotion-detail.html',
    controller: 'PromotionsDetailController as promodtVm'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginController as lc'
  })
  .state('more', {
    url: '/more',
    templateUrl: 'templates/more.html',
    controller: 'AppController as appVm'
  })
  .state('legacylogin', {
    url: '/legacylogin',
    cache: false,
    templateUrl: 'templates/legacylogin.html',
    controller: 'LoginController as lc'
  })
  .state('register', {
    url: '/register',
    cache: false,
    templateUrl: 'templates/register.html',
    controller: 'LoginController as lc'
  })
  .state('help', {
    url: '/help',
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl as helpVm'
  });

  $urlRouterProvider.otherwise('/login');
});
