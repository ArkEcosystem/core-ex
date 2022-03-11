/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader,
	$Writer = $protobuf.Writer,
	$util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.blocks = (function () {
	var blocks = {};

	blocks.PostBlockRequest = (function () {
		function PostBlockRequest(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		PostBlockRequest.prototype.block = $util.newBuffer([]);

		PostBlockRequest.prototype.headers = null;

		PostBlockRequest.create = function create(properties) {
			return new PostBlockRequest(properties);
		};

		PostBlockRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.block != null && Object.hasOwnProperty.call(message, "block"))
				writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.block);
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
			return writer;
		};

		PostBlockRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		PostBlockRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.blocks.PostBlockRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.block = reader.bytes();
						break;
					case 2:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		PostBlockRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		PostBlockRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.block != null && message.hasOwnProperty("block"))
				if (!((message.block && typeof message.block.length === "number") || $util.isString(message.block)))
					return "block: buffer expected";
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		PostBlockRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.blocks.PostBlockRequest) return object;
			var message = new $root.blocks.PostBlockRequest();
			if (object.block != null)
				if (typeof object.block === "string")
					$util.base64.decode(
						object.block,
						(message.block = $util.newBuffer($util.base64.length(object.block))),
						0,
					);
				else if (object.block.length) message.block = object.block;
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".blocks.PostBlockRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		PostBlockRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				if (options.bytes === String) object.block = "";
				else {
					object.block = [];
					if (options.bytes !== Array) object.block = $util.newBuffer(object.block);
				}
				object.headers = null;
			}
			if (message.block != null && message.hasOwnProperty("block"))
				object.block =
					options.bytes === String
						? $util.base64.encode(message.block, 0, message.block.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.block)
						: message.block;
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		PostBlockRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return PostBlockRequest;
	})();

	blocks.PostBlockResponse = (function () {
		function PostBlockResponse(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		PostBlockResponse.prototype.status = false;

		PostBlockResponse.prototype.height = 0;

		PostBlockResponse.create = function create(properties) {
			return new PostBlockResponse(properties);
		};

		PostBlockResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.status != null && Object.hasOwnProperty.call(message, "status"))
				writer.uint32(/* id 1, wireType 0 =*/ 8).bool(message.status);
			if (message.height != null && Object.hasOwnProperty.call(message, "height"))
				writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.height);
			return writer;
		};

		PostBlockResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		PostBlockResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.blocks.PostBlockResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.status = reader.bool();
						break;
					case 2:
						message.height = reader.uint32();
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		PostBlockResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		PostBlockResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.status != null && message.hasOwnProperty("status"))
				if (typeof message.status !== "boolean") return "status: boolean expected";
			if (message.height != null && message.hasOwnProperty("height"))
				if (!$util.isInteger(message.height)) return "height: integer expected";
			return null;
		};

		PostBlockResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.blocks.PostBlockResponse) return object;
			var message = new $root.blocks.PostBlockResponse();
			if (object.status != null) message.status = Boolean(object.status);
			if (object.height != null) message.height = object.height >>> 0;
			return message;
		};

		PostBlockResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				object.status = false;
				object.height = 0;
			}
			if (message.status != null && message.hasOwnProperty("status")) object.status = message.status;
			if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
			return object;
		};

		PostBlockResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return PostBlockResponse;
	})();

	blocks.GetBlocksRequest = (function () {
		function GetBlocksRequest(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetBlocksRequest.prototype.lastBlockHeight = 0;

		GetBlocksRequest.prototype.blockLimit = 0;

		GetBlocksRequest.prototype.headersOnly = false;

		GetBlocksRequest.prototype.serialized = false;

		GetBlocksRequest.prototype.headers = null;

		GetBlocksRequest.create = function create(properties) {
			return new GetBlocksRequest(properties);
		};

		GetBlocksRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.lastBlockHeight != null && Object.hasOwnProperty.call(message, "lastBlockHeight"))
				writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.lastBlockHeight);
			if (message.blockLimit != null && Object.hasOwnProperty.call(message, "blockLimit"))
				writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.blockLimit);
			if (message.headersOnly != null && Object.hasOwnProperty.call(message, "headersOnly"))
				writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.headersOnly);
			if (message.serialized != null && Object.hasOwnProperty.call(message, "serialized"))
				writer.uint32(/* id 4, wireType 0 =*/ 32).bool(message.serialized);
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
			return writer;
		};

		GetBlocksRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetBlocksRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.blocks.GetBlocksRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.lastBlockHeight = reader.uint32();
						break;
					case 2:
						message.blockLimit = reader.uint32();
						break;
					case 3:
						message.headersOnly = reader.bool();
						break;
					case 4:
						message.serialized = reader.bool();
						break;
					case 5:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetBlocksRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetBlocksRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.lastBlockHeight != null && message.hasOwnProperty("lastBlockHeight"))
				if (!$util.isInteger(message.lastBlockHeight)) return "lastBlockHeight: integer expected";
			if (message.blockLimit != null && message.hasOwnProperty("blockLimit"))
				if (!$util.isInteger(message.blockLimit)) return "blockLimit: integer expected";
			if (message.headersOnly != null && message.hasOwnProperty("headersOnly"))
				if (typeof message.headersOnly !== "boolean") return "headersOnly: boolean expected";
			if (message.serialized != null && message.hasOwnProperty("serialized"))
				if (typeof message.serialized !== "boolean") return "serialized: boolean expected";
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		GetBlocksRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.blocks.GetBlocksRequest) return object;
			var message = new $root.blocks.GetBlocksRequest();
			if (object.lastBlockHeight != null) message.lastBlockHeight = object.lastBlockHeight >>> 0;
			if (object.blockLimit != null) message.blockLimit = object.blockLimit >>> 0;
			if (object.headersOnly != null) message.headersOnly = Boolean(object.headersOnly);
			if (object.serialized != null) message.serialized = Boolean(object.serialized);
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".blocks.GetBlocksRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		GetBlocksRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				object.lastBlockHeight = 0;
				object.blockLimit = 0;
				object.headersOnly = false;
				object.serialized = false;
				object.headers = null;
			}
			if (message.lastBlockHeight != null && message.hasOwnProperty("lastBlockHeight"))
				object.lastBlockHeight = message.lastBlockHeight;
			if (message.blockLimit != null && message.hasOwnProperty("blockLimit"))
				object.blockLimit = message.blockLimit;
			if (message.headersOnly != null && message.hasOwnProperty("headersOnly"))
				object.headersOnly = message.headersOnly;
			if (message.serialized != null && message.hasOwnProperty("serialized"))
				object.serialized = message.serialized;
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		GetBlocksRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return GetBlocksRequest;
	})();

	blocks.GetBlocksResponse = (function () {
		function GetBlocksResponse(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetBlocksResponse.prototype.blocks = $util.newBuffer([]);

		GetBlocksResponse.create = function create(properties) {
			return new GetBlocksResponse(properties);
		};

		GetBlocksResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.blocks != null && Object.hasOwnProperty.call(message, "blocks"))
				writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.blocks);
			return writer;
		};

		GetBlocksResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetBlocksResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.blocks.GetBlocksResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.blocks = reader.bytes();
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetBlocksResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetBlocksResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.blocks != null && message.hasOwnProperty("blocks"))
				if (!((message.blocks && typeof message.blocks.length === "number") || $util.isString(message.blocks)))
					return "blocks: buffer expected";
			return null;
		};

		GetBlocksResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.blocks.GetBlocksResponse) return object;
			var message = new $root.blocks.GetBlocksResponse();
			if (object.blocks != null)
				if (typeof object.blocks === "string")
					$util.base64.decode(
						object.blocks,
						(message.blocks = $util.newBuffer($util.base64.length(object.blocks))),
						0,
					);
				else if (object.blocks.length) message.blocks = object.blocks;
			return message;
		};

		GetBlocksResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults)
				if (options.bytes === String) object.blocks = "";
				else {
					object.blocks = [];
					if (options.bytes !== Array) object.blocks = $util.newBuffer(object.blocks);
				}
			if (message.blocks != null && message.hasOwnProperty("blocks"))
				object.blocks =
					options.bytes === String
						? $util.base64.encode(message.blocks, 0, message.blocks.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.blocks)
						: message.blocks;
			return object;
		};

		GetBlocksResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		GetBlocksResponse.BlockHeader = (function () {
			function BlockHeader(properties) {
				if (properties)
					for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
						if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
			}

			BlockHeader.prototype.id = "";

			BlockHeader.prototype.idHex = "";

			BlockHeader.prototype.version = 0;

			BlockHeader.prototype.timestamp = 0;

			BlockHeader.prototype.previousBlock = "";

			BlockHeader.prototype.previousBlockHex = "";

			BlockHeader.prototype.height = 0;

			BlockHeader.prototype.numberOfTransactions = 0;

			BlockHeader.prototype.totalAmount = "";

			BlockHeader.prototype.totalFee = "";

			BlockHeader.prototype.reward = "";

			BlockHeader.prototype.payloadLength = 0;

			BlockHeader.prototype.payloadHash = "";

			BlockHeader.prototype.generatorPublicKey = "";

			BlockHeader.prototype.blockSignature = "";

			BlockHeader.prototype.transactions = $util.newBuffer([]);

			BlockHeader.create = function create(properties) {
				return new BlockHeader(properties);
			};

			BlockHeader.encode = function encode(message, writer) {
				if (!writer) writer = $Writer.create();
				if (message.id != null && Object.hasOwnProperty.call(message, "id"))
					writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
				if (message.idHex != null && Object.hasOwnProperty.call(message, "idHex"))
					writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.idHex);
				if (message.version != null && Object.hasOwnProperty.call(message, "version"))
					writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.version);
				if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
					writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.timestamp);
				if (message.previousBlock != null && Object.hasOwnProperty.call(message, "previousBlock"))
					writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.previousBlock);
				if (message.previousBlockHex != null && Object.hasOwnProperty.call(message, "previousBlockHex"))
					writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.previousBlockHex);
				if (message.height != null && Object.hasOwnProperty.call(message, "height"))
					writer.uint32(/* id 7, wireType 0 =*/ 56).uint32(message.height);
				if (message.numberOfTransactions != null && Object.hasOwnProperty.call(message, "numberOfTransactions"))
					writer.uint32(/* id 8, wireType 0 =*/ 64).uint32(message.numberOfTransactions);
				if (message.totalAmount != null && Object.hasOwnProperty.call(message, "totalAmount"))
					writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.totalAmount);
				if (message.totalFee != null && Object.hasOwnProperty.call(message, "totalFee"))
					writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.totalFee);
				if (message.reward != null && Object.hasOwnProperty.call(message, "reward"))
					writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.reward);
				if (message.payloadLength != null && Object.hasOwnProperty.call(message, "payloadLength"))
					writer.uint32(/* id 12, wireType 0 =*/ 96).uint32(message.payloadLength);
				if (message.payloadHash != null && Object.hasOwnProperty.call(message, "payloadHash"))
					writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.payloadHash);
				if (message.generatorPublicKey != null && Object.hasOwnProperty.call(message, "generatorPublicKey"))
					writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.generatorPublicKey);
				if (message.blockSignature != null && Object.hasOwnProperty.call(message, "blockSignature"))
					writer.uint32(/* id 15, wireType 2 =*/ 122).string(message.blockSignature);
				if (message.transactions != null && Object.hasOwnProperty.call(message, "transactions"))
					writer.uint32(/* id 16, wireType 2 =*/ 130).bytes(message.transactions);
				return writer;
			};

			BlockHeader.encodeDelimited = function encodeDelimited(message, writer) {
				return this.encode(message, writer).ldelim();
			};

			BlockHeader.decode = function decode(reader, length) {
				if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
				var end = length === undefined ? reader.len : reader.pos + length,
					message = new $root.blocks.GetBlocksResponse.BlockHeader();
				while (reader.pos < end) {
					var tag = reader.uint32();
					switch (tag >>> 3) {
						case 1:
							message.id = reader.string();
							break;
						case 2:
							message.idHex = reader.string();
							break;
						case 3:
							message.version = reader.uint32();
							break;
						case 4:
							message.timestamp = reader.uint32();
							break;
						case 5:
							message.previousBlock = reader.string();
							break;
						case 6:
							message.previousBlockHex = reader.string();
							break;
						case 7:
							message.height = reader.uint32();
							break;
						case 8:
							message.numberOfTransactions = reader.uint32();
							break;
						case 9:
							message.totalAmount = reader.string();
							break;
						case 10:
							message.totalFee = reader.string();
							break;
						case 11:
							message.reward = reader.string();
							break;
						case 12:
							message.payloadLength = reader.uint32();
							break;
						case 13:
							message.payloadHash = reader.string();
							break;
						case 14:
							message.generatorPublicKey = reader.string();
							break;
						case 15:
							message.blockSignature = reader.string();
							break;
						case 16:
							message.transactions = reader.bytes();
							break;
						default:
							reader.skipType(tag & 7);
							break;
					}
				}
				return message;
			};

			BlockHeader.decodeDelimited = function decodeDelimited(reader) {
				if (!(reader instanceof $Reader)) reader = new $Reader(reader);
				return this.decode(reader, reader.uint32());
			};

			BlockHeader.verify = function verify(message) {
				if (typeof message !== "object" || message === null) return "object expected";
				if (message.id != null && message.hasOwnProperty("id"))
					if (!$util.isString(message.id)) return "id: string expected";
				if (message.idHex != null && message.hasOwnProperty("idHex"))
					if (!$util.isString(message.idHex)) return "idHex: string expected";
				if (message.version != null && message.hasOwnProperty("version"))
					if (!$util.isInteger(message.version)) return "version: integer expected";
				if (message.timestamp != null && message.hasOwnProperty("timestamp"))
					if (!$util.isInteger(message.timestamp)) return "timestamp: integer expected";
				if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
					if (!$util.isString(message.previousBlock)) return "previousBlock: string expected";
				if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
					if (!$util.isString(message.previousBlockHex)) return "previousBlockHex: string expected";
				if (message.height != null && message.hasOwnProperty("height"))
					if (!$util.isInteger(message.height)) return "height: integer expected";
				if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
					if (!$util.isInteger(message.numberOfTransactions)) return "numberOfTransactions: integer expected";
				if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
					if (!$util.isString(message.totalAmount)) return "totalAmount: string expected";
				if (message.totalFee != null && message.hasOwnProperty("totalFee"))
					if (!$util.isString(message.totalFee)) return "totalFee: string expected";
				if (message.reward != null && message.hasOwnProperty("reward"))
					if (!$util.isString(message.reward)) return "reward: string expected";
				if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
					if (!$util.isInteger(message.payloadLength)) return "payloadLength: integer expected";
				if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
					if (!$util.isString(message.payloadHash)) return "payloadHash: string expected";
				if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
					if (!$util.isString(message.generatorPublicKey)) return "generatorPublicKey: string expected";
				if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
					if (!$util.isString(message.blockSignature)) return "blockSignature: string expected";
				if (message.transactions != null && message.hasOwnProperty("transactions"))
					if (
						!(
							(message.transactions && typeof message.transactions.length === "number") ||
							$util.isString(message.transactions)
						)
					)
						return "transactions: buffer expected";
				return null;
			};

			BlockHeader.fromObject = function fromObject(object) {
				if (object instanceof $root.blocks.GetBlocksResponse.BlockHeader) return object;
				var message = new $root.blocks.GetBlocksResponse.BlockHeader();
				if (object.id != null) message.id = String(object.id);
				if (object.idHex != null) message.idHex = String(object.idHex);
				if (object.version != null) message.version = object.version >>> 0;
				if (object.timestamp != null) message.timestamp = object.timestamp >>> 0;
				if (object.previousBlock != null) message.previousBlock = String(object.previousBlock);
				if (object.previousBlockHex != null) message.previousBlockHex = String(object.previousBlockHex);
				if (object.height != null) message.height = object.height >>> 0;
				if (object.numberOfTransactions != null)
					message.numberOfTransactions = object.numberOfTransactions >>> 0;
				if (object.totalAmount != null) message.totalAmount = String(object.totalAmount);
				if (object.totalFee != null) message.totalFee = String(object.totalFee);
				if (object.reward != null) message.reward = String(object.reward);
				if (object.payloadLength != null) message.payloadLength = object.payloadLength >>> 0;
				if (object.payloadHash != null) message.payloadHash = String(object.payloadHash);
				if (object.generatorPublicKey != null) message.generatorPublicKey = String(object.generatorPublicKey);
				if (object.blockSignature != null) message.blockSignature = String(object.blockSignature);
				if (object.transactions != null)
					if (typeof object.transactions === "string")
						$util.base64.decode(
							object.transactions,
							(message.transactions = $util.newBuffer($util.base64.length(object.transactions))),
							0,
						);
					else if (object.transactions.length) message.transactions = object.transactions;
				return message;
			};

			BlockHeader.toObject = function toObject(message, options) {
				if (!options) options = {};
				var object = {};
				if (options.defaults) {
					object.id = "";
					object.idHex = "";
					object.version = 0;
					object.timestamp = 0;
					object.previousBlock = "";
					object.previousBlockHex = "";
					object.height = 0;
					object.numberOfTransactions = 0;
					object.totalAmount = "";
					object.totalFee = "";
					object.reward = "";
					object.payloadLength = 0;
					object.payloadHash = "";
					object.generatorPublicKey = "";
					object.blockSignature = "";
					if (options.bytes === String) object.transactions = "";
					else {
						object.transactions = [];
						if (options.bytes !== Array) object.transactions = $util.newBuffer(object.transactions);
					}
				}
				if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
				if (message.idHex != null && message.hasOwnProperty("idHex")) object.idHex = message.idHex;
				if (message.version != null && message.hasOwnProperty("version")) object.version = message.version;
				if (message.timestamp != null && message.hasOwnProperty("timestamp"))
					object.timestamp = message.timestamp;
				if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
					object.previousBlock = message.previousBlock;
				if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
					object.previousBlockHex = message.previousBlockHex;
				if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
				if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
					object.numberOfTransactions = message.numberOfTransactions;
				if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
					object.totalAmount = message.totalAmount;
				if (message.totalFee != null && message.hasOwnProperty("totalFee")) object.totalFee = message.totalFee;
				if (message.reward != null && message.hasOwnProperty("reward")) object.reward = message.reward;
				if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
					object.payloadLength = message.payloadLength;
				if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
					object.payloadHash = message.payloadHash;
				if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
					object.generatorPublicKey = message.generatorPublicKey;
				if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
					object.blockSignature = message.blockSignature;
				if (message.transactions != null && message.hasOwnProperty("transactions"))
					object.transactions =
						options.bytes === String
							? $util.base64.encode(message.transactions, 0, message.transactions.length)
							: options.bytes === Array
							? Array.prototype.slice.call(message.transactions)
							: message.transactions;
				return object;
			};

			BlockHeader.prototype.toJSON = function toJSON() {
				return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
			};

			return BlockHeader;
		})();

		return GetBlocksResponse;
	})();

	return blocks;
})();

