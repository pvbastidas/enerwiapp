'use strict';

describe('<Unit Test> notificationService', function () {

  var notificationService, $rootScope, CONFIG;

  beforeEach(module('app.services'));

  var message = 'error';
  var type = 'danger';

  beforeEach(function () {
    module('app.constants', function ($provide) {
      $provide.constant('CONFIG', {
        duration_notification: 3000
      });
    });
  });

  beforeEach(inject(function (_notificationService_, _$rootScope_, _CONFIG_) {
    notificationService = _notificationService_;
    $rootScope = _$rootScope_;
    CONFIG = _CONFIG_;
  }));

  it('should init the service', function () {
    expect(!!notificationService).toBe(true);
  });

  it('should call broadcast', function () {
    spyOn($rootScope, '$emit');
    notificationService.addNotification();
    expect($rootScope.$emit).toHaveBeenCalled();
  });

  it('should call broadcast with parameters', function () {
    spyOn($rootScope, '$emit');
    notificationService.addNotification(message,  type);
    expect($rootScope.$emit).toHaveBeenCalledWith('notification', 'error', CONFIG.duration_notification, type);
  });
});
