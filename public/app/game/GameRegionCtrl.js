app.controller('GameRegionCtrl', ['$scope', '$location', '$stateParams', '$rootScope', '$timeout', '$http',
    function ($scope, $location, $stateParams, $rootScope, $timeout, $http) {
        console.log('gameregion');
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

            $scope.subRegions = $scope.currentRegion.region.subRegions;
            
            $scope.currentRegion.subRegion = _.find($scope.subRegions, function (sr) {
                return sr.id === $scope.subRegionName;
            });
       
    $scope.regionChanged = function (r) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
    };

    $scope.subRegionChanged = function (sr) {
        $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + sr.id).replace();
    };
    
    var latestResults = [];
    var searchResults = [];
    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }

        if ($scope.q.length === 0) {
            $scope.$broadcast('searchResult', null, false);
            $scope.showQ = false;
            return;
        }

        var oldies = _.filter(latestResults, function (game) {
            return _.any(game.tags, function (tag) {
                return _(tag).startsWith($scope.q);
            });
        });

        if (oldies.length === 0) {
            searchThrottled($scope);
        } else {
            searchResults = oldies;
        }
    };

    var searchDelayed = function ($scope) {
        $scope.$apply(function () { searchAction($scope); });
    };

    var searchThrottled = _.debounce(searchDelayed, 1000);

    var searchAction = function ($scope) {
        if ($scope.q !== undefined && $scope.q.length) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase());
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;

                    searchResults = _.filter(res.games, function (game) {
                        return _.any(game.data.tags, function (tag) {
                            return _(tag).startsWith($scope.q.toLowerCase());
                        });
                    });

                    $scope.$broadcast('searchResult', searchResults, true);
                    $scope.showQ = true;
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };
        
    //$scope.$on('PUNG', function (event, data) {
    //    console.log('jldfejpfpwefoeå');
    //    console.log(data);
    //    $scope.currentRegion.subRegion = _.find($scope.subRegions, function (sr) {
    //        return sr.id === data;
    //    });
    //});
}]);