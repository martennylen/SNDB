app.controller('GameRegionCtrl', ['$scope', '$location', '$stateParams', '$timeout', '$http', 'baseRegions', 'GamesStatsService',
    function ($scope, $location, $stateParams, $timeout, $http, baseRegions, GamesStatsService) {
    $scope.consoleName = $stateParams.consoleName;

    if ($stateParams.regionName.length === 0) {
        GamesStatsService.query({ consoleName: $stateParams.consoleName, level: 2 }).$promise.then(function (data) {
            $scope.regions = data;

            GamesStatsService.query({ consoleName: $stateParams.consoleName, regionName: $scope.regions[0].id, level: 3 }).$promise.then(function (data) {
                $scope.subRegions = data;
                $location.path('/' + $stateParams.consoleName + '/' + $scope.regions[0].id + '/' + $scope.subRegions[0].id).replace();
            });
        });
        return;
    }

    GamesStatsService.query({ consoleName: $stateParams.consoleName, level: 2 }).$promise.then(function (data) {
        $scope.regions = data;
        $scope.currentRegion = {
            region: _.find($scope.regions, function (r) {
                return r.id === $stateParams.regionName;
            })
        };
        
        GamesStatsService.query({ consoleName: $stateParams.consoleName, regionName: $scope.currentRegion.region.id, level: 3 }).$promise.then(function (data) {
            $scope.subRegions = data;
            $scope.currentRegion.subRegion = _.first($scope.subRegions);
        });
    });

    $scope.regionChanged = function (r) {
        GamesStatsService.query({ consoleName: $stateParams.consoleName, regionName: r.id, level: 3 }).$promise.then(function (data) {
            $scope.subRegions = data;
            $scope.currentRegion.subRegion = _.first($scope.subRegions);

            $location.path('/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.subRegions[0].id).replace();
        });
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
}]);