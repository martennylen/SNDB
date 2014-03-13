app.controller('GameRegionCtrl', ['$scope', '$location', '$stateParams', '$rootScope',
    function ($scope, $location, $stateParams, $rootScope) {
        console.log('gameregion');
        //console.log($rootScope.consoles);
        $scope.apa = $rootScope.consoles;

        $scope.consoleName = $stateParams.consoleName;
        $scope.regionName = $stateParams.regionName;

        $scope.currentRegion = {};
        
        if ($scope.regionName.length === 0) {
            $location.path('/' + $stateParams.consoleName + '/' + $scope.apa[0].regions[0].id + '/' + $scope.apa[0].regions[0].subRegions[0].id).replace();
            return;
        }
        
        if ($location.$$path.split('/').length === 4) {
            $scope.subRegionName = $location.$$path.split('/')[3];
        }

        $scope.regions = _.find($scope.apa, function (c) {
                return c.id === $scope.consoleName;
        }).regions;

        $scope.currentRegion.region =
            _.find($scope.regions, function (r) {
                return r.id === $scope.regionName;
            });

        //$scope.subRegions = $scope.currentRegion.region.subRegions;
            
        $scope.currentRegion.subRegion = _.find($scope.currentRegion.region.subRegions, function (sr) {
            return sr.id === $scope.subRegionName;
        });
       
    $scope.regionChanged = function (r) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
    };

    $scope.subRegionChanged = function (r, sr) {
        $location.path('/' + $stateParams.consoleName + '/' + r.id + '/' + sr.id).replace();
    };
        
    //$scope.$on('PUNG', function (event, data) {
    //    console.log('jldfejpfpwefoeå');
    //    console.log(data);
    //    $scope.currentRegion.subRegion = _.find($scope.subRegions, function (sr) {
    //        return sr.id === data;
    //    });
    //});
}]);