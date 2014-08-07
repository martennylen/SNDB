app.controller('GameRegionCtrl', ['$scope', '$location', '$stateParams', '$rootScope',
    function ($scope, $location, $stateParams, $rootScope) {
        console.log('gameregion');
        
        $scope.apa = $rootScope.consoles;
        $scope.consoleName = $stateParams.consoleName;
        $scope.regionName = $stateParams.regionName;

        $scope.currentRegion = {};

        $scope.regions = _.find($scope.apa, function (c) {
                return c.id === $scope.consoleName;
        }).regions;
        
        if ($scope.regionName.length === 0) {
            $location.path('/all/' + $stateParams.consoleName + '/' + $scope.regions[0].id + '/' + $scope.regions[0].subRegions[0].id).replace();
            return;
        }
        
        if ($location.$$path.split('/').length === 5) {
            $scope.subRegionName = $location.$$path.split('/')[4];
        }

        $scope.currentRegion.region =
            _.find($scope.regions, function (r) {
                return r.id === $scope.regionName;
            });
            
        $scope.currentRegion.subRegion = _.find($scope.currentRegion.region.subRegions, function (sr) {
            return sr.id === $scope.subRegionName;
        });

        $scope.currentRegion.index = _.indexOf($scope.regions, $scope.currentRegion.region);
       
        $scope.regionChanged = function (r) {
            $location.path('/all/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
        };

        $scope.subRegionChanged = function (sr) {
            $location.path('/all/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + sr.id).replace();
        };
        
        $scope.$emit('consoleChanged', $scope.consoleName);

        $scope.showRegions = true;
        $scope.$on('searchResult', function (event, games, success) {
            $scope.showRegions = !success;
        });
    }]);