"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var refs = require("./refs");
var Promise = refs.Promise;
exports.ioDatatypes = require("./io-data-types");
var _ = refs.lodash;
/**
 *  helper utils used by the phantomjscloud api.
 */
var utils = require("./utils");
function setDebug(isDebug) {
    utils.isDebug = isDebug;
}
exports.setDebug = setDebug;
/**
 * errors thrown by this module derive from this
 */
var PhantomJsCloudException = (function (_super) {
    __extends(PhantomJsCloudException, _super);
    function PhantomJsCloudException() {
        _super.apply(this, arguments);
    }
    return PhantomJsCloudException;
}(Error));
exports.PhantomJsCloudException = PhantomJsCloudException;
/**
 * errors thrown by the BrowserApi derive from this
 */
var PhantomJsCloudBrowserApiException = (function (_super) {
    __extends(PhantomJsCloudBrowserApiException, _super);
    function PhantomJsCloudBrowserApiException(message, statusCode, payload, headers) {
        _super.call(this, message);
        this.statusCode = statusCode;
        this.payload = payload;
        this.headers = headers;
    }
    return PhantomJsCloudBrowserApiException;
}(PhantomJsCloudException));
exports.PhantomJsCloudBrowserApiException = PhantomJsCloudBrowserApiException;
/**
 *  the defaults used if options are not passed to a new BrowserApi object.
 */
exports.defaultBrowserApiOptions = {
    endpointOrigin: "https://PhantomJsCloud.com",
    apiKey: "a-demo-key-with-low-quota-per-ip-address",
    suppressDemoKeyWarning: false,
};
/**
 * The PhantomJsCloud Browser Api
 */
var BrowserApi = (function () {
    function BrowserApi(keyOrOptions) {
        if (keyOrOptions === void 0) { keyOrOptions = {}; }
        this._endpointPath = "/api/browser/v2/";
        this._browserV2RequestezEndpoint = new utils.EzEndpointFunction();
        if (typeof keyOrOptions === "string") {
            this.options = { apiKey: keyOrOptions };
        }
        else {
            this.options = keyOrOptions;
        }
        _.defaults(this.options, exports.defaultBrowserApiOptions);
        if (this.options.apiKey === exports.defaultBrowserApiOptions.apiKey && this.options.suppressDemoKeyWarning !== true) {
            console.warn("\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n");
        }
        this._autoscaler = new utils.AutoscaleConsumer(this._task_worker.bind(this));
    }
    /**
     * the autoscaler worker function
     * @param task
     */
    BrowserApi.prototype._task_worker = function (task) {
        utils.debugLog("_task_worker START");
        _.defaults(task.customOptions, this.options);
        /**
         *  path including apiKey
         */
        var finalPath = this._endpointPath + task.customOptions.apiKey + "/";
        return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
            .then(function (httpResponse) {
            utils.debugLog("_task_worker httpResponse", httpResponse.data);
            return Promise.resolve(httpResponse.data);
        }, function (errResponse) {
            utils.debugLog("_task_worker errResponse", errResponse);
            var statusCode = errResponse.status;
            var ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode.toString(), statusCode, errResponse.data, errResponse.headers);
            return Promise.reject(ex);
        }).finally(function () {
            utils.debugLog("_task_worker FINISH");
        });
    };
    BrowserApi.prototype.requestSingle = function (request, customOptions) {
        if (customOptions === void 0) { customOptions = {}; }
        utils.debugLog("requestSingle");
        var _request = request;
        var userRequest;
        if (_request.pages != null && _.isArray(_request.pages)) {
            userRequest = _request;
        }
        else {
            userRequest = { pages: [_request] };
        }
        //set outputAsJson
        _.forEach(userRequest.pages, function (page) { page.outputAsJson = true; });
        var task = {
            userRequest: userRequest,
            customOptions: customOptions
        };
        return this._autoscaler.process(task);
    };
    BrowserApi.prototype.requestBatch = function (requests) {
        var _this = this;
        var responsePromises = [];
        _.forEach(requests, function (request) {
            responsePromises.push(_this.requestSingle(request));
        });
        return responsePromises;
    };
    return BrowserApi;
}());
exports.BrowserApi = BrowserApi;
//# sourceMappingURL=_main.js.map