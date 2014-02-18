app.controller('UserCtrl', ['$scope', '$location', '$state', '$stateParams', 'stats', 'UserGamesStatsService',
    function ($scope, $location, $state, $stateParams, stats, UserGamesStatsService) {
    $scope.userName = $stateParams.userName;
    $scope.stats = stats;

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
            $scope.selectedRegion = {};
            $scope.selectedSubRegion = {};
            $scope.selectedConsole = consoleName;
            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: consoleName }).$promise.then(function(gameResponse) {
                $scope.regionStats = gameResponse.regions;
                console.log('triggar gamesReceived med: ' + consoleName);
                $scope.$broadcast('gamesReceived', { level: 'console', games: gameResponse.games, loggedIn: gameResponse.loggedIn });
            });
        }
    });

    $scope.$on('regionsLoaded', function (event, regions) {
        $scope.regionStats = regions;
    });

    $scope.$on('regionChanged', function (event, data) {
        console.log('ny region: ' + data.regionName);
        if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName) {
            $scope.selectedRegion = data.regionName;
            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: $scope.selectedConsole, regionName: data.regionName }).$promise.then(function (gameResponse) {
                $scope.subRegionStats = gameResponse.regions;
                console.log('triggar gamesReceived med: ' + data.regionName);
                console.log('fastän vi redan har subregion: ' + $scope.selectedSubRegion);
                $scope.$broadcast('gamesReceived', { level: 'region', games: gameResponse.games, loggedIn: gameResponse.loggedIn });
            });
        }
    });
    
    $scope.$on('subRegionsLoaded', function (event, subRegions) {
        $scope.subRegionStats = subRegions;
    });
    
    $scope.$on('subRegionChanged', function (event, data) {
        console.log('ny subregion: ' + data.subRegionName);
        if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName || $scope.selectedSubRegion !== data.subRegionName) {
            $scope.selectedSubRegion = data.subRegionName;
            UserGamesStatsService.get({ userName: $stateParams.userName, consoleName: $scope.selectedConsole, regionName: $scope.selectedRegion, subRegionName: data.subRegionName }).$promise.then(function(gameResponse) {
                $scope.$broadcast('gamesReceived', { level: 'subregion', games: gameResponse.games, loggedIn: gameResponse.loggedIn });
            });
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