$root.peer = (function () {
	var peer = {};

	peer.GetPeersRequest = (function () {
		function GetPeersRequest(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetPeersRequest.prototype.headers = null;

		GetPeersRequest.create = function create(properties) {
			return new GetPeersRequest(properties);
		};

		GetPeersRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
			return writer;
		};

		GetPeersRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetPeersRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetPeersRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetPeersRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetPeersRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		GetPeersRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetPeersRequest) return object;
			var message = new $root.peer.GetPeersRequest();
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".peer.GetPeersRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		GetPeersRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) object.headers = null;
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		GetPeersRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return GetPeersRequest;
	})();

	peer.GetPeersResponse = (function () {
		function GetPeersResponse(properties) {
			this.peers = [];
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetPeersResponse.prototype.peers = $util.emptyArray;

		GetPeersResponse.create = function create(properties) {
			return new GetPeersResponse(properties);
		};

		GetPeersResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.peers != null && message.peers.length)
				for (var i = 0; i < message.peers.length; ++i)
					$root.peer.GetPeersResponse.Peer.encode(
						message.peers[i],
						writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
					).ldelim();
			return writer;
		};

		GetPeersResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetPeersResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetPeersResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (!(message.peers && message.peers.length)) message.peers = [];
						message.peers.push($root.peer.GetPeersResponse.Peer.decode(reader, reader.uint32()));
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetPeersResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetPeersResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.peers != null && message.hasOwnProperty("peers")) {
				if (!Array.isArray(message.peers)) return "peers: array expected";
				for (var i = 0; i < message.peers.length; ++i) {
					var error = $root.peer.GetPeersResponse.Peer.verify(message.peers[i]);
					if (error) return "peers." + error;
				}
			}
			return null;
		};

		GetPeersResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetPeersResponse) return object;
			var message = new $root.peer.GetPeersResponse();
			if (object.peers) {
				if (!Array.isArray(object.peers)) throw TypeError(".peer.GetPeersResponse.peers: array expected");
				message.peers = [];
				for (var i = 0; i < object.peers.length; ++i) {
					if (typeof object.peers[i] !== "object")
						throw TypeError(".peer.GetPeersResponse.peers: object expected");
					message.peers[i] = $root.peer.GetPeersResponse.Peer.fromObject(object.peers[i]);
				}
			}
			return message;
		};

		GetPeersResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.arrays || options.defaults) object.peers = [];
			if (message.peers && message.peers.length) {
				object.peers = [];
				for (var j = 0; j < message.peers.length; ++j)
					object.peers[j] = $root.peer.GetPeersResponse.Peer.toObject(message.peers[j], options);
			}
			return object;
		};

		GetPeersResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		GetPeersResponse.Peer = (function () {
			function Peer(properties) {
				if (properties)
					for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
						if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
			}

			Peer.prototype.ip = "";

			Peer.prototype.port = 0;

			Peer.create = function create(properties) {
				return new Peer(properties);
			};

			Peer.encode = function encode(message, writer) {
				if (!writer) writer = $Writer.create();
				if (message.ip != null && Object.hasOwnProperty.call(message, "ip"))
					writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.ip);
				if (message.port != null && Object.hasOwnProperty.call(message, "port"))
					writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.port);
				return writer;
			};

			Peer.encodeDelimited = function encodeDelimited(message, writer) {
				return this.encode(message, writer).ldelim();
			};

			Peer.decode = function decode(reader, length) {
				if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
				var end = length === undefined ? reader.len : reader.pos + length,
					message = new $root.peer.GetPeersResponse.Peer();
				while (reader.pos < end) {
					var tag = reader.uint32();
					switch (tag >>> 3) {
						case 1:
							message.ip = reader.string();
							break;
						case 2:
							message.port = reader.uint32();
							break;
						default:
							reader.skipType(tag & 7);
							break;
					}
				}
				return message;
			};

			Peer.decodeDelimited = function decodeDelimited(reader) {
				if (!(reader instanceof $Reader)) reader = new $Reader(reader);
				return this.decode(reader, reader.uint32());
			};

			Peer.verify = function verify(message) {
				if (typeof message !== "object" || message === null) return "object expected";
				if (message.ip != null && message.hasOwnProperty("ip"))
					if (!$util.isString(message.ip)) return "ip: string expected";
				if (message.port != null && message.hasOwnProperty("port"))
					if (!$util.isInteger(message.port)) return "port: integer expected";
				return null;
			};

			Peer.fromObject = function fromObject(object) {
				if (object instanceof $root.peer.GetPeersResponse.Peer) return object;
				var message = new $root.peer.GetPeersResponse.Peer();
				if (object.ip != null) message.ip = String(object.ip);
				if (object.port != null) message.port = object.port >>> 0;
				return message;
			};

			Peer.toObject = function toObject(message, options) {
				if (!options) options = {};
				var object = {};
				if (options.defaults) {
					object.ip = "";
					object.port = 0;
				}
				if (message.ip != null && message.hasOwnProperty("ip")) object.ip = message.ip;
				if (message.port != null && message.hasOwnProperty("port")) object.port = message.port;
				return object;
			};

			Peer.prototype.toJSON = function toJSON() {
				return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
			};

			return Peer;
		})();

		return GetPeersResponse;
	})();

	peer.GetCommonBlocksRequest = (function () {
		function GetCommonBlocksRequest(properties) {
			this.ids = [];
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetCommonBlocksRequest.prototype.ids = $util.emptyArray;

		GetCommonBlocksRequest.prototype.headers = null;

		GetCommonBlocksRequest.create = function create(properties) {
			return new GetCommonBlocksRequest(properties);
		};

		GetCommonBlocksRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.ids != null && message.ids.length)
				for (var i = 0; i < message.ids.length; ++i)
					writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.ids[i]);
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
			return writer;
		};

		GetCommonBlocksRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetCommonBlocksRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetCommonBlocksRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (!(message.ids && message.ids.length)) message.ids = [];
						message.ids.push(reader.string());
						break;
					case 2:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetCommonBlocksRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetCommonBlocksRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.ids != null && message.hasOwnProperty("ids")) {
				if (!Array.isArray(message.ids)) return "ids: array expected";
				for (var i = 0; i < message.ids.length; ++i)
					if (!$util.isString(message.ids[i])) return "ids: string[] expected";
			}
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		GetCommonBlocksRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetCommonBlocksRequest) return object;
			var message = new $root.peer.GetCommonBlocksRequest();
			if (object.ids) {
				if (!Array.isArray(object.ids)) throw TypeError(".peer.GetCommonBlocksRequest.ids: array expected");
				message.ids = [];
				for (var i = 0; i < object.ids.length; ++i) message.ids[i] = String(object.ids[i]);
			}
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".peer.GetCommonBlocksRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		GetCommonBlocksRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.arrays || options.defaults) object.ids = [];
			if (options.defaults) object.headers = null;
			if (message.ids && message.ids.length) {
				object.ids = [];
				for (var j = 0; j < message.ids.length; ++j) object.ids[j] = message.ids[j];
			}
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		GetCommonBlocksRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return GetCommonBlocksRequest;
	})();

	peer.GetCommonBlocksResponse = (function () {
		function GetCommonBlocksResponse(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetCommonBlocksResponse.prototype.common = null;

		GetCommonBlocksResponse.create = function create(properties) {
			return new GetCommonBlocksResponse(properties);
		};

		GetCommonBlocksResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.common != null && Object.hasOwnProperty.call(message, "common"))
				$root.peer.GetCommonBlocksResponse.Common.encode(
					message.common,
					writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
				).ldelim();
			return writer;
		};

		GetCommonBlocksResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetCommonBlocksResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetCommonBlocksResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.common = $root.peer.GetCommonBlocksResponse.Common.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetCommonBlocksResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetCommonBlocksResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.common != null && message.hasOwnProperty("common")) {
				var error = $root.peer.GetCommonBlocksResponse.Common.verify(message.common);
				if (error) return "common." + error;
			}
			return null;
		};

		GetCommonBlocksResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetCommonBlocksResponse) return object;
			var message = new $root.peer.GetCommonBlocksResponse();
			if (object.common != null) {
				if (typeof object.common !== "object")
					throw TypeError(".peer.GetCommonBlocksResponse.common: object expected");
				message.common = $root.peer.GetCommonBlocksResponse.Common.fromObject(object.common);
			}
			return message;
		};

		GetCommonBlocksResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) object.common = null;
			if (message.common != null && message.hasOwnProperty("common"))
				object.common = $root.peer.GetCommonBlocksResponse.Common.toObject(message.common, options);
			return object;
		};

		GetCommonBlocksResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		GetCommonBlocksResponse.Common = (function () {
			function Common(properties) {
				if (properties)
					for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
						if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
			}

			Common.prototype.height = 0;

			Common.prototype.id = "";

			Common.create = function create(properties) {
				return new Common(properties);
			};

			Common.encode = function encode(message, writer) {
				if (!writer) writer = $Writer.create();
				if (message.height != null && Object.hasOwnProperty.call(message, "height"))
					writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.height);
				if (message.id != null && Object.hasOwnProperty.call(message, "id"))
					writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.id);
				return writer;
			};

			Common.encodeDelimited = function encodeDelimited(message, writer) {
				return this.encode(message, writer).ldelim();
			};

			Common.decode = function decode(reader, length) {
				if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
				var end = length === undefined ? reader.len : reader.pos + length,
					message = new $root.peer.GetCommonBlocksResponse.Common();
				while (reader.pos < end) {
					var tag = reader.uint32();
					switch (tag >>> 3) {
						case 1:
							message.height = reader.uint32();
							break;
						case 2:
							message.id = reader.string();
							break;
						default:
							reader.skipType(tag & 7);
							break;
					}
				}
				return message;
			};

			Common.decodeDelimited = function decodeDelimited(reader) {
				if (!(reader instanceof $Reader)) reader = new $Reader(reader);
				return this.decode(reader, reader.uint32());
			};

			Common.verify = function verify(message) {
				if (typeof message !== "object" || message === null) return "object expected";
				if (message.height != null && message.hasOwnProperty("height"))
					if (!$util.isInteger(message.height)) return "height: integer expected";
				if (message.id != null && message.hasOwnProperty("id"))
					if (!$util.isString(message.id)) return "id: string expected";
				return null;
			};

			Common.fromObject = function fromObject(object) {
				if (object instanceof $root.peer.GetCommonBlocksResponse.Common) return object;
				var message = new $root.peer.GetCommonBlocksResponse.Common();
				if (object.height != null) message.height = object.height >>> 0;
				if (object.id != null) message.id = String(object.id);
				return message;
			};

			Common.toObject = function toObject(message, options) {
				if (!options) options = {};
				var object = {};
				if (options.defaults) {
					object.height = 0;
					object.id = "";
				}
				if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
				if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
				return object;
			};

			Common.prototype.toJSON = function toJSON() {
				return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
			};

			return Common;
		})();

		return GetCommonBlocksResponse;
	})();

	peer.GetStatusRequest = (function () {
		function GetStatusRequest(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetStatusRequest.prototype.headers = null;

		GetStatusRequest.create = function create(properties) {
			return new GetStatusRequest(properties);
		};

		GetStatusRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
			return writer;
		};

		GetStatusRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetStatusRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetStatusRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetStatusRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetStatusRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		GetStatusRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetStatusRequest) return object;
			var message = new $root.peer.GetStatusRequest();
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".peer.GetStatusRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		GetStatusRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) object.headers = null;
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		GetStatusRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return GetStatusRequest;
	})();

	peer.GetStatusResponse = (function () {
		function GetStatusResponse(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		GetStatusResponse.prototype.state = null;

		GetStatusResponse.prototype.config = null;

		GetStatusResponse.create = function create(properties) {
			return new GetStatusResponse(properties);
		};

		GetStatusResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.state != null && Object.hasOwnProperty.call(message, "state"))
				$root.peer.GetStatusResponse.State.encode(
					message.state,
					writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
				).ldelim();
			if (message.config != null && Object.hasOwnProperty.call(message, "config"))
				$root.peer.GetStatusResponse.Config.encode(
					message.config,
					writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
				).ldelim();
			return writer;
		};

		GetStatusResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		GetStatusResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.peer.GetStatusResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.state = $root.peer.GetStatusResponse.State.decode(reader, reader.uint32());
						break;
					case 2:
						message.config = $root.peer.GetStatusResponse.Config.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		GetStatusResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		GetStatusResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.state != null && message.hasOwnProperty("state")) {
				var error = $root.peer.GetStatusResponse.State.verify(message.state);
				if (error) return "state." + error;
			}
			if (message.config != null && message.hasOwnProperty("config")) {
				var error = $root.peer.GetStatusResponse.Config.verify(message.config);
				if (error) return "config." + error;
			}
			return null;
		};

		GetStatusResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.peer.GetStatusResponse) return object;
			var message = new $root.peer.GetStatusResponse();
			if (object.state != null) {
				if (typeof object.state !== "object") throw TypeError(".peer.GetStatusResponse.state: object expected");
				message.state = $root.peer.GetStatusResponse.State.fromObject(object.state);
			}
			if (object.config != null) {
				if (typeof object.config !== "object")
					throw TypeError(".peer.GetStatusResponse.config: object expected");
				message.config = $root.peer.GetStatusResponse.Config.fromObject(object.config);
			}
			return message;
		};

		GetStatusResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				object.state = null;
				object.config = null;
			}
			if (message.state != null && message.hasOwnProperty("state"))
				object.state = $root.peer.GetStatusResponse.State.toObject(message.state, options);
			if (message.config != null && message.hasOwnProperty("config"))
				object.config = $root.peer.GetStatusResponse.Config.toObject(message.config, options);
			return object;
		};

		GetStatusResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		GetStatusResponse.State = (function () {
			function State(properties) {
				if (properties)
					for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
						if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
			}

			State.prototype.height = 0;

			State.prototype.forgingAllowed = false;

			State.prototype.currentSlot = 0;

			State.prototype.header = null;

			State.create = function create(properties) {
				return new State(properties);
			};

			State.encode = function encode(message, writer) {
				if (!writer) writer = $Writer.create();
				if (message.height != null && Object.hasOwnProperty.call(message, "height"))
					writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.height);
				if (message.forgingAllowed != null && Object.hasOwnProperty.call(message, "forgingAllowed"))
					writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.forgingAllowed);
				if (message.currentSlot != null && Object.hasOwnProperty.call(message, "currentSlot"))
					writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.currentSlot);
				if (message.header != null && Object.hasOwnProperty.call(message, "header"))
					$root.peer.GetStatusResponse.State.BlockHeader.encode(
						message.header,
						writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
					).ldelim();
				return writer;
			};

			State.encodeDelimited = function encodeDelimited(message, writer) {
				return this.encode(message, writer).ldelim();
			};

			State.decode = function decode(reader, length) {
				if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
				var end = length === undefined ? reader.len : reader.pos + length,
					message = new $root.peer.GetStatusResponse.State();
				while (reader.pos < end) {
					var tag = reader.uint32();
					switch (tag >>> 3) {
						case 1:
							message.height = reader.uint32();
							break;
						case 2:
							message.forgingAllowed = reader.bool();
							break;
						case 3:
							message.currentSlot = reader.uint32();
							break;
						case 4:
							message.header = $root.peer.GetStatusResponse.State.BlockHeader.decode(
								reader,
								reader.uint32(),
							);
							break;
						default:
							reader.skipType(tag & 7);
							break;
					}
				}
				return message;
			};

			State.decodeDelimited = function decodeDelimited(reader) {
				if (!(reader instanceof $Reader)) reader = new $Reader(reader);
				return this.decode(reader, reader.uint32());
			};

			State.verify = function verify(message) {
				if (typeof message !== "object" || message === null) return "object expected";
				if (message.height != null && message.hasOwnProperty("height"))
					if (!$util.isInteger(message.height)) return "height: integer expected";
				if (message.forgingAllowed != null && message.hasOwnProperty("forgingAllowed"))
					if (typeof message.forgingAllowed !== "boolean") return "forgingAllowed: boolean expected";
				if (message.currentSlot != null && message.hasOwnProperty("currentSlot"))
					if (!$util.isInteger(message.currentSlot)) return "currentSlot: integer expected";
				if (message.header != null && message.hasOwnProperty("header")) {
					var error = $root.peer.GetStatusResponse.State.BlockHeader.verify(message.header);
					if (error) return "header." + error;
				}
				return null;
			};

			State.fromObject = function fromObject(object) {
				if (object instanceof $root.peer.GetStatusResponse.State) return object;
				var message = new $root.peer.GetStatusResponse.State();
				if (object.height != null) message.height = object.height >>> 0;
				if (object.forgingAllowed != null) message.forgingAllowed = Boolean(object.forgingAllowed);
				if (object.currentSlot != null) message.currentSlot = object.currentSlot >>> 0;
				if (object.header != null) {
					if (typeof object.header !== "object")
						throw TypeError(".peer.GetStatusResponse.State.header: object expected");
					message.header = $root.peer.GetStatusResponse.State.BlockHeader.fromObject(object.header);
				}
				return message;
			};

			State.toObject = function toObject(message, options) {
				if (!options) options = {};
				var object = {};
				if (options.defaults) {
					object.height = 0;
					object.forgingAllowed = false;
					object.currentSlot = 0;
					object.header = null;
				}
				if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
				if (message.forgingAllowed != null && message.hasOwnProperty("forgingAllowed"))
					object.forgingAllowed = message.forgingAllowed;
				if (message.currentSlot != null && message.hasOwnProperty("currentSlot"))
					object.currentSlot = message.currentSlot;
				if (message.header != null && message.hasOwnProperty("header"))
					object.header = $root.peer.GetStatusResponse.State.BlockHeader.toObject(message.header, options);
				return object;
			};

			State.prototype.toJSON = function toJSON() {
				return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
			};

			State.BlockHeader = (function () {
				function BlockHeader(properties) {
					if (properties)
						for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
							if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
				}

				BlockHeader.prototype.id = "";

				BlockHeader.prototype.idHex = "";

				BlockHeader.prototype.version = 0;

				BlockHeader.prototype.timestamp = 0;

				BlockHeader.prototype.previousBlock = "";

				BlockHeader.prototype.previousBlockHex = "";

				BlockHeader.prototype.height = 0;

				BlockHeader.prototype.numberOfTransactions = 0;

				BlockHeader.prototype.totalAmount = "";

				BlockHeader.prototype.totalFee = "";

				BlockHeader.prototype.reward = "";

				BlockHeader.prototype.payloadLength = 0;

				BlockHeader.prototype.payloadHash = "";

				BlockHeader.prototype.generatorPublicKey = "";

				BlockHeader.prototype.blockSignature = "";

				BlockHeader.create = function create(properties) {
					return new BlockHeader(properties);
				};

				BlockHeader.encode = function encode(message, writer) {
					if (!writer) writer = $Writer.create();
					if (message.id != null && Object.hasOwnProperty.call(message, "id"))
						writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.id);
					if (message.idHex != null && Object.hasOwnProperty.call(message, "idHex"))
						writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.idHex);
					if (message.version != null && Object.hasOwnProperty.call(message, "version"))
						writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.version);
					if (message.timestamp != null && Object.hasOwnProperty.call(message, "timestamp"))
						writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.timestamp);
					if (message.previousBlock != null && Object.hasOwnProperty.call(message, "previousBlock"))
						writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.previousBlock);
					if (message.previousBlockHex != null && Object.hasOwnProperty.call(message, "previousBlockHex"))
						writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.previousBlockHex);
					if (message.height != null && Object.hasOwnProperty.call(message, "height"))
						writer.uint32(/* id 7, wireType 0 =*/ 56).uint32(message.height);
					if (
						message.numberOfTransactions != null &&
						Object.hasOwnProperty.call(message, "numberOfTransactions")
					)
						writer.uint32(/* id 8, wireType 0 =*/ 64).uint32(message.numberOfTransactions);
					if (message.totalAmount != null && Object.hasOwnProperty.call(message, "totalAmount"))
						writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.totalAmount);
					if (message.totalFee != null && Object.hasOwnProperty.call(message, "totalFee"))
						writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.totalFee);
					if (message.reward != null && Object.hasOwnProperty.call(message, "reward"))
						writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.reward);
					if (message.payloadLength != null && Object.hasOwnProperty.call(message, "payloadLength"))
						writer.uint32(/* id 12, wireType 0 =*/ 96).uint32(message.payloadLength);
					if (message.payloadHash != null && Object.hasOwnProperty.call(message, "payloadHash"))
						writer.uint32(/* id 13, wireType 2 =*/ 106).string(message.payloadHash);
					if (message.generatorPublicKey != null && Object.hasOwnProperty.call(message, "generatorPublicKey"))
						writer.uint32(/* id 14, wireType 2 =*/ 114).string(message.generatorPublicKey);
					if (message.blockSignature != null && Object.hasOwnProperty.call(message, "blockSignature"))
						writer.uint32(/* id 15, wireType 2 =*/ 122).string(message.blockSignature);
					return writer;
				};

				BlockHeader.encodeDelimited = function encodeDelimited(message, writer) {
					return this.encode(message, writer).ldelim();
				};

				BlockHeader.decode = function decode(reader, length) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.peer.GetStatusResponse.State.BlockHeader();
					while (reader.pos < end) {
						var tag = reader.uint32();
						switch (tag >>> 3) {
							case 1:
								message.id = reader.string();
								break;
							case 2:
								message.idHex = reader.string();
								break;
							case 3:
								message.version = reader.uint32();
								break;
							case 4:
								message.timestamp = reader.uint32();
								break;
							case 5:
								message.previousBlock = reader.string();
								break;
							case 6:
								message.previousBlockHex = reader.string();
								break;
							case 7:
								message.height = reader.uint32();
								break;
							case 8:
								message.numberOfTransactions = reader.uint32();
								break;
							case 9:
								message.totalAmount = reader.string();
								break;
							case 10:
								message.totalFee = reader.string();
								break;
							case 11:
								message.reward = reader.string();
								break;
							case 12:
								message.payloadLength = reader.uint32();
								break;
							case 13:
								message.payloadHash = reader.string();
								break;
							case 14:
								message.generatorPublicKey = reader.string();
								break;
							case 15:
								message.blockSignature = reader.string();
								break;
							default:
								reader.skipType(tag & 7);
								break;
						}
					}
					return message;
				};

				BlockHeader.decodeDelimited = function decodeDelimited(reader) {
					if (!(reader instanceof $Reader)) reader = new $Reader(reader);
					return this.decode(reader, reader.uint32());
				};

				BlockHeader.verify = function verify(message) {
					if (typeof message !== "object" || message === null) return "object expected";
					if (message.id != null && message.hasOwnProperty("id"))
						if (!$util.isString(message.id)) return "id: string expected";
					if (message.idHex != null && message.hasOwnProperty("idHex"))
						if (!$util.isString(message.idHex)) return "idHex: string expected";
					if (message.version != null && message.hasOwnProperty("version"))
						if (!$util.isInteger(message.version)) return "version: integer expected";
					if (message.timestamp != null && message.hasOwnProperty("timestamp"))
						if (!$util.isInteger(message.timestamp)) return "timestamp: integer expected";
					if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
						if (!$util.isString(message.previousBlock)) return "previousBlock: string expected";
					if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
						if (!$util.isString(message.previousBlockHex)) return "previousBlockHex: string expected";
					if (message.height != null && message.hasOwnProperty("height"))
						if (!$util.isInteger(message.height)) return "height: integer expected";
					if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
						if (!$util.isInteger(message.numberOfTransactions))
							return "numberOfTransactions: integer expected";
					if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
						if (!$util.isString(message.totalAmount)) return "totalAmount: string expected";
					if (message.totalFee != null && message.hasOwnProperty("totalFee"))
						if (!$util.isString(message.totalFee)) return "totalFee: string expected";
					if (message.reward != null && message.hasOwnProperty("reward"))
						if (!$util.isString(message.reward)) return "reward: string expected";
					if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
						if (!$util.isInteger(message.payloadLength)) return "payloadLength: integer expected";
					if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
						if (!$util.isString(message.payloadHash)) return "payloadHash: string expected";
					if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
						if (!$util.isString(message.generatorPublicKey)) return "generatorPublicKey: string expected";
					if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
						if (!$util.isString(message.blockSignature)) return "blockSignature: string expected";
					return null;
				};

				BlockHeader.fromObject = function fromObject(object) {
					if (object instanceof $root.peer.GetStatusResponse.State.BlockHeader) return object;
					var message = new $root.peer.GetStatusResponse.State.BlockHeader();
					if (object.id != null) message.id = String(object.id);
					if (object.idHex != null) message.idHex = String(object.idHex);
					if (object.version != null) message.version = object.version >>> 0;
					if (object.timestamp != null) message.timestamp = object.timestamp >>> 0;
					if (object.previousBlock != null) message.previousBlock = String(object.previousBlock);
					if (object.previousBlockHex != null) message.previousBlockHex = String(object.previousBlockHex);
					if (object.height != null) message.height = object.height >>> 0;
					if (object.numberOfTransactions != null)
						message.numberOfTransactions = object.numberOfTransactions >>> 0;
					if (object.totalAmount != null) message.totalAmount = String(object.totalAmount);
					if (object.totalFee != null) message.totalFee = String(object.totalFee);
					if (object.reward != null) message.reward = String(object.reward);
					if (object.payloadLength != null) message.payloadLength = object.payloadLength >>> 0;
					if (object.payloadHash != null) message.payloadHash = String(object.payloadHash);
					if (object.generatorPublicKey != null)
						message.generatorPublicKey = String(object.generatorPublicKey);
					if (object.blockSignature != null) message.blockSignature = String(object.blockSignature);
					return message;
				};

				BlockHeader.toObject = function toObject(message, options) {
					if (!options) options = {};
					var object = {};
					if (options.defaults) {
						object.id = "";
						object.idHex = "";
						object.version = 0;
						object.timestamp = 0;
						object.previousBlock = "";
						object.previousBlockHex = "";
						object.height = 0;
						object.numberOfTransactions = 0;
						object.totalAmount = "";
						object.totalFee = "";
						object.reward = "";
						object.payloadLength = 0;
						object.payloadHash = "";
						object.generatorPublicKey = "";
						object.blockSignature = "";
					}
					if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
					if (message.idHex != null && message.hasOwnProperty("idHex")) object.idHex = message.idHex;
					if (message.version != null && message.hasOwnProperty("version")) object.version = message.version;
					if (message.timestamp != null && message.hasOwnProperty("timestamp"))
						object.timestamp = message.timestamp;
					if (message.previousBlock != null && message.hasOwnProperty("previousBlock"))
						object.previousBlock = message.previousBlock;
					if (message.previousBlockHex != null && message.hasOwnProperty("previousBlockHex"))
						object.previousBlockHex = message.previousBlockHex;
					if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
					if (message.numberOfTransactions != null && message.hasOwnProperty("numberOfTransactions"))
						object.numberOfTransactions = message.numberOfTransactions;
					if (message.totalAmount != null && message.hasOwnProperty("totalAmount"))
						object.totalAmount = message.totalAmount;
					if (message.totalFee != null && message.hasOwnProperty("totalFee"))
						object.totalFee = message.totalFee;
					if (message.reward != null && message.hasOwnProperty("reward")) object.reward = message.reward;
					if (message.payloadLength != null && message.hasOwnProperty("payloadLength"))
						object.payloadLength = message.payloadLength;
					if (message.payloadHash != null && message.hasOwnProperty("payloadHash"))
						object.payloadHash = message.payloadHash;
					if (message.generatorPublicKey != null && message.hasOwnProperty("generatorPublicKey"))
						object.generatorPublicKey = message.generatorPublicKey;
					if (message.blockSignature != null && message.hasOwnProperty("blockSignature"))
						object.blockSignature = message.blockSignature;
					return object;
				};

				BlockHeader.prototype.toJSON = function toJSON() {
					return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
				};

				return BlockHeader;
			})();

			return State;
		})();

		GetStatusResponse.Config = (function () {
			function Config(properties) {
				this.plugins = {};
				if (properties)
					for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
						if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
			}

			Config.prototype.version = "";

			Config.prototype.network = null;

			Config.prototype.plugins = $util.emptyObject;

			Config.create = function create(properties) {
				return new Config(properties);
			};

			Config.encode = function encode(message, writer) {
				if (!writer) writer = $Writer.create();
				if (message.version != null && Object.hasOwnProperty.call(message, "version"))
					writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.version);
				if (message.network != null && Object.hasOwnProperty.call(message, "network"))
					$root.peer.GetStatusResponse.Config.Network.encode(
						message.network,
						writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
					).ldelim();
				if (message.plugins != null && Object.hasOwnProperty.call(message, "plugins"))
					for (var keys = Object.keys(message.plugins), i = 0; i < keys.length; ++i) {
						writer
							.uint32(/* id 3, wireType 2 =*/ 26)
							.fork()
							.uint32(/* id 1, wireType 2 =*/ 10)
							.string(keys[i]);
						$root.peer.GetStatusResponse.Config.Plugin.encode(
							message.plugins[keys[i]],
							writer.uint32(/* id 2, wireType 2 =*/ 18).fork(),
						)
							.ldelim()
							.ldelim();
					}
				return writer;
			};

			Config.encodeDelimited = function encodeDelimited(message, writer) {
				return this.encode(message, writer).ldelim();
			};

			Config.decode = function decode(reader, length) {
				if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
				var end = length === undefined ? reader.len : reader.pos + length,
					message = new $root.peer.GetStatusResponse.Config(),
					key,
					value;
				while (reader.pos < end) {
					var tag = reader.uint32();
					switch (tag >>> 3) {
						case 1:
							message.version = reader.string();
							break;
						case 2:
							message.network = $root.peer.GetStatusResponse.Config.Network.decode(
								reader,
								reader.uint32(),
							);
							break;
						case 3:
							if (message.plugins === $util.emptyObject) message.plugins = {};
							var end2 = reader.uint32() + reader.pos;
							key = "";
							value = null;
							while (reader.pos < end2) {
								var tag2 = reader.uint32();
								switch (tag2 >>> 3) {
									case 1:
										key = reader.string();
										break;
									case 2:
										value = $root.peer.GetStatusResponse.Config.Plugin.decode(
											reader,
											reader.uint32(),
										);
										break;
									default:
										reader.skipType(tag2 & 7);
										break;
								}
							}
							message.plugins[key] = value;
							break;
						default:
							reader.skipType(tag & 7);
							break;
					}
				}
				return message;
			};

			Config.decodeDelimited = function decodeDelimited(reader) {
				if (!(reader instanceof $Reader)) reader = new $Reader(reader);
				return this.decode(reader, reader.uint32());
			};

			Config.verify = function verify(message) {
				if (typeof message !== "object" || message === null) return "object expected";
				if (message.version != null && message.hasOwnProperty("version"))
					if (!$util.isString(message.version)) return "version: string expected";
				if (message.network != null && message.hasOwnProperty("network")) {
					var error = $root.peer.GetStatusResponse.Config.Network.verify(message.network);
					if (error) return "network." + error;
				}
				if (message.plugins != null && message.hasOwnProperty("plugins")) {
					if (!$util.isObject(message.plugins)) return "plugins: object expected";
					var key = Object.keys(message.plugins);
					for (var i = 0; i < key.length; ++i) {
						var error = $root.peer.GetStatusResponse.Config.Plugin.verify(message.plugins[key[i]]);
						if (error) return "plugins." + error;
					}
				}
				return null;
			};

			Config.fromObject = function fromObject(object) {
				if (object instanceof $root.peer.GetStatusResponse.Config) return object;
				var message = new $root.peer.GetStatusResponse.Config();
				if (object.version != null) message.version = String(object.version);
				if (object.network != null) {
					if (typeof object.network !== "object")
						throw TypeError(".peer.GetStatusResponse.Config.network: object expected");
					message.network = $root.peer.GetStatusResponse.Config.Network.fromObject(object.network);
				}
				if (object.plugins) {
					if (typeof object.plugins !== "object")
						throw TypeError(".peer.GetStatusResponse.Config.plugins: object expected");
					message.plugins = {};
					for (var keys = Object.keys(object.plugins), i = 0; i < keys.length; ++i) {
						if (typeof object.plugins[keys[i]] !== "object")
							throw TypeError(".peer.GetStatusResponse.Config.plugins: object expected");
						message.plugins[keys[i]] = $root.peer.GetStatusResponse.Config.Plugin.fromObject(
							object.plugins[keys[i]],
						);
					}
				}
				return message;
			};

			Config.toObject = function toObject(message, options) {
				if (!options) options = {};
				var object = {};
				if (options.objects || options.defaults) object.plugins = {};
				if (options.defaults) {
					object.version = "";
					object.network = null;
				}
				if (message.version != null && message.hasOwnProperty("version")) object.version = message.version;
				if (message.network != null && message.hasOwnProperty("network"))
					object.network = $root.peer.GetStatusResponse.Config.Network.toObject(message.network, options);
				var keys2;
				if (message.plugins && (keys2 = Object.keys(message.plugins)).length) {
					object.plugins = {};
					for (var j = 0; j < keys2.length; ++j)
						object.plugins[keys2[j]] = $root.peer.GetStatusResponse.Config.Plugin.toObject(
							message.plugins[keys2[j]],
							options,
						);
				}
				return object;
			};

			Config.prototype.toJSON = function toJSON() {
				return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
			};

			Config.Network = (function () {
				function Network(properties) {
					if (properties)
						for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
							if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
				}

				Network.prototype.name = "";

				Network.prototype.nethash = "";

				Network.prototype.explorer = "";

				Network.prototype.token = null;

				Network.prototype.version = 0;

				Network.create = function create(properties) {
					return new Network(properties);
				};

				Network.encode = function encode(message, writer) {
					if (!writer) writer = $Writer.create();
					if (message.name != null && Object.hasOwnProperty.call(message, "name"))
						writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name);
					if (message.nethash != null && Object.hasOwnProperty.call(message, "nethash"))
						writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.nethash);
					if (message.explorer != null && Object.hasOwnProperty.call(message, "explorer"))
						writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.explorer);
					if (message.token != null && Object.hasOwnProperty.call(message, "token"))
						$root.peer.GetStatusResponse.Config.Network.Token.encode(
							message.token,
							writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
						).ldelim();
					if (message.version != null && Object.hasOwnProperty.call(message, "version"))
						writer.uint32(/* id 5, wireType 0 =*/ 40).uint32(message.version);
					return writer;
				};

				Network.encodeDelimited = function encodeDelimited(message, writer) {
					return this.encode(message, writer).ldelim();
				};

				Network.decode = function decode(reader, length) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.peer.GetStatusResponse.Config.Network();
					while (reader.pos < end) {
						var tag = reader.uint32();
						switch (tag >>> 3) {
							case 1:
								message.name = reader.string();
								break;
							case 2:
								message.nethash = reader.string();
								break;
							case 3:
								message.explorer = reader.string();
								break;
							case 4:
								message.token = $root.peer.GetStatusResponse.Config.Network.Token.decode(
									reader,
									reader.uint32(),
								);
								break;
							case 5:
								message.version = reader.uint32();
								break;
							default:
								reader.skipType(tag & 7);
								break;
						}
					}
					return message;
				};

				Network.decodeDelimited = function decodeDelimited(reader) {
					if (!(reader instanceof $Reader)) reader = new $Reader(reader);
					return this.decode(reader, reader.uint32());
				};

				Network.verify = function verify(message) {
					if (typeof message !== "object" || message === null) return "object expected";
					if (message.name != null && message.hasOwnProperty("name"))
						if (!$util.isString(message.name)) return "name: string expected";
					if (message.nethash != null && message.hasOwnProperty("nethash"))
						if (!$util.isString(message.nethash)) return "nethash: string expected";
					if (message.explorer != null && message.hasOwnProperty("explorer"))
						if (!$util.isString(message.explorer)) return "explorer: string expected";
					if (message.token != null && message.hasOwnProperty("token")) {
						var error = $root.peer.GetStatusResponse.Config.Network.Token.verify(message.token);
						if (error) return "token." + error;
					}
					if (message.version != null && message.hasOwnProperty("version"))
						if (!$util.isInteger(message.version)) return "version: integer expected";
					return null;
				};

				Network.fromObject = function fromObject(object) {
					if (object instanceof $root.peer.GetStatusResponse.Config.Network) return object;
					var message = new $root.peer.GetStatusResponse.Config.Network();
					if (object.name != null) message.name = String(object.name);
					if (object.nethash != null) message.nethash = String(object.nethash);
					if (object.explorer != null) message.explorer = String(object.explorer);
					if (object.token != null) {
						if (typeof object.token !== "object")
							throw TypeError(".peer.GetStatusResponse.Config.Network.token: object expected");
						message.token = $root.peer.GetStatusResponse.Config.Network.Token.fromObject(object.token);
					}
					if (object.version != null) message.version = object.version >>> 0;
					return message;
				};

				Network.toObject = function toObject(message, options) {
					if (!options) options = {};
					var object = {};
					if (options.defaults) {
						object.name = "";
						object.nethash = "";
						object.explorer = "";
						object.token = null;
						object.version = 0;
					}
					if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
					if (message.nethash != null && message.hasOwnProperty("nethash")) object.nethash = message.nethash;
					if (message.explorer != null && message.hasOwnProperty("explorer"))
						object.explorer = message.explorer;
					if (message.token != null && message.hasOwnProperty("token"))
						object.token = $root.peer.GetStatusResponse.Config.Network.Token.toObject(
							message.token,
							options,
						);
					if (message.version != null && message.hasOwnProperty("version")) object.version = message.version;
					return object;
				};

				Network.prototype.toJSON = function toJSON() {
					return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
				};

				Network.Token = (function () {
					function Token(properties) {
						if (properties)
							for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
								if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
					}

					Token.prototype.name = "";

					Token.prototype.symbol = "";

					Token.create = function create(properties) {
						return new Token(properties);
					};

					Token.encode = function encode(message, writer) {
						if (!writer) writer = $Writer.create();
						if (message.name != null && Object.hasOwnProperty.call(message, "name"))
							writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name);
						if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
							writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.symbol);
						return writer;
					};

					Token.encodeDelimited = function encodeDelimited(message, writer) {
						return this.encode(message, writer).ldelim();
					};

					Token.decode = function decode(reader, length) {
						if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
						var end = length === undefined ? reader.len : reader.pos + length,
							message = new $root.peer.GetStatusResponse.Config.Network.Token();
						while (reader.pos < end) {
							var tag = reader.uint32();
							switch (tag >>> 3) {
								case 1:
									message.name = reader.string();
									break;
								case 2:
									message.symbol = reader.string();
									break;
								default:
									reader.skipType(tag & 7);
									break;
							}
						}
						return message;
					};

					Token.decodeDelimited = function decodeDelimited(reader) {
						if (!(reader instanceof $Reader)) reader = new $Reader(reader);
						return this.decode(reader, reader.uint32());
					};

					Token.verify = function verify(message) {
						if (typeof message !== "object" || message === null) return "object expected";
						if (message.name != null && message.hasOwnProperty("name"))
							if (!$util.isString(message.name)) return "name: string expected";
						if (message.symbol != null && message.hasOwnProperty("symbol"))
							if (!$util.isString(message.symbol)) return "symbol: string expected";
						return null;
					};

					Token.fromObject = function fromObject(object) {
						if (object instanceof $root.peer.GetStatusResponse.Config.Network.Token) return object;
						var message = new $root.peer.GetStatusResponse.Config.Network.Token();
						if (object.name != null) message.name = String(object.name);
						if (object.symbol != null) message.symbol = String(object.symbol);
						return message;
					};

					Token.toObject = function toObject(message, options) {
						if (!options) options = {};
						var object = {};
						if (options.defaults) {
							object.name = "";
							object.symbol = "";
						}
						if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
						if (message.symbol != null && message.hasOwnProperty("symbol")) object.symbol = message.symbol;
						return object;
					};

					Token.prototype.toJSON = function toJSON() {
						return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
					};

					return Token;
				})();

				return Network;
			})();

			Config.Plugin = (function () {
				function Plugin(properties) {
					if (properties)
						for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
							if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
				}

				Plugin.prototype.port = 0;

				Plugin.prototype.enabled = false;

				Plugin.prototype.estimateTotalCount = false;

				Plugin.create = function create(properties) {
					return new Plugin(properties);
				};

				Plugin.encode = function encode(message, writer) {
					if (!writer) writer = $Writer.create();
					if (message.port != null && Object.hasOwnProperty.call(message, "port"))
						writer.uint32(/* id 1, wireType 0 =*/ 8).uint32(message.port);
					if (message.enabled != null && Object.hasOwnProperty.call(message, "enabled"))
						writer.uint32(/* id 2, wireType 0 =*/ 16).bool(message.enabled);
					if (message.estimateTotalCount != null && Object.hasOwnProperty.call(message, "estimateTotalCount"))
						writer.uint32(/* id 3, wireType 0 =*/ 24).bool(message.estimateTotalCount);
					return writer;
				};

				Plugin.encodeDelimited = function encodeDelimited(message, writer) {
					return this.encode(message, writer).ldelim();
				};

				Plugin.decode = function decode(reader, length) {
					if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
					var end = length === undefined ? reader.len : reader.pos + length,
						message = new $root.peer.GetStatusResponse.Config.Plugin();
					while (reader.pos < end) {
						var tag = reader.uint32();
						switch (tag >>> 3) {
							case 1:
								message.port = reader.uint32();
								break;
							case 2:
								message.enabled = reader.bool();
								break;
							case 3:
								message.estimateTotalCount = reader.bool();
								break;
							default:
								reader.skipType(tag & 7);
								break;
						}
					}
					return message;
				};

				Plugin.decodeDelimited = function decodeDelimited(reader) {
					if (!(reader instanceof $Reader)) reader = new $Reader(reader);
					return this.decode(reader, reader.uint32());
				};

				Plugin.verify = function verify(message) {
					if (typeof message !== "object" || message === null) return "object expected";
					if (message.port != null && message.hasOwnProperty("port"))
						if (!$util.isInteger(message.port)) return "port: integer expected";
					if (message.enabled != null && message.hasOwnProperty("enabled"))
						if (typeof message.enabled !== "boolean") return "enabled: boolean expected";
					if (message.estimateTotalCount != null && message.hasOwnProperty("estimateTotalCount"))
						if (typeof message.estimateTotalCount !== "boolean")
							return "estimateTotalCount: boolean expected";
					return null;
				};

				Plugin.fromObject = function fromObject(object) {
					if (object instanceof $root.peer.GetStatusResponse.Config.Plugin) return object;
					var message = new $root.peer.GetStatusResponse.Config.Plugin();
					if (object.port != null) message.port = object.port >>> 0;
					if (object.enabled != null) message.enabled = Boolean(object.enabled);
					if (object.estimateTotalCount != null)
						message.estimateTotalCount = Boolean(object.estimateTotalCount);
					return message;
				};

				Plugin.toObject = function toObject(message, options) {
					if (!options) options = {};
					var object = {};
					if (options.defaults) {
						object.port = 0;
						object.enabled = false;
						object.estimateTotalCount = false;
					}
					if (message.port != null && message.hasOwnProperty("port")) object.port = message.port;
					if (message.enabled != null && message.hasOwnProperty("enabled")) object.enabled = message.enabled;
					if (message.estimateTotalCount != null && message.hasOwnProperty("estimateTotalCount"))
						object.estimateTotalCount = message.estimateTotalCount;
					return object;
				};

				Plugin.prototype.toJSON = function toJSON() {
					return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
				};

				return Plugin;
			})();

			return Config;
		})();

		return GetStatusResponse;
	})();

	return peer;
})();

