app.controller('UserCtrl', ['$scope', '$location', '$state', '$stateParams', '$http', '$timeout', 'stats', 'attrs',
    function ($scope, $location, $state, $stateParams, $http, $timeout, stats, attrs) {
        console.log('userCtrl');
        $scope.userName = $stateParams.userName;
        $scope.consoleName = $stateParams.consoleName;
        $scope.regionName = $stateParams.regionName;;
        $scope.regions = [];
        $scope.currentRegion = {};
        $scope.stats = stats;
        $scope.userAttrs = attrs;

        if ($location.$$path.split('/').length === 6) {
            $scope.subRegionName = $location.$$path.split('/')[5];
        }

        if ($scope.stats.length) {
            $scope.regions = _.find($scope.stats, function(c) {
                return c.id === $scope.consoleName;
            }).regions;
        }

        if ($scope.regionName.length === 0) {
            $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.regions[0].id + '/' + $scope.regions[0].subRegions[0].id).replace();
            return;
        }

        $scope.currentRegion.region = _.find($scope.regions, function (r) {
            return r.id === $scope.regionName;
        });

        $scope.currentRegion.subRegion = _.find($scope.currentRegion.region.subRegions, function (sr) {
            return sr.id === $scope.subRegionName;
        });

        $scope.currentRegion.index = _.indexOf($scope.regions, $scope.currentRegion.region);

    $scope.regionChanged = function (r) {
        $scope.$emit('consoleChanged', $stateParams.consoleName);
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
    };

    $scope.subRegionChanged = function (sr) {
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + sr.id).replace();
    };
}]);