app.controller('GameRegionCtrl', function($scope, $location, $route, $stateParams, $http, $timeout, baseRegions) {
    $scope.regions = baseRegions;

    if ($stateParams.regionName.length === 0) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.regions[0].id + '/' + $scope.regions[0].regions[0].id).replace();
        return;
    }
    $scope.consoleName = $stateParams.consoleName || 'nes';
    $scope.currentRegion = {
        region: $stateParams.regionName.length > 0 ? _.find(baseRegions, function (r) {
            return r.id === $stateParams.regionName;
        }) : baseRegions[0]
    };

    $scope.regionChanged = function (r) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.regions[0].id).replace();
    };

    $scope.subRegionChanged = function (sr) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.subregion.id).replace();
    };
});