$root.shared = (function () {
	var shared = {};

	shared.Headers = (function () {
		function Headers(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		Headers.prototype.version = "";

		Headers.create = function create(properties) {
			return new Headers(properties);
		};

		Headers.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.version != null && Object.hasOwnProperty.call(message, "version"))
				writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.version);
			return writer;
		};

		Headers.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		Headers.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.shared.Headers();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.version = reader.string();
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		Headers.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		Headers.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.version != null && message.hasOwnProperty("version"))
				if (!$util.isString(message.version)) return "version: string expected";
			return null;
		};

		Headers.fromObject = function fromObject(object) {
			if (object instanceof $root.shared.Headers) return object;
			var message = new $root.shared.Headers();
			if (object.version != null) message.version = String(object.version);
			return message;
		};

		Headers.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) object.version = "";
			if (message.version != null && message.hasOwnProperty("version")) object.version = message.version;
			return object;
		};

		Headers.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return Headers;
	})();

	return shared;
})();

$root.transactions = (function () {
	var transactions = {};

	transactions.PostTransactionsRequest = (function () {
		function PostTransactionsRequest(properties) {
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		PostTransactionsRequest.prototype.transactions = $util.newBuffer([]);

		PostTransactionsRequest.prototype.headers = null;

		PostTransactionsRequest.create = function create(properties) {
			return new PostTransactionsRequest(properties);
		};

		PostTransactionsRequest.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.transactions != null && Object.hasOwnProperty.call(message, "transactions"))
				writer.uint32(/* id 1, wireType 2 =*/ 10).bytes(message.transactions);
			if (message.headers != null && Object.hasOwnProperty.call(message, "headers"))
				$root.shared.Headers.encode(message.headers, writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
			return writer;
		};

		PostTransactionsRequest.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		PostTransactionsRequest.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.transactions.PostTransactionsRequest();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						message.transactions = reader.bytes();
						break;
					case 2:
						message.headers = $root.shared.Headers.decode(reader, reader.uint32());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		PostTransactionsRequest.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		PostTransactionsRequest.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.transactions != null && message.hasOwnProperty("transactions"))
				if (
					!(
						(message.transactions && typeof message.transactions.length === "number") ||
						$util.isString(message.transactions)
					)
				)
					return "transactions: buffer expected";
			if (message.headers != null && message.hasOwnProperty("headers")) {
				var error = $root.shared.Headers.verify(message.headers);
				if (error) return "headers." + error;
			}
			return null;
		};

		PostTransactionsRequest.fromObject = function fromObject(object) {
			if (object instanceof $root.transactions.PostTransactionsRequest) return object;
			var message = new $root.transactions.PostTransactionsRequest();
			if (object.transactions != null)
				if (typeof object.transactions === "string")
					$util.base64.decode(
						object.transactions,
						(message.transactions = $util.newBuffer($util.base64.length(object.transactions))),
						0,
					);
				else if (object.transactions.length) message.transactions = object.transactions;
			if (object.headers != null) {
				if (typeof object.headers !== "object")
					throw TypeError(".transactions.PostTransactionsRequest.headers: object expected");
				message.headers = $root.shared.Headers.fromObject(object.headers);
			}
			return message;
		};

		PostTransactionsRequest.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.defaults) {
				if (options.bytes === String) object.transactions = "";
				else {
					object.transactions = [];
					if (options.bytes !== Array) object.transactions = $util.newBuffer(object.transactions);
				}
				object.headers = null;
			}
			if (message.transactions != null && message.hasOwnProperty("transactions"))
				object.transactions =
					options.bytes === String
						? $util.base64.encode(message.transactions, 0, message.transactions.length)
						: options.bytes === Array
						? Array.prototype.slice.call(message.transactions)
						: message.transactions;
			if (message.headers != null && message.hasOwnProperty("headers"))
				object.headers = $root.shared.Headers.toObject(message.headers, options);
			return object;
		};

		PostTransactionsRequest.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return PostTransactionsRequest;
	})();

	transactions.PostTransactionsResponse = (function () {
		function PostTransactionsResponse(properties) {
			this.accept = [];
			if (properties)
				for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
					if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]];
		}

		PostTransactionsResponse.prototype.accept = $util.emptyArray;

		PostTransactionsResponse.create = function create(properties) {
			return new PostTransactionsResponse(properties);
		};

		PostTransactionsResponse.encode = function encode(message, writer) {
			if (!writer) writer = $Writer.create();
			if (message.accept != null && message.accept.length)
				for (var i = 0; i < message.accept.length; ++i)
					writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.accept[i]);
			return writer;
		};

		PostTransactionsResponse.encodeDelimited = function encodeDelimited(message, writer) {
			return this.encode(message, writer).ldelim();
		};

		PostTransactionsResponse.decode = function decode(reader, length) {
			if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
			var end = length === undefined ? reader.len : reader.pos + length,
				message = new $root.transactions.PostTransactionsResponse();
			while (reader.pos < end) {
				var tag = reader.uint32();
				switch (tag >>> 3) {
					case 1:
						if (!(message.accept && message.accept.length)) message.accept = [];
						message.accept.push(reader.string());
						break;
					default:
						reader.skipType(tag & 7);
						break;
				}
			}
			return message;
		};

		PostTransactionsResponse.decodeDelimited = function decodeDelimited(reader) {
			if (!(reader instanceof $Reader)) reader = new $Reader(reader);
			return this.decode(reader, reader.uint32());
		};

		PostTransactionsResponse.verify = function verify(message) {
			if (typeof message !== "object" || message === null) return "object expected";
			if (message.accept != null && message.hasOwnProperty("accept")) {
				if (!Array.isArray(message.accept)) return "accept: array expected";
				for (var i = 0; i < message.accept.length; ++i)
					if (!$util.isString(message.accept[i])) return "accept: string[] expected";
			}
			return null;
		};

		PostTransactionsResponse.fromObject = function fromObject(object) {
			if (object instanceof $root.transactions.PostTransactionsResponse) return object;
			var message = new $root.transactions.PostTransactionsResponse();
			if (object.accept) {
				if (!Array.isArray(object.accept))
					throw TypeError(".transactions.PostTransactionsResponse.accept: array expected");
				message.accept = [];
				for (var i = 0; i < object.accept.length; ++i) message.accept[i] = String(object.accept[i]);
			}
			return message;
		};

		PostTransactionsResponse.toObject = function toObject(message, options) {
			if (!options) options = {};
			var object = {};
			if (options.arrays || options.defaults) object.accept = [];
			if (message.accept && message.accept.length) {
				object.accept = [];
				for (var j = 0; j < message.accept.length; ++j) object.accept[j] = message.accept[j];
			}
			return object;
		};

		PostTransactionsResponse.prototype.toJSON = function toJSON() {
			return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
		};

		return PostTransactionsResponse;
	})();

	return transactions;
})();

module.exports = $root;