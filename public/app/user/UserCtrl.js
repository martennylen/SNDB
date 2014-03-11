app.controller('UserCtrl', ['$scope', '$location', '$state', '$stateParams', '$http', '$timeout', 'stats', 'attrs',
    function ($scope, $location, $state, $stateParams, $http, $timeout, stats, attrs) {
        console.log('userCtrl');
        $scope.userName = $stateParams.userName;
        $scope.consoleName = $stateParams.consoleName;
        $scope.regionName = $stateParams.regionName;;
        $scope.currentRegion = {};
        $scope.stats = stats;
        $scope.userAttrs = attrs;
        
    if ($scope.regionName.length === 0) {
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.stats[0].regions[0].id + '/' + $scope.stats[0].regions[0].subRegions[0].id).replace();
        return;
    }

    if ($location.$$path.split('/').length === 6) {
        $scope.subRegionName = $location.$$path.split('/')[5];
    }

    $scope.regions = _.find($scope.stats, function (c) {
        return c.id === $scope.consoleName;
    }).regions;

    $scope.currentRegion.region =
        _.find($scope.regions, function (r) {
            return r.id === $scope.regionName;
        });

    $scope.subRegions = $scope.currentRegion.region.subRegions;

    $scope.currentRegion.subRegion = _.find($scope.subRegions, function (sr) {
        return sr.id === $scope.subRegionName;
    });

    $scope.regionChanged = function (r) {
        $scope.$emit('consoleChanged', $stateParams.consoleName);
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
    };

    $scope.subRegionChanged = function (sr) {
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + sr.id).replace();
    };
}]);