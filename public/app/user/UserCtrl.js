app.controller('UserCtrl', ['$scope', '$stateParams', 'stats', 'UserGamesService', 'UserGamesRegionService', function ($scope, $stateParams, stats, UserGamesService, UserGamesRegionService) {
    $scope.userName = $stateParams.userName;
    $scope.stats = stats;
  
    //$scope.selected = stats.length ? stats[0].console : {};
    //console.log($scope.selected);

    //$location.path('/user/' + $scope.userName + '/' + $scope.selected);
    //$state.go('user.list', { consoleName: $scope.selected });
    //$scope.$broadcast('consoleInit', $scope.selected);

    $scope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            //console.log(JSON.stringify(fromState) + ' ' + JSON.stringify(toState));
            if (toState.name === 'user') {
                $scope.selectedConsole = {};
                $scope.regionStats = [];
                $scope.subRegionStats = [];
                $scope.selectedRegion = {};
                $scope.selectedSubRegion = {};
            }
            //event.preventDefault();
            // transitionTo() promise will be rejected with 
            // a 'transition prevented' error
        });

    if ($stateParams.consoleName === undefined) {
        console.log('NOLLSTÄLL');
        $scope.regionStats = [];
        $scope.subRegionStats = [];
    }
    
    $scope.$on('consoleChanged', function (event, consoleName) {
        //console.log('user satte till: ' + consoleName);
        if ($scope.selectedConsole !== consoleName) {
            $scope.regionStats = [];
            $scope.subRegionStats = [];
            $scope.selectedRegion = {};
            $scope.selectedSubRegion = {};
            $scope.selectedConsole = consoleName;
            UserGamesService.get({ userName: $stateParams.userName, consoleName: consoleName }).$promise.then(function(gameResponse) {
                $scope.regionStats = gameResponse.regions;
                console.log('triggar gamesReceived med: ' + consoleName);
                $scope.$broadcast('gamesReceived', { games: gameResponse.games, loggedIn: gameResponse.loggedIn });
            });
        }
    });

    $scope.$on('regionsLoaded', function (event, regions) {
        //console.log('user satte till: ' + consoleName);
        $scope.regionStats = regions;
    });

    $scope.$on('regionChanged', function (event, data) {
        console.log('ny region: ' + data.regionName);
        if ($scope.selectedConsole !== data.consoleName || $scope.selectedRegion !== data.regionName) {
            $scope.selectedRegion = data.regionName;
            UserGamesRegionService.get({ userName: $stateParams.userName, consoleName: $scope.selectedConsole, regionName: data.regionName }).$promise.then(function(gameResponse) {
                $scope.subRegionStats = gameResponse.regions;
                console.log('triggar gamesReceived med: ' + data.regionName);
                $scope.$broadcast('gamesReceived', { games: gameResponse.games, loggedIn: gameResponse.loggedIn });
            });
        }
    });
    
    $scope.$on('subRegionChanged', function (event, subRegionName) {
        //console.log('user satte till: ' + consoleName);
        console.log('ny subregion: ' + subRegionName);
        $scope.selectedSubRegion = subRegionName;
    });
    
    $scope.$on('subRegionsLoaded', function (event, subRegions) {
        //console.log('user satte till: ' + consoleName);
        $scope.subRegionStats = subRegions;
    });

    $scope.$on('gameRemoved', function (event, consoleName) {
        console.log(_.where($scope.stats, { console: consoleName })[0]);
        var obj = _.where($scope.stats, { console: consoleName })[0];

        if (obj.count === 1) {
            $scope.stats.splice(_.indexOf($scope.stats, obj), 1);
        } else {
            count--;
        }
    });
}]);