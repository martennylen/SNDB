﻿app.controller('UserCtrl', function ($scope, $location, $state, $stateParams, $http, stats, $rootScope) {
    console.log('user');
    $scope.userName = $stateParams.userName;

    $scope.stats = stats;
    $scope.selected = stats.length ? stats[0].console : {};
    console.log($scope.selected);


    //$location.path('/user/' + $scope.userName + '/' + $scope.selected);
    $state.go('user.list', { consoleName: $scope.selected });
    //$scope.$broadcast('consoleInit', $scope.selected);

    $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            //console.log(JSON.stringify(fromState) + ' ' + JSON.stringify(toState));
            if (fromState.name === 'user.list' && toState.name === 'user') {
                event.preventDefault();
            }
            //event.preventDefault();
            // transitionTo() promise will be rejected with 
            // a 'transition prevented' error
        });
    
    $scope.$on('consoleChanged', function (event, consoleName) {
        console.log('user satte till: ' + consoleName);
        $scope.selected = consoleName;
    });
});