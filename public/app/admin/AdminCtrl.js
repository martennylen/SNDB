app.controller('AdminCtrl', ['$scope', '$http', '$timeout', '$location', 'SearchService', 'consoles', 'baseRegions', 'user',
    function ($scope, $http, $timeout, $location, SearchService, consoles, baseRegions, user) {
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
        console.log(game);
        _.each(game.data.variants, function (v) {
            _.each(v.attr.common, function (a) {
                a.selected = true;
            });
        });

        var currentRegion = _.findWhere(baseRegions, { id: game.data.regions.main });
        currentRegion.selected = true;
        $scope.currentRegions.main = currentRegion;

        var currentSubRegion = _.findWhere(currentRegion.regions, { id: game.data.regions.sub });
        currentSubRegion.selected = true;
        $scope.currentRegions.sub = currentSubRegion;
        
        $scope.game = game;
        $scope.games = [];
        $scope.currentVariant = $scope.currentVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', longName: 'Kassett', selected: true }, { id: 'i', desc: '', longName: 'Manual', selected: true }, { id: 'b', desc: '', longName: 'Kartong', selected: true }], extras: [] } };
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
        $scope.game.data.regions.sub = $scope.currentRegions.sub.id;
        
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

    $scope.search = function() {
        SearchService.SearchInternal($scope);
    };

    }]);