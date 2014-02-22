app.controller('GameRegionCtrl', ['$scope', '$location', '$stateParams', '$timeout', '$http', 'baseRegions', function($scope, $location, $stateParams, $timeout, $http, baseRegions) {
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