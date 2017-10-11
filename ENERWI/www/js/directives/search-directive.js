angular.module('app.directives')
.directive('searchDirective', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: { search: '=?filter' },
    templateUrl: 'js/directives/search-directive.html',
    link: function(scope, element, attrs) {
      scope.placeholder = attrs.placeholder || '';
      scope.search = {value: '', focus: false};
      if (attrs.class) {
        element.addClass(attrs.class);
      }

      // We need the actual input field to detect focus and blur
      var inputElement = element.find('input')[0];

      // This function is triggered when the user presses the `Cancel` button
      scope.cancelSearch = function() {
        // Manually trigger blur
        inputElement.blur();
        scope.search.value = '';
      };

      // When the user focuses the search bar
      angular.element(inputElement).bind('focus', function () {
        // We store the focus status in the model to show/hide the Cancel button
        scope.search.focus = true;
        scope.showSearchInput = true;
        // Add a class to indicate focus to the search bar and the content area
        element.addClass('search-bar-focused');
        angular.element(document.querySelector('.has-search-bar')).addClass('search-bar-focused');
        angular.element(document.querySelector('#map')).addClass('ng-hide');
        scope.$digest();
      });
      // When the user leaves the search bar
      angular.element(inputElement).bind('blur', function() {
        scope.search.value = '';
        scope.search.focus = false;
        scope.showSearchInput = false;
        element.removeClass('search-bar-focused');
        angular.element(document.querySelector('.has-search-bar')).removeClass('search-bar-focused');
        angular.element(document.querySelector('#map')).removeClass('ng-hide');
        scope.$digest();
      });
    },
    controller: function ($scope, geoService) {
      $scope.onChangeQuery = function () {
        var position = geoService.getLastLocation();
        var latLon = {lat: position.coords.latitude, lon: position.coords.longitude};
        if ($scope.search.value && $scope.search.value.length > 2) {
          geoService.searchStorePoints(latLon, $scope.search.value)
          .then(function (data) {
            $scope.searchResults = data;
          })
        }
      }

      $scope.showInput = function () {
        $scope.showSearchInput = true;
      }
    }
  };
});
