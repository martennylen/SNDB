app.controller('UserCtrl', function ($scope, $location, $state, $stateParams, $http, stats) {
    console.log('user');
    $scope.userName = $stateParams.userName;

    $scope.stats = stats;
    $scope.selected = stats.length ? stats[0].console : {};
    console.log($scope.selected);


    //$location.path('/user/' + $scope.userName + '/' + $scope.selected);
    $state.go('user.list', { consoleName: $scope.selected });
    
    $scope.$on('consoleChanged', function (event, consoleName) {
        console.log('user satte till: ' + consoleName);
        $scope.selected = consoleName;
    });
});