var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

    Object.defineProperty(exports, "__esModule", { value: true });
    var RocksetAPIError = /** @class */ (function (_super) {
        __extends(RocksetAPIError, _super);
        function RocksetAPIError(message, status, type) {
            if (type === void 0) { type = null; }
            var _this = _super.call(this, message) || this;
            _this.status = status;
            _this.type = type;
            return _this;
        }
        return RocksetAPIError;
    }(Error));
    var RocksetClient = /** @class */ (function () {
        function RocksetClient(authToken, host) {
            var _this = this;
            this._request = function (endpoint, method, body, signal, stream, contentType, self, responseBody) {
                if (method === void 0) { method = "GET"; }
                if (body === void 0) { body = null; }
                if (signal === void 0) { signal = null; }
                if (stream === void 0) { stream = false; }
                if (contentType === void 0) { contentType = "application/json"; }
                if (self === void 0) { self = true; }
                if (responseBody === void 0) { responseBody = true; }
                var headers = { authorization: _this.authToken };
                if (contentType) {
                    headers["content-type"] = contentType;
                }
                var path = self ? _this.host + "/v1/orgs/self/" + endpoint : _this.host + "/" + endpoint;
                console.log("QQQ path" );
                console.log(path);
                console.log("QQQ body" );
                console.log(body);
                console.log("QQQ headers" );
                console.log(headers);
                console.log("QQQ signal" );
                console.log(signal);

                return fetch(path, {
                    body: body,
                    headers: headers,
                    method: method,
                    signal: signal,
                }).then(function (resp) {
                    console.log("QQQ  success" );
                    console.log(resp);
                    if (resp.ok) {
                        if (stream) {
                            return resp;
                        }
                        else if (!responseBody) {
                            return null;
                        }
                        else {
                            return resp.json();
                        }
                    }
                    // On an error, we should have also received a JSON-formatted
                    // explanation of what is wrong.
                    return resp.json().then(function (errorBody) {
                        var message = (errorBody && errorBody.message) ?
                            errorBody.message :
                            resp.statusText;
                        throw new RocksetAPIError(message, resp.status, errorBody && errorBody.type);
                    });
                });
            };
            this.uploadFile = function (collectionName, formatParams, file, size) {
                var formData = new FormData();
                formData.append("params", JSON.stringify(formatParams));
                formData.append("file", file);
                formData.append("size", size);
                return _this._request("ws/commons/collections/" + collectionName + "/uploads", "POST", formData, null, false, null);
            };
            /* internal queries are run by the console - we tag them with /*CONSOLE*\/ so
               that they do not show up in the event log */
            this.queryInternal = function (sql) {
                var cleanupWhitespace = function (query) {
                    return query.replace(/\s+/g, " ").trim();
                };
                return _this.queryExplicit("/*CONSOLE*/ " + cleanupWhitespace(sql), null, false);
            };
            /* when the user uses the console to run a query (through the query runner) use this */
            this.queryExplicit = function (sql, signal, stream) {
                if (signal === void 0) { signal = null; }
                if (stream === void 0) { stream = true; }
                return _this._request("queries", "POST", JSON.stringify({ sql: { query: sql } }), signal, stream);
            };
            this.getCollectionSamples = function (collectionName) {
                return _this._request("ws/commons/collections/" + collectionName + "/samples");
            };
            this.getCollectionSchema = function (collectionName) {
                return _this._request("ws/commons/collections/" + collectionName + "/schema");
            };
            this.listCollections = function () {
                return _this._request("ws/commons/collections")
                    .then(function (resp) { return resp.data; });
            };
            this.getCollectionDetails = function (collectionName) {
                return _this._request("ws/commons/collections/" + collectionName)
                    .then(function (resp) { return resp.data; });
            };
            this.createCollection = function (collection) {
                return _this._request("ws/commons/collections", "POST", JSON.stringify(collection));
            };
            this.previewCollection = function (collection) {
                return _this._request("ws/commons/collections/preview", "POST", JSON.stringify(collection));
            };
            this.deleteCollection = function (collectionName) {
                return _this._request("ws/commons/collections/" + collectionName, "DELETE");
            };
            this.listFunctions = function () {
                var resp = [{
                        created_at: "2019-01-18T23:06:20Z",
                        created_by: "scott@rockset.com",
                        description: "My first function..",
                        name: "MyFunction",
                        params: [
                            {
                                name: "param1",
                                type: "string",
                            },
                            {
                                name: "param2",
                                type: "int",
                            },
                        ],
                        query: "SELECT citiessmaller.\"fields\".\"country\"\nFROM \"citiessmaller\"\nWHERE \"citiessmaller\".\"fields\".\"country\" like ':param1'\nLIMIT :param2",
                    }];
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve(resp);
                    }, 300);
                });
            };
            this.getFunctionDetails = function (functionName) {
                var resp = {
                    created_at: "2019-01-18T23:06:20Z",
                    created_by: "scott@rockset.com",
                    description: "My first function..",
                    name: "MyFunction",
                    params: [
                        {
                            name: "param1",
                            type: "string",
                        },
                        {
                            name: "param2",
                            type: "int",
                        },
                    ],
                    query: "SELECT citiessmaller.\"fields\".\"country\"\nFROM \"citiessmaller\"\nWHERE \"citiessmaller\".\"fields\".\"country\" like ':param1'\nLIMIT :param2",
                };
                return new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve(resp);
                    }, 300);
                });
            };
            this.listIntegrations = function () {
                return _this._request("integrations")
                    .then(function (resp) { return resp.data; });
            };
            this.createIntegration = function (integration) {
                return _this._request("integrations", "POST", JSON.stringify(integration));
            };
            this.deleteIntegration = function (integrationName) {
                return _this._request("integrations/" + integrationName, "DELETE");
            };
            this.getApiKeys = function () {
                return _this._request("users/self/apikeys");
            };
            this.deleteApiKey = function (name) {
                return _this._request("users/self/apikeys/" + name, "DELETE");
            };
            this.addApiKey = function (name) {
                return _this._request("users/self/apikeys", "POST", JSON.stringify({ name: name }));
            };
            this.getCurrentUser = function () {
                return _this._request("users/self");
            };
            this.updateCurrentUser = function (request) {
                return _this._request("users/self", "POST", JSON.stringify(request));
            };
            this.getUsers = function () {
                return _this._request("users");
            };
            this.addUser = function (user) {
                return _this._request("users", "POST", JSON.stringify(user));
            };
            this.deleteUser = function (user) {
                return _this._request("users/" + user, "DELETE");
            };
            this.getOrg = function () {
                return _this._request("");
            };
            this.getOrgState = function () {
                return _this._request("state");
            };
            this.setOrgState = function (state) {
                // Note: currently API endpoint does not take state param, only sets to ACTIVE
                return _this._request("state", "POST");
            };
            this.getOrgLimits = function () {
                return _this._request("limits");
            };
            this.getOrgUsage = function () {
                return _this._request("usage");
            };
            this.getBillingInfo = function () {
                return _this._request("billing");
            };
            this.getSsoSettings = function () {
                return _this._request("sso");
            };
            this.addBillingInfo = function (billingInfo) {
                return _this._request("billing", "POST", JSON.stringify(billingInfo));
            };
            this.updateSso = function (request) {
                return _this._request("sso", "POST", JSON.stringify(request));
            };
            this.deleteBillingInfo = function () {
                return _this._request("billing", "DELETE");
            };
            this.createOrg = function (request) {
                return _this._request("v1/provision/orgs", "POST", JSON.stringify(request), null, false, "application/json", false, false);
            };
            this.provisionUser = function () {
                return _this._request("v1/provision/orgs/self/users", "POST", null, null, false, "application/json", false, false);
            };
            this.authToken = authToken;
            this.host = host;
        }
        return RocksetClient;
    }());

    export default function (opts) {
        opts = opts || {};
        if (!opts.host) {
            throw new Error("host option required");
        }
        if (!opts.apikey && !opts.jwt) {
            throw new Error("either apikey or jwt are required options");
        }
        var authToken = opts.apikey ? "ApiKey " + opts.apikey : "Bearer " + opts.jwt;
        return new RocksetClient(authToken, opts.host);
    };
