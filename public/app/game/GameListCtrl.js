app.controller('GameListCtrl', function ($scope, $location, $route, $stateParams, $http, $timeout, GamesService, baseRegions, gameResponse) {
    console.log('gamelistctrl');
    $scope.userName = $stateParams.userName || false;
    $scope.consoleName = $stateParams.consoleName || 'nes';
    $scope.selected = {};
    
    $scope.games = gameResponse.games;
    $scope.loggedIn = gameResponse.loggedIn;
    
    $scope.$watch('consoleName', function (newValue) {
        if (newValue.length) {
            $scope.$emit('consoleChanged', newValue);
        }
    });

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.loggedIn) {
            return;
        }
        $scope.isEditing = !$scope.isEditing;
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    $scope.attrChanged = function (attrs) {
        $scope.willRemove = (_.every(_.pluck(attrs, 'status'), function(a) { return !a; }) && !$scope.selected.attr.isNew) ? true : false; 
    };

    $scope.updateGame = function (g) {
        var current = $scope.selected;
        var obj = {
            common: _.pluck(current.attr.common, 'status'),
            extras: _.pluck(current.attr.extras, 'status'),
            note: current.attr.note
        };
        
        if (current.attr.isNew) {
            $http.post('/api/user/add', { id: current.id, console: $stateParams.consoleName, attr: obj })
                .success(function () {
                    g.attr = current.attr;
                    g.attr.isNew = false;
                    $scope.editGame(g);
                })
                .error(function () {
                    console.log('HIELP');
                });
        } else {
            if ((_.every(obj.common, function(a) { return !a; }) && !$scope.selected.attr.isNew)) {
                console.log('vill ta bort ' + current.item);
                $scope.$emit('gameRemoved', $scope.consoleName);
                //$http.post('/api/user/remove', { item: current.item })
                //    .success(function () {
                //        if ($scope.userName) {
                //            g.isRemoved = true;
                //            $scope.$emit('gameRemoved', $scope.consoleName);
                //        }
                //        $scope.editGame(g);
                //    })
                //    .error(function() {
                //        console.log('HIELP');
                //    });
            } else {
                console.log(current.item);
                $http.post('/api/user/update', { item: current.item, attr: obj })
                    .success(function() {
                        g.attr = current.attr;
                        g.attr.isComplete = _.every(_.pluck(g.attr.common, 'status')) && (g.attr.extras.length ? _.every(_.pluck(g.attr.extras, 'status')) : true);
                        $scope.editGame(g);
                    })
                    .error(function() {
                        console.log('HIELP');
                    });
            }
        }
    };

    $scope.isDirty = function (attrs) {
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.attr));
    };

    $scope.search = function () {
        if ($scope.q === undefined) {
            return;
        }
        
        if ($scope.q.length === 0) {
            $scope.games = gameResponse.games;
            $scope.showQ = false;
            return;
        }
        
        if ($scope.q.length < latestSearchQuery.length) {
            $scope.games = _.filter($scope.games, function (game) {
                return _.any(game.tags, function (tag) {
                    return _(tag).startsWith($scope.q);
                });
            });
        } else {
            searchThrottled($scope);
        }
    };
    
    var latestSearchQuery = '';

    var searchDelayed = function ($scope) {
        $scope.$apply(function () { searchAction($scope); });
    };

    var searchThrottled = _.debounce(searchDelayed, 1000);

    var searchAction = function ($scope) {
        if ($scope.q !== undefined) {
            console.log('eller så söker vi lite...');
            latestSearchQuery = $scope.q;

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $stateParams.consoleName + '?q=' + $scope.q + '&r=' + $scope.userName);
                $scope.pendingPromise
                .success(function (res) {
                    $scope.games = res.games;
                    $scope.showQ = true;
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };

    //$scope.isComplete = function (game) {
    //    console.log(game.attr.common);
    //    return _.every(_.map(game.attr.common, function(attr) {
    //        return attr.status;
    //    }));
    //};
});