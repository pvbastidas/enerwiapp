'use strict';

function historyController (CONFIG, chargeService, $scope) {
  var historyVm = this;
  var page = 0;
  var limit = CONFIG.page_limit || 10;

  historyVm.charges = [];
  historyVm.hasMoreData = true;

  historyVm.getTime = getTime;
  historyVm.nextPage = nextPage;
  historyVm.totalPages;

  init();

  return historyVm;

  function init () {
    nextPage();
  }

  function nextPage(){
    page += 1;
    if (page === 1 || page <= historyVm.totalPages) {
      chargeService.getHistory(page, limit)
      .then(function(charges) {
        historyVm.totalPages = charges.data.totalPages;
        historyVm.charges = historyVm.charges.concat(charges.data.results);
        historyVm.hasMoreData = page < charges.data.totalPages;
        $scope.$broadcast('scroll.infiniteScrollComplete');
      },
      function() {
        // TODO: Notificacion de error
      });
    }
  }

  function getTime(startDate, endDate) {
    if (startDate && endDate) {
      var diff = new Date(endDate).getTime() - new Date(startDate).getTime();
      return (diff/60000).toFixed(2);
    }
  }

}

angular.module('app.controllers')
.controller('HistoryController', historyController);
