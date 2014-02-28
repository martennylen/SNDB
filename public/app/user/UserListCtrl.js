app.controller('UserListCtrl', ['$scope', '$location', '$stateParams', '$http', 'UserGamesService',
    function ($scope, $location, $stateParams, $http, UserGamesService) {
    console.log('userlistctrl');
    $scope.userName = $stateParams.userName;
    $scope.subRegionName = $stateParams.subRegionName;
    $scope.regionName = $stateParams.regionName;
    $scope.consoleName = $stateParams.consoleName;
      
    $scope.selected = {};
    var initialResult = [];

    var docid = '';
    var skip = 0;
    var lastResult = {};
    var lastGameName = '';
    $scope.isFetching = false;
    $scope.reachedEnd = false;
        
    $scope.$on('searchResult', function (event, games, success) {
        if (success) {
            $scope.games = games;
        } else {
            $scope.games = initialResult;
        }
    });
        
    $scope.getGames = function () {
        if ($scope.isFetching || $scope.reachedEnd || $scope.showQ) {
            return;
        }
        console.log('came further');
        $scope.isFetching = true;
        UserGamesService.get({ userName: $stateParams.userName, consoleName: $stateParams.consoleName, regionName: $stateParams.regionName, subRegionName: $stateParams.subRegionName, gameName: lastGameName, docid: docid, skip: skip }).$promise.then(function (data) {
            if (!_.isEmpty(lastResult)) {
                initialResult.push(lastResult);
            }
            console.log(data.games.length);
            if (data.games.length < 21) {
                initialResult = initialResult.concat(data.games);
                $scope.reachedEnd = true;
            } else {
                initialResult = initialResult.concat(_.initial(data.games));
                lastResult = _.last(data.games);
                lastGameName = lastResult.data.name;
                docid = lastResult.item;
                skip = 1;
                console.log(lastResult);
            }
            $scope.games = initialResult;
            $scope.loggedIn = data.loggedIn;
            $scope.isFetching = false;
        });
    };

    $scope.$watch('consoleName', function (newValue) {
        if (newValue) {
            $scope.$emit('consoleChanged', newValue);
        }
    });

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.loggedIn) {
            return;
        }
        $scope.isEditing = !$scope.isEditing;
        var attrs = _.map(g.data.variants, function (v) {
            return _.pluck(v.attr.common, 'status');
        });
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.data.variants, attrs: attrs }));
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, variants: g.data.variants, attrs: attrs }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    $scope.attrChanged = function (variant, attr, status) {
        $scope.selected.attrs[variant][attr] = status;
        $scope.willRemove = mapCheckboxAttributes($scope.selected.attrs);
    };

    $scope.updateGame = function (g) {
        var current = $scope.selected;
        var attrs = _.map(current.variants, function (v, i) {
            return { common: current.attrs[i], extras: v.attr.extras, note: v.attr.note };
        });
        
        if (mapCheckboxAttributes(current.attrs)) {
            console.log('vill ta bort ' + current.item);
            //$scope.$emit('gameRemoved', $scope.consoleName);
            $http.post('/api/user/remove', { item: current.item })
                .success(function () {
                    $scope.games.splice(_.indexOf($scope.games, g), 1);
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        } else {
            $http.post('/api/user/update', { item: current.item, attr: attrs })
                .success(function () {
                    g.data.variants = current.variants;
                    _.each(g.data.variants, function (v) {
                        v.isComplete = _.every(_.pluck(v.attr.common, 'status')) && (v.attr.extras.length ? _.every(_.pluck(v.attr.extras, 'status')) : true);
                    });

                    g.isComplete = _.every(_.pluck(g.data.variants, 'isComplete'));
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        }
    };

    $scope.isDirty = function (attrs) {
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.variants));
    };

    function mapCheckboxAttributes(attrs) {
        var flat = _.reduceRight(attrs, function (a, b) { return a.concat(b); }, []);
        return _.every(flat, function (a) { return !a; });
    }
}]);