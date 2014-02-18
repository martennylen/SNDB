app.controller('AdminCtrl',  ['$scope', '$http', '$timeout', '$location', 'consoles', 'baseRegions', 'user', function($scope, $http, $timeout, $location, consoles, baseRegions, user) {
    $scope.user = user;
    $scope.consoles = consoles;
    $scope.regions = baseRegions;
    $scope.game = { type: 'game', data: { regions: {}, variants: [] } };
    $scope.postMessage = '';
    $scope.currentVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', longName: 'Kassett', selected: true }, { id: 'i', desc: '', longName: 'Manual', selected: true }, { id: 'b', desc: '', longName: 'Kartong', selected: true }], extras: [] } };
    $scope.currentExtra = '';

    $scope.currentRegions = {
        main: baseRegions[0],
        sub: baseRegions[0].regions[0]
    };

    $scope.regionChanged = function () {
        $scope.currentRegions.sub = $scope.currentRegions.main.regions[0];
    };

    $scope.setSelected = function (game) {
        _.each(game.data.variants, function (v) {
            _.each(v.attr.common, function (a) {
                a.selected = true;
            });
        });

        var currentRegion = _.findWhere(baseRegions, { id: game.data.regions.main });
        currentRegion.selected = true;
        $scope.currentRegions.main = currentRegion;

        var currentSubRegion = _.findWhere(currentRegion.regions, { id: game.data.regions.sub[0] });
        currentSubRegion.selected = true;
        $scope.currentRegions.sub = currentSubRegion;
        
        $scope.game = game;
        $scope.games = [];
        $scope.q = '';
        $scope.isEditing = true;
    };

    $scope.handleVariant = function (variant, doAction) {
        if (doAction) {
            if (_.contains($scope.game.data.variants, variant)) {
                $scope.game.data.variants.splice(_.indexOf($scope.game.data.variants, variant), 1);
            } else {
                $scope.game.data.variants.push(variant);
            }
        }
        $scope.isEditingVariant = false;
        $scope.currentVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', longName: 'Kassett', selected: true }, { id: 'i', desc: '', longName: 'Manual', selected: true }, { id: 'b', desc: '', longName: 'Kartong', selected: true }], extras: [] } };
    };

    $scope.editVariant = function (variant) {
        $scope.isEditingVariant = true;
        $scope.currentVariant = variant;
    };
    
    $scope.handleExtra = function (extra) {
        if (_.contains($scope.currentVariant.attr.extras, extra)) {
            $scope.currentVariant.attr.extras.splice(_.indexOf($scope.currentVariant.attr.extras, extra), 1);
        } else {
            $scope.currentVariant.attr.extras.push({ 'name': extra });
        }

        $scope.currentExtra = '';
    };

    $scope.addGame = function () {
        _.each($scope.game.data.variants, function(v) {
            v.attr.common = _.map(v.attr.common, function(a) {
                return { id: a.id, desc: a.desc, };
            });
        });

        $scope.game.data.regions.main = $scope.currentRegions.main.id;
        $scope.game.data.regions.sub = [$scope.currentRegions.sub.id];
        
        console.log(angular.toJson($scope.game));
        if ($scope.isEditing) {
            console.log('vill uppdatera');
            console.log(angular.toJson($scope.game));
            $http.post('/api/admin/update', { game: $scope.game })
                .success(function () {
                    $scope.postMessage = 'Spel uppdaterat';
                    $scope.game = { type: 'game', data: { console: consoles[0].id, regions: {}, variants: [] } };
                    $scope.currentRegions = {
                        main: baseRegions[0],
                        sub: baseRegions[0].regions[0]
                    };
                })
                .error(function () {
                    console.log('HIELP');
                });
            $scope.isEditing = false;
        } else {
            $http.post('/api/newgame', angular.toJson($scope.game)).
                success(function(response) {
                    $scope.postMessage = 'Spel sparat';
                    $scope.game = { type: 'game', data: { console: consoles[0].id, regions: {}, variants: [] } };
                }).
                error(function(id) {
                    console.log('nej nej NEJ');
                });
        }
    };

    $scope.validateFields = function () {
        return $scope.addGameForm.$valid && $scope.game.data.variants.length;
    };

    var latestResults = [];
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
            $scope.games = oldies;
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
                $scope.pendingPromise = $http.get('/api/search/null?q=' + $scope.q.substring(0, 3).toLowerCase() + '&r=' + $scope.userName);
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;
                    $scope.games = _.filter(res.games, function (game) {
                        return _.any(game.data.tags, function (tag) {
                            return _(tag).startsWith($scope.q.toLowerCase());
                        });
                    });
                    $scope.showQ = true;
                    console.log($scope.games);
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };
}]);