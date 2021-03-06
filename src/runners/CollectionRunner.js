var jsface                 = require("jsface"),
	AbstractRunner         = require("./AbstractRunner"),
	RequestRunner          = require("./RequestRunner"),
	ResponseHandlerFactory = require('../responseHandlers/ResponseHandlerFactory'),
	_und                   = require('underscore'),
	log                    = require('../utilities/Logger'),
	EventEmitter           = require('../utilities/EventEmitter'),
	Options                = require('../utilities/Options'),
	ResponseExporter       = require("../utilities/ResponseExporter");


/**
 * @class CollectionRunner
 * @param {CollectionModel} collection Takes a Collection of RequestModel
 * as a input and executes the RequestRunner on them.
 * @extends AbstractRunner
 * @mixes Options
 */
var CollectionRunner = jsface.Class([AbstractRunner, Options, EventEmitter], {
	constructor: function(collection, options, runMode) {
		this.$class.$super.call(this, collection);
		this.setOptions(options);
		this.runMode = runMode;
	},

	/**
	 * @function
	 * @memberOf CollectionRunner
	 */
	execute: function() {

		// Initialize the response handler using a factory
		this.ResponseHandler = ResponseHandlerFactory.createResponseHandler(this.getOptions());
		if (!this.ResponseHandler) {
			log.throwError('The module provided does not exist.');
		}

		this._addEventListeners();

		// Sets up the response handler to respond to the requestExecuted event
		this.ResponseHandler.initialize();

		_und.each(this.collection, function(postmanRequest) {
			RequestRunner.addRequest(postmanRequest);
		}, this);

		// Start the runner
		RequestRunner.setDelay(this.opts.delay);
		RequestRunner.setStrictSSL(this.opts.strictSSL);
		RequestRunner.setSecureProtocol(this.opts.secureProtocol);
		RequestRunner.setRunMode(this.runMode);
		RequestRunner.start();

		this.$class.$superp.execute.call(this);
	},

	// adding event listeners to signal end of requestRunner and collectionRunner
	_addEventListeners: function() {
		this._onRequestRunnerOverBinded = this._onRequestRunnerOver.bind(this);
		this.addEventListener('requestRunnerOver', this._onRequestRunnerOverBinded);
	},

	// run when requestRunner runs over the ordered requests in this collection
	_onRequestRunnerOver: function() {
		this.ResponseHandler.clear();
		if(this.opts.summary) {
			ResponseExporter.showIterationSummary();
		}

		this.removeEventListener('requestRunnerOver', this._onRequestRunnerOverBinded);
		this.emit('collectionRunnerOver');
	}
});

module.exports = CollectionRunner;
