app.controller('UserCtrl', ['$scope', '$location', '$state', '$stateParams', 'stats', 'UserGamesStatsService',
    function ($scope, $location, $state, $stateParams, stats, UserGamesStatsService) {
    $scope.userName = $stateParams.userName;
    $scope.stats = stats;
        
    var initialResult = [];

    var lastResult = {};
    $scope.isFetching = false;
    $scope.reachedEnd = false;
    var currentLevel = '';
    var currentQuery = { gameName: '', docid: '', skip: 0};

    $scope.getGames = function () {
        console.log('isFetching: ' + $scope.isFetching);
        if ($scope.isFetching || $scope.reachedEnd) {
            return;
        }
        $scope.isFetching = true;
        console.log('HÄMTAR FLER SPEL med ' + JSON.stringify(currentQuery));
        UserGamesStatsService.get(currentQuery).$promise.then(function (data) {
            if (!_.isEmpty(lastResult)) {
                initialResult.push(lastResult);
            }

            if (data.games.length < 21) {
                initialResult = initialResult.concat(data.games);
                $scope.reachedEnd = true;
            } else {
                initialResult = initialResult.concat(_.initial(data.games));
                lastResult = _.last(data.games);
                currentQuery.consoleName = lastResult.data.console;
                currentQuery.regionName = lastResult.data.regions.main;
                currentQuery.subRegionName = lastResult.data.regions.sub[0];
                currentQuery.gameName = lastResult.id;
                currentQuery.skip = 1;
            }
            if (currentLevel === 'console') {
                $scope.regionStats = data.regions;
            }
            else if (currentLevel === 'region') {
                UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, statsOnly: true }).$promise.then(function (stats) {
                    $scope.regionStats = stats.regions;
                });
                $scope.subRegionStats = data.regions;
            } else {
                UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, statsOnly: true }).$promise.then(function(stats) {
                    $scope.regionStats = stats.regions;
                });
                
                UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: currentQuery.consoleName, regionName: currentQuery.regionName, statsOnly: true }).$promise.then(function (stats) {
                    $scope.subRegionStats = stats.regions;
                });
            }

            $scope.$broadcast('gamesReceived', { level: currentLevel, games: initialResult, loggedIn: data.loggedIn });
            $scope.isFetching = false;
        });
    };

    $scope.$on('$stateChangeStart',
    function (event, toState, toParams, fromState, fromParams) {
        if (toState.name === 'user') {
            event.preventDefault();
        }
        else if (toState.name === 'user.region' && fromState.name === 'user.subRegion') {
            if (toParams.regionName === fromParams.regionName) {
                event.preventDefault();
            }
        }
        else if (toState.name === 'user.list') {
            $scope.selectedConsole = {};
            $scope.regionStats = [];
            $scope.subRegionStats = [];
            $scope.selectedRegion = {};
            $scope.selectedSubRegion = {};
        }
    });

    if ($scope.selectedConsole === undefined) {
        console.log('NOLLSTÄLL');
        $scope.regionStats = [];
        $scope.subRegionStats = [];
    }
    
    $scope.$on('consoleChanged', function (event, consoleName) {
        if ($scope.selectedConsole !== consoleName) {
            $scope.regionStats = [];
            $scope.subRegionStats = [];
            //$scope.selectedRegion = {};
            //$scope.selectedSubRegion = {};
            $scope.selectedConsole = consoleName;
            $scope.reachedEnd = false;
            initialResult = [];
            lastResult = {};
            if (!$scope.isFetching) {
                currentQuery = {};
                currentQuery = { userName: $stateParams.userName, consoleName: consoleName, skip: 0 };
                currentLevel = 'console';
                $scope.getGames();
            }
        }
    });

    $scope.$on('regionsLoaded', function (event, regions) {
        $scope.regionStats = regions;
    });

    $scope.$on('regionChanged', function (event, data) {
        console.log('ny region: ' + data.regionName);
        if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName) {
            $scope.selectedRegion = data.regionName;
            $scope.reachedEnd = false;
            initialResult = [];
            lastResult = {};
            if (!$scope.isFetching) {
                currentQuery = {};
                currentQuery = { userName: $stateParams.userName, consoleName: data.consoleName, regionName: data.regionName, skip: 0 };
                console.log(currentQuery);
                currentLevel = 'region';
                $scope.getGames();
            }
        }
    });
    
    $scope.$on('subRegionsLoaded', function (event, subRegions) {
        $scope.subRegionStats = subRegions;
    });
    
    $scope.$on('subRegionChanged', function (event, data) {
        console.log('ny subregion: ' + data.subRegionName);
        if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName || $scope.selectedSubRegion !== data.subRegionName) {
            $scope.selectedSubRegion = data.subRegionName;
            $scope.reachedEnd = false;
            initialResult = [];
            lastResult = {};
            currentQuery = {};
            currentQuery = { userName: $stateParams.userName, consoleName: data.consoleName, regionName: data.regionName, subRegionName: data.subRegionName, skip: 0 };
            currentLevel = 'subregion';
            $scope.getGames();
        }
    });
        
    $scope.$on('gameRemoved', function (event, consoleName) {
        console.log(_.where($scope.stats, { console: consoleName })[0]);
        var obj = _.where($scope.stats, { console: consoleName })[0];

        if (obj.count === 1) {
            $scope.stats.splice(_.indexOf($scope.stats, obj), 1);
        } else {
            obj.count--;
        }
    });
        

    var redirectDelayed = function () {
        $scope.$apply(function () { redirectEmptyResult(); });
    };
    var redirectThrottled = _.debounce(redirectDelayed, 500);
    var redirectEmptyResult = function () {
        console.log('redirect säger att console är ' + $scope.selectedConsole);
        if ($scope.stats.length && $scope.selectedConsole === undefined) {
            $state.go('user.list', { consoleName: stats[0].console });
        }
    };
        
    redirectThrottled($scope);
}]);