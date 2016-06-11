module.exports = function(){
    switch(process.env.NODE_ENV){
        case 'development':
            return getDevConf();

        case 'production':
            return getProdConf();

        default:
            return {};
    }
};

function getDevConf(){
	var config = {};

	config.couchdb = {};

	config.couchdb.url = 'http://localhost';
	config.couchdb.port = 5984;
    config.couchdb.database = 'sndb';
	config.couchdb.username = 'xxx';
	config.couchdb.password = 'yyy';

	return config;
}

function getProdConf(){
	var config = {};

	config.couchdb = {};

	//config.couchdb.url = 'https://app21098818.heroku:h03MiH3TtVfOIEhOgURxR28d@app21098818.heroku.cloudant.com';
	config.couchdb.url = 'https://sndb.smileupps.com';
	config.couchdb.port = '443';
	//config.couchdb.database = 'sndb';
	config.couchdb.username = 'xxx';
	config.couchdb.password = 'yyy';

	return config;
}