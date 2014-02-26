app.controller('UserCtrl', ['$scope', '$location', '$state', '$stateParams', '$http', '$timeout', 'stats',
    function ($scope, $location, $state, $stateParams, $http, $timeout, stats) {
        console.log('userCtrl');
        $scope.userName = $stateParams.userName;
        $scope.consoleName = $stateParams.consoleName;
        $scope.regionName = $stateParams.regionName;;
        $scope.currentRegion = {};
        $scope.stats = stats;
        
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
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + $scope.currentRegion.region.subRegions[0].id).replace();
    };

    $scope.subRegionChanged = function (sr) {
        $location.path('/user/' + $stateParams.userName + '/' + $stateParams.consoleName + '/' + $scope.currentRegion.region.id + '/' + sr.id).replace();
    };

    var latestResults = [];
    var searchResults = [];
    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }

        if ($scope.q.length === 0) {
            $scope.games = $scope.initialResult;
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
        if ($scope.q !== undefined) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase() + '&r=' + $scope.userName);
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
        
    //var initialResult = [];

    //var lastResult = {};
    //$scope.isFetching = false;
    //$scope.reachedEnd = false;
    //var currentLevel = '';
    //var currentQuery = { gameName: '', docid: '', skip: 0};

    //$scope.getGames = function () {
    //    console.log('isFetching: ' + $scope.isFetching);
    //    if ($scope.isFetching || $scope.reachedEnd) {
    //        return;
    //    }
    //    $scope.isFetching = true;
    //    console.log('HÄMTAR FLER SPEL med ' + JSON.stringify(currentQuery));
    //    UserGamesStatsService.get(currentQuery).$promise.then(function (data) {
    //        if (!_.isEmpty(lastResult)) {
    //            initialResult.push(lastResult);
    //        }

    //        if (data.games.length < 21) {
    //            initialResult = initialResult.concat(data.games);
    //            $scope.reachedEnd = true;
    //        } else {
    //            initialResult = initialResult.concat(_.initial(data.games));
    //            lastResult = _.last(data.games);
    //            currentQuery.consoleName = lastResult.data.console;
    //            currentQuery.regionName = lastResult.data.regions.main;
    //            currentQuery.subRegionName = lastResult.data.regions.sub[0];
    //            currentQuery.gameName = lastResult.id;
    //            currentQuery.skip = 1;
    //        }
    //        if (currentLevel === 'console') {
    //            $scope.regionStats = data.regions;
    //        }
    //        else if (currentLevel === 'region') {
    //            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, statsOnly: true }).$promise.then(function (stats) {
    //                $scope.regionStats = stats.regions;
    //            });
    //            $scope.subRegionStats = data.regions;
    //        } else {
    //            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, statsOnly: true }).$promise.then(function(stats) {
    //                $scope.regionStats = stats.regions;
    //            });
                
    //            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, regionName: currentQuery.regionName, statsOnly: true }).$promise.then(function (stats) {
    //                $scope.subRegionStats = stats.regions;
    //            });
    //        }

    //        $scope.$broadcast('gamesReceived', { level: currentLevel, games: initialResult, loggedIn: data.loggedIn });
    //        $scope.isFetching = false;
    //    });
    //};

    //$scope.$on('$stateChangeStart',
    //function (event, toState, toParams, fromState, fromParams) {
    //    if (toState.name === 'user') {
    //        event.preventDefault();
    //    }
    //    else if (toState.name === 'user.region' && fromState.name === 'user.subRegion') {
    //        if (toParams.regionName === fromParams.regionName) {
    //            event.preventDefault();
    //        }
    //    }
    //    else if (toState.name === 'user.list') {
    //        $scope.selectedConsole = {};
    //        $scope.regionStats = [];
    //        $scope.subRegionStats = [];
    //        $scope.selectedRegion = {};
    //        $scope.selectedSubRegion = {};
    //    }
    //});

    //if ($scope.selectedConsole === undefined) {
    //    console.log('NOLLSTÄLL');
    //    $scope.regionStats = [];
    //    $scope.subRegionStats = [];
    //}
    
    //$scope.$on('consoleChanged', function (event, consoleName) {
    //    if ($scope.selectedConsole !== consoleName) {
    //        $scope.regionStats = [];
    //        $scope.subRegionStats = [];
    //        //$scope.selectedRegion = {};
    //        //$scope.selectedSubRegion = {};
    //        $scope.selectedConsole = consoleName;
    //        $scope.reachedEnd = false;
    //        initialResult = [];
    //        lastResult = {};
    //        if (!$scope.isFetching) {
    //            currentQuery = {};
    //            currentQuery = { userName: $stateParams.userName, consoleName: consoleName, skip: 0 };
    //            currentLevel = 'console';
    //            $scope.getGames();
    //        }
    //    }
    //});

    //$scope.$on('regionsLoaded', function (event, regions) {
    //    $scope.regionStats = regions;
    //});

    //$scope.$on('regionChanged', function (event, data) {
    //    console.log('ny region: ' + data.regionName);
    //    if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName) {
    //        $scope.selectedRegion = data.regionName;
    //        $scope.reachedEnd = false;
    //        initialResult = [];
    //        lastResult = {};
    //        if (!$scope.isFetching) {
    //            currentQuery = {};
    //            currentQuery = { userName: $stateParams.userName, consoleName: data.consoleName, regionName: data.regionName, skip: 0 };
    //            console.log(currentQuery);
    //            currentLevel = 'region';
    //            $scope.getGames();
    //        }
    //    }
    //});
    
    //$scope.$on('subRegionsLoaded', function (event, subRegions) {
    //    $scope.subRegionStats = subRegions;
    //});
    
    //$scope.$on('subRegionChanged', function (event, data) {
    //    console.log('ny subregion: ' + data.subRegionName);
    //    if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName || $scope.selectedSubRegion !== data.subRegionName) {
    //        $scope.selectedSubRegion = data.subRegionName;
    //        $scope.reachedEnd = false;
    //        initialResult = [];
    //        lastResult = {};
    //        currentQuery = {};
    //        currentQuery = { userName: $stateParams.userName, consoleName: data.consoleName, regionName: data.regionName, subRegionName: data.subRegionName, skip: 0 };
    //        currentLevel = 'subregion';
    //        $scope.getGames();
    //    }
    //});
        
    //$scope.$on('gameRemoved', function (event, consoleName) {
    //    console.log(_.where($scope.stats, { console: consoleName })[0]);
    //    var obj = _.where($scope.stats, { console: consoleName })[0];

    //    if (obj.count === 1) {
    //        $scope.stats.splice(_.indexOf($scope.stats, obj), 1);
    //    } else {
    //        obj.count--;
    //    }
    //});
        

    //var redirectDelayed = function () {
    //    $scope.$apply(function () { redirectEmptyResult(); });
    //};
    //var redirectThrottled = _.debounce(redirectDelayed, 500);
    //var redirectEmptyResult = function () {
    //    console.log('redirect säger att console är ' + $scope.selectedConsole);
    //    if ($scope.stats.length && $scope.selectedConsole === undefined) {
    //        $state.go('user.list', { consoleName: stats[0].console });
    //    }
    //};
        
    //redirectThrottled($scope);
}]);