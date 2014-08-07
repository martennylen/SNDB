var _u = require('underscore'),
    Q = require('q'),
    couch = require('../couch'),
    request = require('request'),
    db = couch.db();

var indexOfValue = _u.indexOf;
_u.mixin({

    // return the index of the first array element passing a test
    indexOf: function (array, test) {
        // delegate to standard indexOf if the test isn't a function
        if (!_u.isFunction(test)) return indexOfValue(array, test);
        // otherwise, look for the index
        for (var x = 0; x < array.length; x++) {
            if (test(array[x])) return x;
        }
        // not found, return fail value
        return -1;
    }

});

module.exports = function(app, passport) {
    var auth = function(req, res, next) {
        if (!req.isAuthenticated()) {
            res.send(401);
        } else {
            next();
        }
    };

    //app.get('/api', function (req, res) {
    //    res.header("Access-Control-Allow-Origin", "http://localhost");
    //    res.header("Access-Control-Allow-Methods", "GET, POST");
    //});

    app.post('/api/game/add', function (req, res) {
        var game = req.body;
        game.data.tags = [game.data.name.replace(/[^a-z0-9\s]/gi, '').toLowerCase()];

        if (_u.indexOf(game.data.name, ' ') > -1) {
            _u.each(game.data.name.toLowerCase().split(' '), function(word) {
                if (word.length > 2 && word !== 'the') {
                    game.data.tags.push(word.replace(/[^a-z0-9\s]/gi, '').toLowerCase());
                }
            });
        }

        db.save(game, function (err, resp) {
            if (err) {
                res.send(500);
            }

            res.send({id: resp.id, tags: game.data.tags});
        });
    });

    app.post('/api/game/update', function (req, res) {
        var game = req.body;
        var toInsert = [];
        var error = false;

        _u.each(game.children, function (child) {
            if (!child.data.accessInfo) {
                child.data.accessInfo = {
                    created: new Date().valueOf()
                };
            }
            
            if (child.id.length === 0) { //New edition
                toInsert.push(child);
            } else { //Update
                child.data.accessInfo.updated = new Date().valueOf();
                if (!saveDoc(child.id, child.data, "/data")) {
                    error = true;
                };
            }
        });

        if (toInsert.length > 0) {
            db.save(toInsert, function(err, resp) {
                if (err) {
                    error = true;
                } else {
                    var c = 0;
                    _u.each(toInsert, function(inserted) {
                        var exists = _u.indexOf(game.releases, function(r) {
                            return r.region == inserted.data.regions.main;
                        });
                        if (exists > -1) {
                            game.releases[exists].editions.push({ subregion: inserted.data.regions.sub, id: resp[c].id });
                        } else {
                            console.log('FANNS EJ');
                            game.releases.push({ region: inserted.data.regions.main, editions: [{ subregion: inserted.data.regions.sub, id: resp[c].id }] });
                            console.log(game.releases);
                        }
                        c++;
                    });

                    saveDoc(game.id, game.releases, "/releases");
                }
            });
        }

        if (error) {
            res.send(500);
        }
        res.send(200);

        //db.save(game, function (err, resp) {
        //    if (err) {
        //        res.send(500);
        //    }

        //    res.send({ id: resp.id });
        //});
    });

    function saveDoc(id, doc, path) {
        var json = { };
        json[path] = doc;
        
        request.put({
            uri: couch.updatePath() + id,
            body: JSON.stringify(json)
        }, function (err) {
            if (err) {
                return false;
            }
        });

        return true;
    };

    app.get('/api/game/:gameId', function (req, res) {
        db.view('games/by_id', {key: req.params.gameId}, function (err, response) {
            if (err) {
                res.send(500);
            }
            res.send(mapAttributes(response, true)[0]);
        });
    });

    app.get('/api/admin/search', function (req, res) {
        var reqObj = {
            startkey: [req.query.q],
            endkey: [req.query.q + '\u9999']
        };
        
        db.view('games/by_parent_tags', reqObj, function (err, response) {
            if (err) {
                res.send(500);
            }

            response = _u.uniq(response, function (g) { return g.id; });
            response = _u.map(response, function(r) {
                return {                    
                    id: r.value.id,
                    type: r.value.type,
                    data: r.value.data,
                    releases: r.value.rel
                };
            });
            res.send({games: response});
        });
    });

    app.get('/api/search/:consoleName', function (req, res) {
        var reqObj = {
            startkey: [req.params.consoleName, req.query.q],
            endkey: [req.params.consoleName, req.query.q + '\u9999']
        };
        
        if (req.params.consoleName === 'undefined') {
            reqObj = {
                startkey: [{}, req.query.q],
                endkey: [{}, req.query.q + '\u9999']
            };
        }

        db.view('games/by_tags', reqObj, function (err, response) {
            if (err) {
                res.send(500);
            }

            response = _u.uniq(response, function (g) { return g.id; });
            var gameIds = _u.map(response, function (g) { return req.user.id + '_' + g.id; });

            if (req.user !== undefined && req.params.consoleName !== 'undefined') {
                db.view('games/by_item_id', {
                    keys: gameIds
                    //startkey: [req.user.id, req.params.consoleName, req.query.q],
                    //endkey: [req.user.id, req.params.consoleName, req.query.q + '\u9999'],
                    //include_docs: true
                }, function (e, resp) {
                    if (e) {
                        res.send(500);
                    }
                    console.log(resp);
                    var list = mapGameInformation(resp, response, (req.query.r !== 'undefined'));
                    res.send({ games: list, loggedIn: true });
                });
            } else {
                res.send({
                    games: mapAttributes(response, false), loggedIn: false
                });
            }
        });
    });
    
    function mapGameInformation(resp, response, isUserScope) {
        var result = [];
        var hasGames = resp.length > 0;
        var found = -1;
        
        _u.each(response, function (game) {
            if (hasGames) {
                found = _u.indexOf(resp, function (comb) {
                    return game.value.id === comb.value.game.id;
                });
            }

            _u.each(game.value.data.variants, function (v, j) {
                v.attr.common = _u.map(v.attr.common, function (attr, i) {
                    return { id: attr.id, desc: attr.desc, included: _u.isUndefined(attr.included) ? true : attr.included, status: ((found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].common[i] : false : false) };
                });

                v.attr.extras = _u.map(v.attr.extras, function (attr, i) {
                    return { id: i, name: attr.name, status: ((found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].extras[i] : false : false) };
                });

                v.attr.note = (found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].note : '' : '';
                v.extrasComplete = (found > -1) ? v.attr.extras.length ? _u.all(_u.pluck(v.attr.extras, 'status')) : true : false;
                v.isComplete = (found > -1) ? _u.all(_u.pluck(v.attr.common, 'status')) && v.extrasComplete : false;
                v.someComplete = (found > -1) ? _u.some(_u.pluck(v.attr.common, 'status')) : false;

                v.isNew = (found > 1) ? false : true;
            });

            //game.value.parent = game.doc._id;

            if (found > -1) {
                game.value.item = resp[found].id;
                game.value.isNew = false;
                game.value.isComplete = _u.some(_u.pluck(game.value.data.variants, 'isComplete'));
                game.value.someComplete = _u.some(_u.pluck(game.value.data.variants, 'someComplete'));
                resp.splice(found, 1);
            } else {
                game.value.isNew = true;
            }

            if (!isUserScope) {
                result.push(game.value);
            } else {
                if (found > -1) {
                    result.push(game.value);
                }
            }
        });

        return result;
    }
    
    function mapAttributes(response, isAdminScope) {
        var result = [];
        
        _u.each(response, function (game) {
            _u.each(game.value.data.variants, function(v) {
                v.attr.common = _u.map(v.attr.common, function (attr) {
                    return { id: attr.id, desc: attr.desc, included: _u.isUndefined(attr.included) ? true : attr.included };
                });
                v.attr.extras = _u.map(v.attr.extras, function (attr, i) {
                    return { id: i, name: attr.name };
                });
            });
            result.push(game.value);
        });

        return result;
    }
    
    app.get('/api/:consoleName/:regionName/:subRegionName', function (req, res) {
        var startkey = [req.params.consoleName, req.params.regionName, req.params.subRegionName];

        if (req.query.gameName) {
            startkey = [req.params.consoleName, req.params.regionName, req.params.subRegionName, req.query.gameName.replace('+', '%20')];
        }
        db.view('games/by_console', { 
            startkey: startkey,
            endkey: [req.params.consoleName, req.params.regionName, req.params.subRegionName, {}],
            startkey_docid: req.query.docid || '',
                limit: 21,
                skip: req.query.skip || 0,
                include_docs: true
        }, function (err, response) {
            if (req.user !== undefined) {
                db.view('games/by_user', {
                    startkey: [req.user.id, req.params.consoleName],
                    endkey: [req.user.id, req.params.consoleName, {}]
                }, function(e, resp) {
                    if (e) {
                        res.send(500);
                    }
                    
                    var list = mapGameInformation(resp, response, false);  
                    res.send({ games: list, loggedIn: true });
                });
            } else {
                res.send({
                    games: mapAttributes(response, false), loggedIn: false
                });
            }
        });
    });

    app.get('/api/:consoleName/:regionName/:subRegionName/:gameName', function (req, res) {
        db.view('games/all', { key: req.params.gameName.split('-').join(' ').split('+').join('-') }, function (err, response) {
            //TA BARA DET VI BEHÖVER, INTE HELA COUCH-MODELLEN
            if (err) {
                res.send(404);
            }
            res.send(response[0].value);
        });
    });

    var sortOrder = ['nes', 'snes', 'n64', 'gc', 'gb', 'gba', 'gbc', 'wii', 'wiiu'];

    app.get('/api/stats', function (req, res) {
        var level = req.query.level;
        var reqObj = { group_level: level };

        var getStats = function (obj) {
            var deferred = Q.defer();
            db.view('games/stats_by_console', obj, function (err, resp) {
                deferred.resolve(resp);
            });
            return deferred.promise;
        };

        getStats(reqObj).then(function (consoles) {
            return Q.all(_u.map(consoles, function (c) {
                reqObj.startkey = [c.key[0]];
                reqObj.endkey = [c.key[0], {}];
                reqObj.group_level = 2;
                return getStats(reqObj).then(function (regions) {
                    c.regions = regions;
                    return Q.all(_u.map(regions, function (r) {
                        reqObj.startkey = [r.key[0], r.key[1]];
                        reqObj.endkey = [r.key[0], r.key[1], {}];
                        reqObj.group_level = 3;
                        return getStats(reqObj).then(function (subRegions) {
                            r.subRegions = _u.sortBy(_u.map(subRegions, function(sr) {
                                return { id: sr.key[2], count: sr.value };
                            }), function(sr) {
                                return sr.count;
                            }).reverse();
                            return subRegions;
                        });
                    })).then(function (allSubRegions) {
                        return regions;
                    });
                });
            })).then(function (allRegions) {
                return _u.map(consoles, function(c) {
                    return {
                        id: c.key[0],
                        count: c.value,
                        regions: _u.sortBy(_u.map(c.regions, function(r) {
                            return { id: r.key[1], count: r.value, subRegions: r.subRegions };
                        }), function(c) {
                            return c.count;
                        }).reverse()
                    };
                });
            });
        }).then(function (consoles) {
            res.send(_u.sortBy(consoles, function (c) { return _u.indexOf(sortOrder, c.id); }));
        });
    });
}