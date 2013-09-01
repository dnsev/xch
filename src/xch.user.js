// ==UserScript==
// @name        xch
// @description E𝔁tension for 38𝒄𝒉an
// @version     0.2.2
// @namespace   dnsev
// @grant       GM_xmlhttpRequest
// @grant       GM_info
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @include     *://boards.38chan.net/*
// @require     https://raw.github.com/dnsev/xch/master/src/jquery.js
// @run-at      document-start
// @icon        data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAArElEQVRYw2NgGAWjYKQDRgYGhv9EqGEgQh1Z+pkGOgRYYIy3bKgSwr/gTBSX/y7Db+C3dAjNr4xd/uNdVPnBEwIwH8NCAkbDxNF9ztqFw4fppDlgUIQASirFFRJ4fE4ol/wf9CGA1SfoIYEnf+NN7UMiDWCNKzw+R1ePNSQIlQODKgTw+hxeDqCVhEi5gaK6ZEjUBSg+hoUArjrhG4kOGPAQGG0PjIJRMApGAQAW/TQofPgeiQAAAABJRU5ErkJggg==
// ==/UserScript==
// ==Meta==
// @updateURL      https://raw.github.com/dnsev/xch/master/{{meta}}
// @downloadURL    https://raw.github.com/dnsev/xch/master/{{target}}
// ==/Meta==



// Scope
var xch = (function () {
	"use strict";

	/*!debug!*/var assert = function (condition, message) { if (!condition) { var stack = ""; try { undefined.undefined = undefined; } catch (e) { stack = e.stack.toString(); } alert("Assertion failed; " + (message || "") + "\n\n" + stack); } }

	// Semi-globals
	var style = null;
	var communication = null;
	var location = null;
	var info = null;
	var content = null;
	var api = null;

	// Vars
	var xch = {

		// Script data
		script: {

			prefix: "xch",
			name: "xch",
			version: "inline",
			homepage: "http://dnsev.github.com/xch/",
			inline: true,
			site: "38chan",
			update_homepage: "http://dnsev.github.com/xch/#!install/update",
			update_url: "",
			browser: {
				firefox: false,
				chrome: false
			},

			initialize: function () {
				// Get the name and version
				try {
					// Greasemonkey
					xch.script.name = GM_info.script.name.toString();
					xch.script.version = GM_info.script.version.toString();
					xch.script.inline = false;
				}
				catch (e) {
					try {
						// Tampermonkey
						xch.script.name = GM_getMetadata("name").toString();
						xch.script.version = GM_getMetadata("version").toString();
						xch.script.inline = false;
					}
					catch (e) {
						// Not applicable
					}
				}

				// Update URL
				this.update_url = this.update_homepage;
				try {
					// Greasemonkey
					var m = /\/\/\s*@downloadURL\s+(\S+)/.exec(GM_info.scriptMetaStr);
					if (m) {
						xch.script.update_url = m[1];
					}
				}
				catch (e) {
					try {
						// Tampermonkey
						xch.script.update_url = GM_getMetadata("downloadURL").toString().trim();
					}
					catch (e) {
					}
				}

				// Local storage functions
				var okay = false;
				try {
					okay = !(!GM_getValue || (GM_getValue.toString && GM_getValue.toString().indexOf("not supported") >= 0));
				}
				catch (e) {
				}
				if (okay) {
					xch.get_value_raw = function (key, def) {
						var val = GM_getValue(key, undefined);
						return (val === undefined ? def : val);
					};
					xch.set_value_raw = function (key, value) {
						return GM_setValue(key, value);
					};
					xch.get_value = function (key, def) {
						var val = GM_getValue(key);
						if (val === undefined) return def;
						try {
							return JSON.parse(val);
						}
						catch (e) {
							return def;
						}
					};
					xch.set_value = function (key, value) {
						return GM_setValue(key, JSON.stringify(value));
					};
					xch.delete_value = function (key) {
						return GM_deleteValue(key);
					};
					xch.list_value_keys = function () {
						return GM_listValues();
					};
				}
				else {
					xch.get_value_raw = function (key, def) {
						var val = window.localStorage.getItem(key, null);
						return (val === null ? def : val);
					};
					xch.set_value_raw = function (key, value) {
						return window.localStorage.setItem(key, value);
					};
					xch.get_value = function (key, def) {
						var val = window.localStorage.getItem(key);
						if (val === null) return def;
						try {
							return JSON.parse(val);
						}
						catch (e) {
							return def;
						}
					};
					xch.set_value = function (key, value) {
						return window.localStorage.setItem(key, JSON.stringify(value));
					};
					xch.delete_value = function (key) {
						return window.localStorage.removeItem(key);
					};
					xch.list_value_keys = function () {
						return Object.keys(window.localStorage);
					};
				}

				// Site storage
				var site_prefix = xch.script.prefix + "_" + xch.script.site + "_";
				xch.site_get_value_raw = function (key, def) {
					return xch.get_value_raw(site_prefix + key, def);
				};
				xch.site_set_value_raw = function (key, value) {
					return xch.set_value_raw(site_prefix + key, value);
				};
				xch.site_get_value = function (key, def) {
					return xch.get_value(site_prefix + key, def);
				};
				xch.site_set_value = function (key, value) {
					return xch.set_value(site_prefix + key, value);
				};
				xch.site_delete_value = function (key) {
					return xch.delete_value(site_prefix + key);
				};
				xch.site_list_value_keys = function () {
					var k = xch.list_value_keys(), keys = [];
					for (var i = 0; i < k.length; ++i) {
						if (k[i].indexOf(site_prefix) == 0) keys.push(k[i]);
					}
					return keys;
				};

				// Browser
				var ua = navigator.userAgent.toString();
				if (ua.indexOf(" Firefox/") >= 0) {
					xch.script.browser.firefox = true;
				}
				else if (ua.indexOf(" Chrome/") >= 0) {
					xch.script.browser.chrome = true;
				}
			},
			register: function (html, addon_name, addon_version) {
				// Regsiter the addon in the HTML
				if (html.attr("addons")) {
					html.attr("addons", html.attr("addons") + "," + addon_name);
				}
				else {
					html.attr("addons", addon_name);
				}
			},
			block_scripts: function () {
				// Blocks website scripts
				var removal_count = 0;
				var removal_total = 10;

				var bse_callback;
				window.addEventListener("beforescriptexecute", (bse_callback = (function (event) {
					var ret = true;

					if (event.target.src) {
						// Remove main.js
						if (
							/main\.js$/.test(event.target.src) ||
							/inline-expanding\.js$/.test(event.target.src) ||
							/auto-reload\.js$/.test(event.target.src) ||
							/post-hover\.js$/.test(event.target.src) ||
							/show-backlinks\.js$/.test(event.target.src) ||
							/show-op\.js$/.test(event.target.src) ||
							/jquery\.min\.js$/.test(event.target.src)
						) {
							ret = false;
						}
					}
					else {
						// Remove rememberStuff();
						if (event.target.innerHTML.length < 100) {
							if (
								/^\s*rememberStuff\(\);\s*$/.test(event.target.innerHTML)
							) {
								ret = false;
							}
							else if (
								/^\s*var configRoot=/.test(event.target.innerHTML)
							) {
								ret = false;
							}
							else if (
								/^\s*ready\(\);\s*$/.test(event.target.innerHTML)
							) {
								ret = false;
							}
						}
					}

					if (!ret) {
						// Stop
						event.preventDefault();
						event.stopPropagation();
						// Remove
						if (event.target.parentNode) {
							event.target.parentNode.removeChild(event.target);
						}
						// Remove when done
						if (++removal_count >= removal_total) {
							window.removeEventListener("beforescriptexecute", bse_callback, true);
						}
					}
					return ret;
				})), true);
			},
			startup: function () {
				// Initialize script
				xch.script.initialize();

				// Meta
				var meta = new xch.Meta();
				if (meta.page_okay) {
					// Block
					xch.script.block_scripts();

					// Location
					location = new xch.Location();

					// API
					api = new xch.API();

					// Communication
					communication = new xch.Communication();

					// HTML ready
					$(document).ready(function() {
						// Get html
						var html = $("html");

						// Validate
						if (meta.validate(html)) {
							// Ready
							communication.ready(xch.script.site);

							// Register addon
							xch.script.register(html, xch.script.name, xch.script.version);

							// Info
							info = new xch.Information(meta, html);

							// Styling
							style = new xch.Style(html);

							// Context
							var context = new xch.Content.Context({
								info: info,
								html: html,
								post_queue: null,
								html_target: null,
								stylize: true,
								is_new: true
							});

							// Content
							content = new xch.Content(context);
							content.parse(context);

							// Update
							var updater = new xch.ScriptUpdater();
							updater.execute();
						}
						else {
							// TODO : Delete some stuff
						}
					});

				}
			}

		},

		settings: {
			parsing_group: {
				size: 20,
				interval: 0.0625,
				use_single: true
			},
			image_preview: {
				"default": ".jpg",
				enabled: {
					".jpg": true,
					".png": true,
					".gif": true,
					spoiler: true
				},
				open_timeout: 0.0,
				open_timeout_spoiler: 0.25,
				zooming: {
					enabled: true,
					bounded: true,
					invert: false
				},
				upscale: false,
				click: {
					if_closed: "toggle", // toggle,tab,embed,nothing
					if_open: "embed"
				},
				close_on_click: true
			},
			sourcing: {
				source_text: "https://www.google.com/searchbyimage?image_url=%thumbnail;text:google;if_spoiler:false\n> https://www.google.com/searchbyimage?image_url=%thumbnail;text:Thumbnail\n> https://www.google.com/searchbyimage?image_url=%image;text:Full image\nhttps://www.google.com/searchbyimage?image_url=%image;text:google;if_not_spoiler:false\nhttp://regex.info/exif.cgi?imgurl=%image;text:exif"
			},
			post: {
				footer_backlinks: false,
				time: {
					format: "m/d/y (D) H:i:s",
					offset: 0
				},
				fetching: {
					new_priority: true
				},
				inlining: {
					highlight_on_hover: {
						if_floating: {
							target: true,
							original: true
						},
						if_embedded: {
							target: true,
							original: false
						}
					},
					on_screen: {
						none: {
							inline: true,
							embed: true,
							scroll: true,
							highlight: true
						},
						partial: {
							inline: true,
							embed: true,
							scroll: true,
							highlight: true
						},
						complete: {
							inline: true,
							embed: true,
							scroll: true,
							highlight: true
						}
					},
					allow_cyclic: false
				}
			}
		},

		mime_types: {
			"image/jpeg": {
				name: "JPEG Image",
				extensions: [".jpg",".jpeg"]
			},
			"image/gif": {
				name: "Animated GIF",
				extensions: [".gif"]
			},
			"image/png": {
				name: "PNG Image",
				extensions: [".png"]
			},
			"image/bmp": {
				name: "BMP Image",
				extensions: [".bmp"]
			}
		},


		// Helping functions
		get_value_raw: null,
		set_value_raw: null,
		get_value: null,
		set_value: null,
		delete_value: null,
		list_value_keys: null,

		site_get_value_raw: null,
		site_set_value_raw: null,
		site_get_value: null,
		site_set_value: null,
		site_delete_value: null,
		site_list_value_keys: null,

		ajax: function (data) {
			var gm = (data && data.gm);

			// XHR or GM
			var xhr;
			if (gm && !(xch.script.inline || xch.script.browser.chrome)) {
				// Create
				xhr = {
					method: (data.method || "GET"),
					url: data.url,
					upload: {}
				};

				// Data
				if (data.post_data) {
					arg.data = data.post_data;
				}

				// Return type
				if (data.return_type == "arraybuffer") {
					arg.overrideMimeType = "text/plain; charset=x-user-defined";
				}
				else if (data.return_type == "html") {
					arg.responseType = "document";
				}
				else if (data.return_type == "json") {
					arg.responseType = "json";
				}
				else {
					arg.responseType = "text";
				}
			}
			else {
				// Create
				xhr = new XMLHttpRequest();

				// Open
				xhr.open(data.method || "GET", data.url, true);
				if (data.cred) xhr.withCredentials = true;

				// Return type
				if (data.return_type == "arraybuffer") {
					xhr.overrideMimeType("text/plain; charset=x-user-defined");
					xhr.responseType = "arraybuffer";
				}
				else if (data.return_type == "html") {
					xhr.responseType = "document";
				}
				else if (data.return_type == "json") {
					xhr.responseType = "json";
				}
				else {
					xhr.responseType = "text";
				}
			}


			// Events
			var fcn = typeof(function(){});
			var on = (data ? data.on : null) || {};
			var on_complete = (typeof(on.complete) == fcn ? on.complete : null);
			var on_load = (typeof(on.load) == fcn ? on.load : null);
			var on_error = (typeof(on.error) == fcn ? on.error : null);
			var on_abort = (typeof(on.abort) == fcn ? on.abort : null);
			var on_progress = (typeof(on.progress) == fcn ? on.progress : null);
			var on_upload_load = (on.upload && typeof(on.upload.load) == fcn ? on.upload.load : null);
			var on_upload_abort = (on.upload && typeof(on.upload.abort) == fcn ? on.upload.abort : null);
			var on_upload_error = (on.upload && typeof(on.upload.error) == fcn ? on.upload.error : null);
			var on_upload_progress = (on.upload && typeof(on.upload.progress) == fcn ? on.upload.progress : null);

			// Load
			if (on_load || on_complete) {
				xhr.onload = function (event) {
					if (on_load) {
						var o = (gm ? event : this);
						var response = (gm ? o.responseText : o.response);

						if (o.status == 200) {
							// Convert to array buffer
							if (data.return_type == "arraybuffer") {
								response = new Uint8Array(response);
							}

							// Good callback
							on_load.call(data, {
								okay: true,
								data: data,
								status: o.status,
								response: response,
								status_text: o.statusText
							});
						}
						else {
							// Bad callback
							on_load.call(data, {
								okay: false,
								data: data,
								status: o.status,
								response: response,
								status_text: o.statusText
							});
						}
					}

					// Completed
					if (on_complete) {
						on_complete.call(data, {
							data: data
						});
					}
				};
			}

			// Progress
			if (on_progress) {
				xhr.onprogress = function (event) {
					on_progress.call(data, {
						event: event,
						data: data
					});
				};
			}

			// Error
			if (on_error || on_complete) {
				xhr.onerror = function (event) {
					if (on_error) {
						on_error.call(data, {
							event: event,
							data: data
						});
					}

					// Completed
					if (on_complete) {
						on_complete.call(data, {data:data});
					}
				};
			}

			// Abort
			if (on_abort || on_complete) {
				xhr.onabort = function (event) {
					if (on_abort) {
						on_abort.call(data, {
							event: event,
							data: data
						});
					}

					// Completed
					if (on_complete) {
						on_complete.call(data, {data:data});
					}
				};
			}

			// Upload progress
			if (on_upload_progress) {
				xhr.upload.onprogress = function (event) {
					on_upload_progress.call(data, {
						event: event,
						data: data
					});
				};
			}

			// Upload error
			if (on_upload_error) {
				xhr.upload.onerror = function (event) {
					on_upload_error.call(data, {
						event: event,
						data: data
					});
				};
			}

			// Upload abort
			if (on_upload_abort) {
				xhr.upload.onabort = function (event) {
					on_upload_abort.call(data, {
						event: event,
						data: data
					});
				};
			}

			// Upload done
			if (on_upload_load) {
				xhr.upload.onload = function (event) {
					on_upload_load.call(data, {
						event: event,
						data: data
					});
				};
			}


			// Call
			if (gm) {
				// Send
				var g = GM_xmlhttpRequest(arg);

				// Return
				return g;
			}
			else {
				// Send
				if (data.post_data) {
					//xhr.setRequestHeader("Content-Type", "multipart/form-data");
					xhr.send(data.post_data);
				}
				else {
					xhr.send();
				}

				// Return
				return xhr;
			}
		},

		date: (function () {

			var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			var months_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			var days_short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
			var ordinal = ["st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th", "st"];

			var format_value = function (date, format) {
				var s = "";
				if (format == 'd') { // Day of the month, 2 digits with leading zeros
					s += date.getDate();
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 'j') { // Day of the month without leading zeros
					s += date.getDate();
				}
				else if (format == 'l') { // A full textual representation of the day of the week
					s += days[date.getDay()];
				}
				else if (format == 'D') { // A textual representation of a day, three letters
					s += days_short[date.getDay()];
				}
				else if (format == 'S') { // English ordinal suffix for the day of the month, 2 characters
					s +=ordinal[date.getDate() - 1];
				}
				else if (format == 'w') { // Numeric representation of the day of the week
					s += date.getDay();
				}
				else if (format == 'F') { // A full textual representation of a month, such as January or March
					s += months[date.getMonth()];
				}
				else if (format == 'M') { // A short textual representation of a month, three letters
					s += months_short[date.getMonth()];
				}
				else if (format == 'm') { // Numeric representation of a month, with leading zeros
					s += (date.getMonth() + 1);
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 'n') { // Numeric representation of a month, without leading zeros
					s += (date.getMonth() + 1);
				}
				else if (format == 'y') { // Year, 2 digits
					s += date.getFullYear().toString().substr(2);
				}
				else if (format == 'Y') { // A full numeric representation of a year, 4 digits
					s += date.getFullYear();
				}
				else if (format == 'a') { // Lowercase Ante meridiem and Post meridiem
					s += (date.getHours() >= 11 && date.getHours() <= 22 ? "pm" : "am");
				}
				else if (format == 'A') { // Uppercase Ante meridiem and Post meridiem
					s += (date.getHours() >= 11 && date.getHours() <= 22 ? "PM" : "AM");
				}
				else if (format == 'g') { // 12-hour format of an hour without leading zeros
					s += (date.getHours() % 12) + 1;
				}
				else if (format == 'h') { // 12-hour format of an hour without leading zeros
					s += (date.getHours() % 12) + 1;
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 'G') { // 12-hour format of an hour with leading zeros
					s += date.getHours();
				}
				else if (format == 'H') { // 12-hour format of an hour with leading zeros
					s += date.getHours();
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 'i') { // Minutes with leading zeros
					s += date.getMinutes();
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 's') { // Seconds with leading zeros
					s += date.getSeconds();
					if (s.length < 2) s = "0" + s;
				}
				else if (format == 'u') { // Microseconds
					s += date.getMilliseconds();
				}
				else { // Unknown
					s += format;
				}
				return s;
			}

			return {

				format: function (timestamp, format) {
					// Based on: http://php.net/manual/en/function.date.php
					var date = new Date(timestamp);

					return format.replace(/(\\*)([a-zA-Z])/g, function (match, esc, fmt) {
						if (esc.length > 0) {
							if ((esc.length % 2) == 1) {
								// Escaped
								return esc.substr(1, (esc.length - 1) / 2) + fmt;
							}
							// Remove slashes
							return esc.substr(0, esc.length / 2) + format_value(date, fmt);
						}
						return format_value(date, fmt);
					});
				}

			};

		})(),

		insert_dom_element_sorted: function (parent, element, sort_function, sort_function_data) {
			// sort_function = function (existing_element, inserting_element, sort_function_data) {}
			// should return true if inserting_element should be inserted after existing_element
			// starts from the end, moves to the start
			var children = parent.children(), i = children.length - 1, c;
			while (i >= 0) {
				// Insert?
				if (sort_function((c = $(children[i])), element, sort_function_data)) {
					c.after(element);
					return;
				}
				// Next
				--i;
			}
			// Add to start
			parent.prepend(element);
		},

		insert_element_sorted: function (array, element, sort_function, sort_function_data) {
			// sort_function = function (existing_element, inserting_element, sort_function_data) {}
			// should return true if inserting_element should be inserted after existing_element
			// starts from the end, moves to the start
			var i = array.length - 1;
			while (i >= 0) {
				// Insert?
				if (sort_function(array[i], element, sort_function_data)) {
					array.splice(i + 1, 0, element);
					return i + 1;
				}
				// Next
				--i;
			}
			// Add to start
			array.splice(0, 0, element);
			return 0;
		},

		choose: function (elements, count) {
			// (elements.length choose count)
			var result = [];
			for (var i = 0; i < elements.length; i++) {
				if (count == 1) {
					result.push([elements[i]]);
				}
				else {
					var more = xch.choose(elements.slice(i+1, elements.length), count - 1);
					for (var j = 0; j < more.length; j++) {
						result.push([elements[i]].concat(more[j]));
					}
				}
			}
			return result;
		},

		swap_elements: function (e1, e2) {
			e1 = e1[0];
			e2 = e2[0];
			var p1 = e1.parentNode;
			var p2 = e2.parentNode;
			if (p1 && p2) {
				var e1_sibling = (e1.nextSibling === e2 ? e1 : e1.nextSibling);
				p2.insertBefore(e1, e2);
				if (e1_sibling) {
					p1.insertBefore(e2, e1_sibling);
				}
				else {
					p1.appendChild(e2);
				}
			}
		},

		get_selection: function (element) {
			var start = 0, end = 0, elem = element[0];

			if (typeof(elem.selectionStart) == "number" && typeof(elem.selectionEnd) == "number") {
				start = elem.selectionStart;
				end = elem.selectionEnd;
			}
			else {
				var range = document.selection.createRange();

				if (range && range.parentElement() == elem) {
					var len = elem.value.length;
					var normalized = elem.value.replace(/\r\n/g, "\n");

					var input_range = elem.createTextRange();
					input_range.moveToBookmark(range.getBookmark());

					var end_range = elem.createTextRange();
					end_range.collapse(false);

					if (input_range.compareEndPoints("StartToEnd", end_range) > -1) {
						start = end = len;
					}
					else {
						start = -input_range.moveStart("character", -len);
						start += normalized.slice(0, start).split("\n").length - 1;

						if (input_range.compareEndPoints("EndToEnd", end_range) > -1) {
							end = len;
						}
						else {
							end = -input_range.moveEnd("character", -len);
							end += normalized.slice(0, end).split("\n").length - 1;
						}
					}
				}
			}

			return {
				start: start,
				end: end
			};
		},
		set_selection: function (element, start, end) {
			element = element[0];

			if (element.createTextRange) {
				var selRange = element.createTextRange();
				selRange.collapse(true);
				selRange.moveStart("character", start);
				selRange.moveEnd("character", end);
				selRange.select();
				element.focus();
			}
			else if (element.setSelectionRange) {
				element.focus();
				element.setSelectionRange(start, end);
			}
			else if (element.selectionStart !== undefined) {
				element.selectionStart = start;
				element.selectionEnd = end;
				element.focus();
			}
		},

		format_number: function (n, cutoff, divisor, decimal_count, labels) {
			var d = Math.pow(10, decimal_count), i = 0;

			while (true) {
				if (n < cutoff || i + 1 >= labels.length) break;
				n /= divisor;
				++i;
			}

			return (Math.round(n * d) / d) + labels[i];
		},

		dom_to_string: function (object, filter_function) {
			var str = "";

			var conts = object.contents();
			for (var i = 0; i < conts.length; ++i) {
				if (conts[i].tagName === undefined) {
					str += conts[i].nodeValue.replace(/\s+/g, " ");
				}
				else {
					var me = $(conts[i]);
					if (!filter_function || filter_function.call(conts[i], me, object)) {
						str += xch.dom_to_string(me);
						if (conts[i].tagName == "BR" || me.css("display") == "block") str += "\n";
					}
				}
			}

			return str;
		},

		string_to_dom: (function () {

			var pfs_supported = ((new DOMParser()).parseFromString("", "text/html") != null);

			return (pfs_supported ?
				function (str) {
					// Firefox version
					var html;
					try {
						html = (new DOMParser()).parseFromString(str, "text/html");
						/*!debug!*/if (!html) console.log("string_to_dom parsing error: " + html + " returned");
						/*!debug!*/if (!html) console.log(str);
					}
					catch (e) {
						html = null;
						/*!debug!*/console.log("string_to_dom parsing error: " + e.toString());
						/*!debug!*/console.log(str);
					}
					return html;
				} :
				function (str) {
					// Chrome version
					var new_document = document.implementation.createHTMLDocument("");
					var doc_element = new_document.documentElement;

					doc_element.innerHTML = str;
					var first_element = doc_element.firstElementChild;

					if (
						doc_element.childElementCount === 1 &&
						first_element.localName.toLowerCase() === "html"
					) {
						new_document.replaceChild(first_element, doc_element);
					}

					return new_document;
				}
			);

		})(),

		get_mime_type_from_extension: function (ext) {
			ext = ext.toLowerCase();

			for (var mt in xch.mime_types) {
				for (var i = 0, exts = xch.mime_types[mt].extensions; i < exts.length; ++i) {
					if (ext == exts[i]) return mt;
				}
			}

			return null;
		},

		ensure_same_mime_type_extension: function (source_filename, target_filename) {
			var ext1 = source_filename.split(".");
			var ext2 = target_filename.split(".");
			ext1 = (ext1.length == 1 ? "" : "." + ext1.pop());
			ext2 = (ext2.length == 1 ? "" : "." + ext2.pop());

			if (xch.get_mime_type_from_extension(ext1) != xch.get_mime_type_from_extension(ext2)) {
				return target_filename + ext1;
			}
			return target_filename;
		},

		get_debug_info: function () {
			// Get saved data
			var sd_keys = xch.list_value_keys();
			sd_keys.sort(function(a, b) {
				return (a < b ? -1 : (a > b ? 1 : 0));
			});
			var sd = {};
			for (var i = 0; i < sd_keys.length; ++i) {
				sd[sd_keys[i]] = xch.get_value(sd_keys[i], null);
			}

			// Data to save
			var data = {
				info: info,
				content: content,
				communication: communication,
				location: location,
				settings: xch.settings,
				saved_data: sd
			};

			var info_str = xch.JSON.stringify(data, function (obj, level, member, parent) {
				if (obj instanceof Function) {
					// Stub
					return false;
				}
				else if (obj instanceof xch.Content) {
					return {
						filter: {
							deny: [{
								name: "board_map",
								cascade: false,
								stub: true
							}, {
								name: "my_posts",
								cascade: false,
								stub: true
							}]
						}
					};
				}
				else if (obj instanceof xch.PostQueue) {
					return {
						filter: {
							deny: [{
								name: "post_queue",
								cacade: false,
								stub: true
							}]
						}
					};
				}
				else if (obj instanceof xch.Thread) {
					// Show nothing
					return false;
				}
				else if (obj instanceof xch.Post) {
					// Show nothing
					return false;
				}
				else if (obj instanceof xch.Image) {
					// Show nothing
					return false;
				}
				else if (obj instanceof xch.Style) {
					// Show nothing
					return false;
				}
				else if (obj instanceof xch.QuickReply) {
					// Show nothing
					return {
						filter: {
							deny: [{
								name: "saved_post_settings",
								cascade: false,
								stub: true
							}, {
								name: "post_data",
								cascade: false,
								stub: true
							}, {
								name: ["post_context","data_fields_extra"],
								cascade: false,
								stub: true
							}, {
								name: ["submitting","ajax"],
								cascade: false,
								stub: true
							}]
						}
					};
				}
				else if (obj instanceof jQuery) {
					// Limit
					return {
						info: {
							type: "jQuery"
						},
						filter: {
							depth: 1,
							allow: [{
								name: "selector",
								cascade: false
							}, {
								name: "length",
								cascade: false
							}],
							inherit: {
								depth: true,
								allow: false,
								deny: false
							}
						}
					};
				}
				else if (obj == sd) {
					// Show nothing for saved data
					return {
						filter: {
							deny: [{
								name: function (name, level_offset) {
									return (name.indexOf("xch") != 0 || name.indexOf("my_posts") >= 0);
								},
								cascade: false,
								stub: false
							}]
						}
					};
				}
				return true;
			});

			return info_str;
		},

		format_string: function (str, formatters, data) {
			if (formatters instanceof Function) {
				// Function call
				return str.replace(/%(\w+|%)\\?/g, function (match, fmt) {
					return formatters.call(match, fmt, data);
				});
			}
			else if (formatters instanceof Object) {
				return str.replace(/%(\w+|%)\\?/g, function (match, fmt) {
					if (fmt in formatters) {
						// Function
						if (formatters[fmt] instanceof Function) {
							return formatters[fmt].call(match, fmt, data);
						}
						// String or other
						return formatters[fmt];
					}

					return fmt;
				});
			}
			else {
				return str.replace(/%(\w+|%)\\?/g, function (match, fmt) {
					return fmt;
				});
			}
		},

		string_to_truth: function (str) {
			str = str.trim().toLowerCase();
			return !(str.length == 0 || str == "0" || str == "no" || str == "false");
		},

		merge_settings: function (source, target, new_objects_allowed) {
			for (var key in source) {
				if (key in target) {
					if (source[key] instanceof Object) {
						if (target[key] instanceof Object) {
							// Recursive
							xch.merge_settings(source[key], target[key], new_objects_allowed);
						}
						else {
							// Object copy
							if (new_objects_allowed) {
								target[key] = source[key];
							}
						}
					}
					else {
						// Simple
						target[key] = source[key];
					}
				}
			}
		},

		JSON: (function () {

			var Pointer = function (tree) {
				this.tree = tree;
			};
			var Type = function (typename, data, has_data) {
				this.typename = typename;
				this.data = data;
				this.parse = true;
				this.has_data = has_data;

				if (has_data && typeof(typename) != typeof("")) {
					this.data = typename;
					/*
					if (typename == Function && typeof(this.data) == typeof("")) {
						this.parse = false;
						this.data = new Function(this.data.replace(/^\s*function\s*\w*?\(\s*\)\s*\{|}\s*$/g, ""));
					}
					*/
				}
			};
			var Filter = function () {
				this.depth = -1;
				this.deny = null;
				this.allow = null;
				this.stub = false;

				if (arguments.length == 1) {
					var other = arguments[0];
					if (other.depth >= 0) this.depth = other.depth - 1;
					if (other.deny != null) this.deny = other.deny.slice(0);
					if (other.allow != null) this.allow = other.allow.slice(0);
				}
				else if (arguments.length > 2) {
					var other = arguments[0];
					var source = arguments[1];
					var source_level = arguments[2];

					if (other.depth >= 0) {
						this.depth = other.depth - 1;
					}
					if ("inherit" in source) {
						if (!source.inherit.depth) this.depth = ("depth" in source) ? source.depth : -1;
					}
					else if ("depth" in source) {
						this.depth = source.depth;
					}

					if (other.deny != null && (!("inherit" in source) || source.inherit.deny)) {
						this.deny = other.deny.slice(0);
					}
					if ("deny" in source) {
						if (this.deny == null) this.deny = [];
						for (var i = 0; i < source.deny.length; ++i) {
							this.deny.push(source.deny[i]);
							source.deny[i].source_level = source_level;
							if (!(source.deny[i].name instanceof Array)) source.deny[i].name = [ source.deny[i].name ]; // wrap
						}
					}

					if (other.allow != null && (!("inherit" in source) || source.inherit.allow)) {
						this.allow = other.allow.slice(0);
					}
					if ("allow" in source) {
						if (this.allow == null) this.allow = [];
						for (var i = 0; i < source.allow.length; ++i) {
							this.allow.push(source.allow[i]);
							source.allow[i].source_level = source_level;
							if (!(source.allow[i].name instanceof Array)) source.allow[i].name = [ source.allow[i].name ]; // wrap
						}
					}

					if ("stub" in source) this.stub = source.stub;
				}
			};

			var class_of = function (obj) {
				var n = "";
				if (obj.constructor) {
					n = obj.constructor.name;
				}
				if (!n) {
					n = "Object";
				}
				return n;
			};
			var string_representation = function (str) {
				return '"' + str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + '"';
			};

			var needs_stringed_key = function (key) {
				key = key.toString();
				return (/\W/.test(key) || /^[0-9]+[^0-9]/.test(key));
			};

			var string_settings = {
				object_opener: "{",
				object_closer: "}",
				array_opener: "[",
				array_closer: "]",
				name_delimiter: ": ",
				list_delimiter: ",",
				newline: "\n",
				spacing: "  ",
				pointer_function: "xch.JSON.pointer",
				type_function: "xch.JSON.type",
				stub_function: "xch.JSON.stub",
				function_start: "(",
				function_end: ")",
				function_param_delimiter: ", ",
				filtered_members: "/* ... */",
				stub_function_body: "function () { /* ... */ }"
			};

			var check_filter = function (data, member, level, filter, location) {
				var good = true, stub = false, i, j, k, cont;

				// Allowed
				if (filter.allow != null) {
					good = false;
					for (i = 0; i < filter.allow.length; ++i) {
						// Level okay
						if (
							location.length >= filter.allow[i].name.length &&
							(filter.allow[i].cascade || level == filter.allow[i].source_level + filter.allow[i].name.length)
						) {
							// Name check
							j = filter.allow[i].name.length - 1;
							// Compare
							if (filter.allow[i].name[j] instanceof Function) {
								cont = filter.allow[i].name[j].call(data, member, 0);
							}
							else {
								cont = (member === filter.allow[i].name[j]);
							}
							// Check
							if (cont) {
								k = location.length - 1;
								for (--j; j >= 0; --j) {
									// Compare
									if (filter.allow[i].name[j] instanceof Function) {
										cont = filter.allow[i].name[j].call(data, location[k], location.length - k);
									}
									else {
										cont = (location[k] === filter.allow[i].name[j]);
									}
									// Check
									if (!cont) break; // mismatch
									--k;
								}
								// Complete match
								if (j < 0) {
									good = true;
									break;
								}
							}
						}
					}
					if (!good) {
						stub = filter.stub || false;
					}
				}

				// Deny
				if (good && filter.deny != null) {
					for (i = 0; i < filter.deny.length; ++i) {
						// Level okay
						if (
							location.length >= filter.deny[i].name.length &&
							(filter.deny[i].cascade || level == filter.deny[i].source_level + filter.deny[i].name.length)
						) {
							// Name check
							j = filter.deny[i].name.length - 1;
							// Compare
							if (filter.deny[i].name[j] instanceof Function) {
								cont = filter.deny[i].name[j].call(data, member, 0);
							}
							else {
								cont = (member === filter.deny[i].name[j]);
							}
							// Check
							if (cont) {
								k = location.length - 1;
								for (--j; j >= 0; --j) {
									// Compare
									if (filter.deny[i].name[j] instanceof Function) {
										cont = filter.deny[i].name[j].call(data, location[k], location.length - k);
									}
									else {
										cont = (location[k] === filter.deny[i].name[j]);
									}
									// Check
									if (!cont) break; // mismatch
									--k;
								}
								// Complete match
								if (j < 0) {
									good = false;
									stub = filter.deny[i].stub || false;
									break;
								}
							}
						}
					}
				}

				// Done
				return [ good , stub ];
			};
			var form_object = function (data, root) {
				// Corrects all filtered/cyclic/typed references

				if (data instanceof Object) {
					for (var member in data) {
						// Type checking
						if (data[member] instanceof Pointer) {
							// Resolve pointer
							var r = root;
							for (var i = 0, tree = data[member].tree; i < tree.length; ++i) {
								if (tree[i] in r) {
									r = r[tree[i]];
								}
								else {
									r = undefined;
									break;
								}
							}
							data[member] = r;
						}
						else if (data[member] instanceof Type) {
							if (data[member].has_data) {
								// Remove type
								data[member] = (data[member].parse ? form_object(data[member].data) : data[member].data);
							}
							else {
								// Filtered; remove
								delete data[member];
							}
						}
						else {
							// Continue filtering
							data[member] = form_object(data[member]);
						}
					}
				}

				return data;
			};
			var form_string = function (data, about_function, info, stub, member_name, parent) {
				if (info == null) {
					info = {
						parsed: [],
						filter: new Filter(),
						spacing: "",
						location: ["root"]
					};
				}

				var str = "";

				if (data instanceof Object) {
					// Pointer?
					var found = false;
					for (var i = 0; i < info.parsed.length; ++i) {
						if (info.parsed[i].data == data) {
							// Create pointer
							str += string_settings.pointer_function + string_settings.function_start;
							for (var j = 0; j < info.parsed[i].location.length; ++j) {
								if (j > 0) str += string_settings.function_param_delimiter;
								if (typeof(info.parsed[i].location[j]) == typeof(0)) {
									str += info.parsed[i].location[j];
								}
								else {
									str += string_representation(info.parsed[i].location[j]);
								}
							}
							str += string_settings.function_end;
							found = true;
							break;
						}
					}

					// Not a pointer
					if (!found) {
						// Get the prototype (if any)
						var proto = data.__proto__ || (data.constructor ? data.constructor.prototype : null);

						// Add to parsed
						info.parsed.push({
							data: data,
							location: info.location.slice(0)
						});

						// About info
						var level = info.location.length - 1;
						var about = (about_function ? about_function(data, level, member_name, parent) : true);

						// Vars
						var type = class_of(data);
						var old_filter = info.filter;

						// New filter
						if (about instanceof Object) {
							// Info
							if ("info" in about) {
								if ("type" in about.info) type = about.info.type;
							}
							// New filter
							if ("filter" in about) {
								if (about.filter instanceof Object) {
									info.filter = new Filter(old_filter, about.filter, level);
								}
							}
						}
						if (info.filter == old_filter) {
							// New filter
							info.filter = new Filter(old_filter);
						}

						// Display as stub
						stub = stub || (about === false || (about instanceof Object && "filter" in about && about.filter === false));

						// What type
						if (data instanceof Function) {
							// Function
							str += string_settings.type_function + string_settings.function_start + "Function" + string_settings.function_param_delimiter;
							str += string_representation(stub ? string_settings.stub_function_body : data.toString());
							str += string_settings.function_end;
						}
						else {
							// Stub
							if (stub) {
								// Fully filtered out
								str += string_settings.stub_function + string_settings.function_start;
								str += string_representation(type);
								str += string_settings.function_end;
							}
							else {
								var is_array = (data instanceof Array);

								// Spacing change
								info.spacing += string_settings.spacing;

								// Typed function
								if (!is_array && type != "Object") {
									str += string_settings.type_function + string_settings.function_start;
									str += string_representation(type);
									str += string_settings.function_param_delimiter;
								}

								// Opener
								str += (is_array ? string_settings.array_opener : string_settings.object_opener);

								// Members/array values
								var not_first = false;
								var missing_count = 0;
								if (info.filter.depth == 0) {
									// Display no members
									missing_count = 1;
								}
								else {
									for (var member in data) {
										// Not a prototype member
										if (is_array || !(proto && (member in proto) && proto[member] === data[member])) {
											// Filter
											if (is_array) member = parseInt(member);
											var good = check_filter(data, member, level + 1, info.filter, info.location);

											// Insert member
											if (good[0] || good[1]) {
												// Update location
												info.location.push(member);

												// String update
												if (not_first) str += string_settings.list_delimiter;
												str += string_settings.newline + info.spacing;
												if (!is_array) str += (needs_stringed_key(member) ? string_representation(member.toString()) : member) + string_settings.name_delimiter;
												try {
													str += form_string(data[member], about_function, info, good[1], member, data);
												}
												catch (e) {
													str += form_string({}, about_function, info, good[1], "", null);
												}

												// Next
												not_first = true;
												info.location.pop();
											}
											else {
												// Omitted
												++missing_count;
											}
										}
									}
								}
								// Anything missing
								if (missing_count > 0) {
									str += string_settings.newline + info.spacing + string_settings.filtered_members;
								}

								// Finish
								info.spacing = info.spacing.substr(0, info.spacing.length - string_settings.spacing.length);
								str += string_settings.newline + info.spacing;
								str += (is_array ? string_settings.array_closer : string_settings.object_closer);

								// Function finish
								if (!is_array && type != "Object") {
									str += string_settings.function_end;
								}
							}
						}

						// Filter change
						info.filter = old_filter;
					}
				}
				else {
					if (stub) {
						// Fully filtered out
						str += string_settings.stub_function + string_settings.function_start;
						if (data === true || data === false) {
							str += string_representation("boolean");
						}
						else if (data === null) {
							str += string_representation("null");
						}
						else if (typeof(data) == typeof(1)) {
							str += string_representation("number");
						}
						else if (typeof(data) == typeof("")) {
							str += string_representation("string");
						}
						else {
							str += string_representation("undefined");
						}
						str += string_settings.function_end;
					}
					else {
						// Simple types
						if (data === true) {
							str += "true";
						}
						else if (data === false) {
							str += "false";
						}
						else if (data === null) {
							str += "null";
						}
						else if (typeof(data) == typeof(1)) {
							str += data.toString();
						}
						else if (typeof(data) == typeof("")) {
							str += string_representation(data);
						}
						else {
							str += "undefined";
						}
					}
				}

				return str;
			};

			// Methods
			return {

				type: function (typename, data) {
					return new Type(typename, data, arguments.length >= 2);
				},
				stub: function (typename) {
					return new Type(typename, null, false);
				},
				pointer: function () {
					return new Pointer(Array.prototype.slice.call(arguments, 0));
				},
				object: function (typename, data) {
					return form_object(data, data);
				},
				stringify: function (data, about_function) {
					return form_string(data, about_function, null, false, "", null);
				}

			};

		})(),


		// Updater
		ScriptUpdater: (function () {

			var ScriptUpdater = function () {
				this.error = false;
				this.changelog = null;
				this.ajax = null;

				this.settings = {
					check_interval: 60 * 60 // 1 hour
				};
			};

			var this_private = {

				on_ajax_load: function (event) {
					var j_data = null;
					try {
						j_data = JSON.parse(event.response);
					}
					catch (e) {
						j_data = null;
					}
					if (j_data != null) {
						event.data.self.changelog = event.data.self.parse_changelog(j_data);
						event.data.self.check_changelog_for_updates(event.data.self.changelog, event.data.update_data);
					}
					else {
						event.data.self.error = true;
					}
					event.data.self.ajax = null;
				},
				on_ajax_error: function (event) {
					event.data.self.error = true;
					event.data.self.ajax = null;
				},
				on_ajax_abort: function (event) {
					event.data.self.error = true;
					event.data.self.ajax = null;
				},
				on_ajax_progress: function (event) {
				},

				title_is_relevant: function (title) {
					return /[0-9\.]/.test(title);
				},

				version_compare: function (version_old, version_current) {
					if (version_current == version_old) return -2; // Same

					var v_current = version_current.split(".");
					var v_old = version_old.split(".");
					var change_direction = 0;

					var i, cur, old, cur_n, old_n, len = v_current.length;
					if (v_old.length > len) len = v_old.length;
					for (i = 0; i < len; ++i) {
						cur = (i < v_current.length ? parseInt(v_current[i].trim(), 10) : 0);
						old = (i < v_old.length ? parseInt(v_old[i].trim(), 10) : 0);
						cur = ((cur_n = isFinite(cur)) ? cur : 0);
						old = ((old_n = isFinite(old)) ? old : 0);
						if (cur == old) {
							if (!cur_n || !old_n) change_direction = 0;
						}
						else {
							if (cur > old) {
								// Newer
								change_direction = 1;
							}
							else {
								// Older
								change_direction = -1;
							}
							break;
						}
					}

					return change_direction;
				},

				fresh_install_alert: function (version_current) {
					new xch.Message({
						type: "good",
						title: "Userscript Installed",
						html: (
							style.e("div")
							.append(
								style.e("div")
								.append(style.t("Thank you for installing "))
								.append(
									style.e("a", "message_link")
									.attr("href", xch.script.homepage)
									.attr("target", "_blank")
									.text(xch.script.name)
								)
								.append(style.t("!"))
							)
							.append(
								style.e("div")
								.text("Please note that it is not complete yet, and some features will be missing.")
							)
						),
						life: 0
					});
				},
				version_change_alert: function (version_current, version_old) {
					var change_direction = this_private.version_compare.call(this, version_old, version_current);

					// Change
					if (change_direction > -2) {
						// Form text/links
						var change_text = "Script version has ";
						var changelog_link = "#!changes?from=";
						if (change_direction == 0) {
							change_text += "changed";
							changelog_link += version_old + "&to=" + version_current;
						}
						else if (change_direction > 0) {
							change_text += "increased";
							changelog_link += version_old + "&to=" + version_current;
						}
						else {
							change_text += "decreased";
							changelog_link += version_current + "&to=" + version_old;
						}
						change_text += " from ";

						// Html
						var message, changes_container, changes_list;
						(message = style.e("div"))
						.append(
							style.e("div")
							.append(
								style.t(change_text)
							)
							.append(
								style.e("a", "message_link")
								.attr("href", xch.script.homepage + "#!changes?version=" + version_old)
								.attr("target", "_blank")
								.text(version_old)
							)
							.append(style.t(" to "))
							.append(
								style.e("a", "message_link")
								.attr("href", xch.script.homepage + changelog_link)
								.attr("target", "_blank")
								.text(version_current)
							)
							.append(style.t("!"))
						);

						// Message
						new xch.Message({
							type: "good",
							title: "Userscript Updated",
							html: message,
							life: 0
						});
					}
				},

				update_alert: function (changes) {
					var message, show_changes, changes_container, changes_list;
					(message = style.e("div"))
					.append(
						style.e("div")
						.append(
							style.e("a", "message_link")
							.text("Click here")
							.attr("target", "_blank")
							.attr("href", xch.script.browser.chrome ? xch.script.update_homepage : xch.script.update_url)
						)
						.append(style.t(" to update, "))
						.append(
							(show_changes = style.e("a", "message_link"))
							.text("show changes")
						)
						.append(style.t(", or "))
						.append(
							style.e("a", "message_link")
							.text("view source")
							.attr("target", "_blank")
							.attr("href", "https://github.com/dnsev/xch/commit/" + changes[0].sha)
						)
						.append(style.t("."))
					)
					.append(
						(changes_container = style.e("div", "message_changes hidden"))
						.append(
							(changes_list = style.e("ul", "message_list"))
						)
					);

					// Events
					show_changes.on("click", { toggle_container: changes_container }, this_private.on_update_alert_changes_toggle_click);

					// Form changes
					for (var i = 0; i < changes.length; ++i) {
						var c = this.get_individual_changes(changes[i]);
						for (var j = 0; j < c.length; ++j) {
							changes_list.append(
								style.e("li", "message_list_item" + (j == 0 ? " message_list_item_big_spacing" : ""))
								.text(c[j])
							);
						}
					}

					new xch.Message({
						type: "good",
						title: "Update Available: Version " + changes[0].title,
						html: message,
						life: 0
					});
				},

				on_update_alert_changes_toggle_click: function (event) {
					if (event.which != 1) return true;

					if (event.data.toggle_container.hasClass("hidden")) {
						event.data.toggle_container.removeClass("hidden");
						$(this).text("hide changes");
					}
					else {
						event.data.toggle_container.addClass("hidden");
						$(this).text("show changes");
					}
				}

			};

			ScriptUpdater.prototype = {

				constructor: ScriptUpdater,

				execute: function () {
					this.update_check(this.version_check());
				},

				update_check: function (forced) {
					var check = false;
					var now = (new Date()).getTime();

					var update = (forced ? null : xch.site_get_value("script_update", null));
					if (update === null) {
						check = true;
						update = {
							timestamp: now,
							version: xch.script.version.trim()
						};
					}
					else {
						var timestamp_diff = (now - update.timestamp) || 0;

						if (timestamp_diff >= this.settings.check_interval * 1000) {
							// Full check
							check = true;
							update.timestamp = now;
							update.version = xch.script.version.trim();
						}
					}

					if (check) {
						// Check
						this.ajax = xch.ajax({
							url: "https://api.github.com/repos/dnsev/xch/commits",
							method: "GET",
							return_type: "text",
							on: {
								load: this_private.on_ajax_load,
								error: this_private.on_ajax_error,
								abort: this_private.on_ajax_abort,
								progress: this_private.on_ajax_progress
							},
							self: this,
							update_data: update
						});
					}
				},

				parse_changelog: function (j_data) {
					var changelog = [];

					for (var i = 0; i < j_data.length; ++i) {
						var title = j_data[i].commit.message.replace(/\s*\n\s*(0|[^0])*$/, "");

						if (this_private.title_is_relevant.call(this, title)) {
							var entry = {
								sha: j_data[i].sha,
								title: title,
								comment: j_data[i].commit.message.replace(/^[^\r\n]*\r?\n?\r?\n?/, ""),
								timestamp: 0,
							};

							var date = /^([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)Z$/.exec(j_data[i].commit.committer.date);
							if (date) {
								entry.timestamp = (new Date(
									parseInt(date[1]),
									parseInt(date[2]) - 1,
									parseInt(date[3]),
									parseInt(date[4]),
									parseInt(date[5]),
									parseInt(date[6])
								)).getTime();
							}

							changelog.push(entry);
						}
					}

					return changelog;
				},
				check_changelog_for_updates: function (changelog, update_data) {
					var version_current = update_data.version;
					var changes = this.get_changelog_updates(changelog, version_current);

					if (changes.length > 0) {
						update_data.version = changes[0].title;
						this_private.update_alert.call(this, changes);
					}

					// Save
					xch.site_set_value("script_update", update_data);
				},
				get_changelog_updates: function (changelog, from_version) {
					var changes = [];

					for (var i = 0; i < changelog.length; ++i) {
						var change_direction = this_private.version_compare.call(this, from_version, changelog[i].title);

						if (change_direction >= 0) {
							changes.push(changelog[i]);
						}
					}

					return changes;
				},
				get_individual_changes: function (entry) {
					// Changes list
					var changes = entry.comment.split("\n");
					// Fix back into a single line if necessary
					for (var i = 1; i < changes.length; ++i) {
						if (/^[a-z]/.test(changes[i])) {
							changes[i - 1] = changes[i - 1].trim() + " " + changes[i].trim();
							changes.splice(i, 1);
							--i;
						}
					}
					// Done
					return changes;
				},

				version_check: function () {
					var version_current = xch.script.version.trim();
					var version_old = xch.site_get_value("script_version", null);
					if (version_old === null) {
						// Fresh install
						this_private.fresh_install_alert.call(this, version_current);

						// Change
						xch.site_set_value("script_version", version_current);
						return true;
					}
					else {
						if (version_current != version_old) {
							// Compare
							this_private.version_change_alert.call(this, version_current, version_old);

							// Change
							xch.site_set_value("script_version", version_current);
							return true;
						}
					}
					return false;
				}

			};

			return ScriptUpdater;

		})(),


		// API
		API: (function () {

			var API = function () {
				this.prefix = "xch_api_";
				this.event_listen_function = null;

				this.events = {};

				if ("init" in this_private) {
					this_private.init.call(this);
				}
			};

			var this_private = {

				init: function () {
					// Remove
					delete this_private.init;

					// Getting
					this.gets = {};
					this.on_get = this_private.on_get;
					this.off_get = this_private.off_get;
					this.get_listen_function = null;

					// Acquire listening
					this.on("acquire", this_private.on_acquire, this);

					// API
					this.on_get("posts", this_private.on_get_posts);
				},

				on_get: function (event, callback, callback_data) {
					// callback format: function (event_data, callback_data, event_name) with (this instanceof xch.API)
					if (this.get_listen_function === null) {
						// API watching
						var self = this;
						document.addEventListener(this.prefix + "get", this.get_listen_function = (function (event) {
							this_private.receive_get.call(self, event.detail);
						}), false);
					}

					// Add event listener
					if (!(event in this.gets)) {
						this.gets[event] = {
							triggering: false,
							callbacks: [],
							removals: null
						};
					}

					// Add
					this.gets[event].callbacks.push([callback, callback_data]);
				},
				off_get: function (event, callback) {
					if (event in this.gets) {
						var e = this.gets[event];
						if (e.triggering) {
							// Queue for removal
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							// Remove any callbacks
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
							// Remove if empty
							if (e.length == 0) {
								delete this.gets[event];
							}
						}
					}
				},

				on_acquire: function (event, data, self) {
					return {
						API: xch.API,
						Message: xch.Message,
						Popup: xch.Popup,
						Menu: xch.Menu
					};
				},

				on_get_posts: function () {
					return (content ? content.on_get_posts() : []);
				},

				receive_get: function (data) {
					// Callbacks
					var ret = undefined;
					var get_name = data.value;
					if (get_name in this.gets) {
						// Trigger an event
						var e = this.gets[get_name];
						e.triggering = true;

						for (var i = 0, j = e.callbacks.length; i < j; ++i) {
							// Trigger
							ret = e.callbacks[i][0].call(this, get_name, e.callbacks[i][1]);
						}

						e.triggering = false;

						// Remove anything if necessary
						if (e.removals != null) {
							for (var i = 0; i < e.removals.length; ++i) {
								this.off_get(get_name, e.removals[i]);
							}
							e.removals = null;
						}
					}

					// Return
					data.return_value = ret || data.return_value;
				},

				receive: function (data) {
					var receiver_id = data.receiver_count || 0;

					// Callbacks
					var ret = undefined;
					var event_name = data.event;
					if (event_name in this.events) {

						// Trigger an event
						var ret_callback = (data.return_filter instanceof Function);
						var e = this.events[event_name];
						e.triggering = true;

						for (var i = 0, j = e.callbacks.length; i < j; ++i) {
							// Trigger
							ret = e.callbacks[i][0].call(this, data.data, e.callbacks[i][1], event_name);
							// Return callback
							if (ret_callback) {
								data.return_filter.call(this, ret, receiver_id, i);
							}
						}

						e.triggering = false;

						// Remove anything if necessary
						if (e.removals != null) {
							for (var i = 0; i < e.removals.length; ++i) {
								this.off(event_name, e.removals[i]);
							}
							e.removals = null;
						}

					}

					// Next receiver
					data.receiver_count = receiver_id + 1;

					// Return
					data.return_value = ret || data.return_value;
				}

			};

			API.prototype = {

				constructor: API,

				signal: function (event, data, return_filter) {
					// return_filter format: function (return_value, receiver_id, callback_id) with (this instanceof xch.API)
					var detail = {
						event: event,
						data: data,
						return_filter: return_filter,
						receiver_count: 0,
						return_value: undefined
					};
					document.dispatchEvent(new CustomEvent(this.prefix + "event", {
						detail: detail
					}));
					return detail.return_value;
				},
				on: function (event, callback, callback_data) {
					// callback format: function (event_data, callback_data, event_name) with (this instanceof xch.API)
					if (this.event_listen_function === null) {
						// API watching
						var self = this;
						document.addEventListener(this.prefix + "event", this.event_listen_function = (function (event) {
							this_private.receive.call(self, event.detail);
						}), false);
					}

					// Add event listener
					if (!(event in this.events)) {
						this.events[event] = {
							triggering: false,
							callbacks: [],
							removals: null
						};
					}

					// Add
					this.events[event].callbacks.push([callback, callback_data]);
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							// Queue for removal
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							// Remove any callbacks
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
							// Remove if empty
							if (e.length == 0) {
								delete this.events[event];
							}
						}
					}
				},

				get: function (value) {
					var detail = {
						value: value,
						return_value: undefined
					};
					document.dispatchEvent(new CustomEvent(this.prefix + "get", {
						detail: detail
					}));
					return detail.return_value;
				},

				e: function (tag) {
					var e = document.createElement(tag);
					if (arguments.length <= 1) {
						e.className = style.cls;
					}
					else {
						tag = style.cls;
						for (var i = 1; i < arguments.length; ++i) {
							tag += " ";
							tag += arguments[i];
						}
						e.className = tag;
					}
					return e;
				},
				checkbox: function (checked, size) {
					return style.checkbox(checked, size);
				},

				remove: function () {
					if (this.event_listen_function) {
						// Remove API listener
						document.removeEventListener(this.prefix + "event", this.event_listen_function, false);
						this.event_listen_function = null;
					}
					if (this.get_listen_function) {
						// Remove API listener
						document.removeEventListener(this.prefix + "get", this.get_listen_function, false);
						this.get_listen_function = null;
					}
				}

			};

			return API;

		})(),


		// Location
		Location: (function () {

			var Location = function () {
				this.hash_mark = "#";

				// Init
				this_private.update_state.call(this, true);

				// Events
				this.events = {
					"change": []
				};
				this_private.add_listeners.call(this);
			};

			var this_private = {

				add_listeners: function () {
					var self = this;

					window.addEventListener("popstate", function () {
						this_private.update_state.call(self, false, false);
					}, false);
				},

				update_state: function (init, is_new) {
					// Fragment
					this.fragment = document.location.hash;
					if (this.fragment.length == 0) {
						this.fragment = null;
					}
					else if (this.fragment.substr(0, this.hash_mark.length) == this.hash_mark) {
						this.fragment = this.fragment.substr(this.hash_mark.length);
					}
					else if (this.fragment[0] == "#") {
						this.fragment = this.fragment.substr(1);
					}

					// Update
					if (!init) {
						this_private.trigger.call(this, "change", {
							location: this,
							is_new: is_new
						});
					}
				},
				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					for (var i = 0; i < e.length; ++i) {
						e[i][0].call(this, data, e[i][1], event);
					}
				}

			};

			Location.prototype = {

				constructor: Location,

				go_to: function (href, overwrite_current) {
					if (overwrite_current) {
						history.replaceState({}, "go_to", href);
					}
					else {
						history.pushState({}, "go_to", href);
					}
					this_private.update_state.call(this, false, true);
				},
				go_to_new: function (href) {
					document.location = href;
				},
				form: function (params) {
					var url = "";
					// Path
					if ("path" in params) {
						url += params.path;
					}
					else {
						url += document.location.pathname;
					}
					// Search
					if ("search" in params) {
						if (params.search.length > 0) {
							if (params.search[0] != "?") url += "?";
							url += params.search;
						}
					}
					else {
						url += document.location.search;
					}
					// Fragment
					if ("fragment" in params) {
						if (params.fragment.length > 0) {
							if (params.fragment.substr(0, this.hash_mark.length) != this.hash_mark) url += this.hash_mark;
							url += params.fragment;
						}
					}
					// Done
					return url;
				},

				on: function (event, callback, callback_data) {
					if (event in this.events) {
						this.events[event].push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						for (var i = 0; i < e.length; ++i) {
							if (e[i][0] == callback) {
								e.splice(i, 1);
								--i;
							}
						}
					}
				}

			};

			return Location;

		})(),

		// Communication
		Communication: (function () {

			var Communication = function () {
				// Tab count management
				this.count_tabs = false;
				if (this.count_tabs) {
					this.ct_settings = {
						alive_update_rate: 30,
						alive_timeout: 90
					};

					this.ct_var_tab_count = xch.script.prefix + "_comm_ct_tab_count";
					this.ct_var_tab_time = xch.script.prefix + "_comm_ct_tab_time_";

					this.ct_alive_time_last = 0;
					this.ct_alive_update_interval = null;
					this.ct_init_time = 0;
				}

				this.sync_event_name = api.prefix + "storage_sync";

				this.tab_id = -1;
				this.site = null;
				this.events = {};

				// Opening
				this_private.on_open.call(this);

				this_private.add_listeners.call(this);
			};

			var this_private = {

				add_listeners: function () {
					var self = this;

					// Closing
					window.addEventListener("beforeunload", function () {
						this_private.on_close.call(self);
					}, false);
				},

				on_open: function () {
					if (!this.count_tabs) return;

					var self = this;

					// Set init time
					var now = (new Date()).getTime();
					this.ct_init_time = now;

					// Get tab count
					var tab_count = xch.get_value(this.ct_var_tab_count, 0);
					var available_id = -1;
					if (tab_count > 0) {
						// Find available id
						var max_id = -1, timecode, i;
						for (i = 0; i < tab_count; ++i) {
							// Get the timecode
							timecode = xch.get_value(this.ct_var_tab_time + i, null);
							if (timecode === null) {
								// This id is usable
								if (available_id < 0) available_id = i;
							}
							else {
								if (now - timecode <= this.ct_settings.alive_timeout * 1000) {
									// Still alive
									max_id = i;
								}
								// Else, it should be dead (it has timed out)
							}
						}

						// Remove following data
						++max_id;
						for (i = max_id; i < tab_count; ++i) {
							// Delete old
							this_private.remove_tab_data.call(this, i, false);
						}

						// Update tab count
						tab_count = max_id;

						// Clear all?
						if (tab_count == 0) {
							this_private.clear_all_tab_counting_data.call(this);
						}
					}

					// Get id
					if (available_id < 0) available_id = tab_count;
					this.tab_id = available_id;
					if (this.tab_id == tab_count) ++tab_count;

					// Update values
					var my_time_id = this.ct_var_tab_time + this.tab_id;
					xch.set_value(this.ct_var_tab_count, tab_count);
					xch.set_value(my_time_id, now);
					this.ct_alive_time_last = now;
					now = null;

					// Update interval
					if (this.ct_alive_update_interval !== null) {
						clearInterval(this.ct_alive_update_interval);
					}
					this.ct_alive_update_interval = setInterval(
						function () {
							// Update time
							self.ct_alive_time_last = (new Date()).getTime();
							xch.set_value(my_time_id, self.ct_alive_time_last);
						},
						1000 * this.ct_settings.alive_update_rate
					);
				},
				on_close: function () {
					if (!this.count_tabs) return;

					// Stop alive interval
					if (this.ct_alive_update_interval !== null) {
						clearInterval(this.ct_alive_update_interval);
						this.ct_alive_update_interval = null;
					}

					// Remove data
					this_private.remove_tab_data.call(this, this.tab_id, true);
				},
				remove_tab_data: function (tab_id, is_this) {
					// Delete values
					xch.delete_value(this.ct_var_tab_time + tab_id);
				},
				clear_all_tab_counting_data: function () {
					// Nothing really
				},

				cross_tab_trigger: function (event, data) {
					if (event in this.events) {
						// Trigger an event
						var e = this.events[event];
						e.triggering = true;
						for (var i = 0, j = e.callbacks.length; i < j; ++i) {
							e.callbacks[i][0].call(this, data, e.callbacks[i][1], event);
						}
						e.triggering = false;
						if (e.removals != null) {
							for (var i = 0; i < e.removals.length; ++i) {
								this.cross_tab_off(event, e.removals[i]);
							}
							e.removals = null;
						}
					}
				},

				on_sync_event: function (data) {
					if (data.site == this.site) {
						this_private.cross_tab_trigger.call(this, data.event, data.data);
					}
				}

			};

			Communication.prototype = {

				constructor: Communication,

				ready: function (site) {
					var self = this;

					// Register site
					this.site = site;

					// Syncing
					window.addEventListener("storage", function (event) {
						if (event.key == self.sync_event_name && event.newValue !== null) {
							try {
								var val = JSON.parse(event.newValue);
								this_private.on_sync_event.call(self, val);
							}
							catch (e) {
							}
						}
					}, false);
				},

				cross_tab_trigger: function (event, data) {
					window.localStorage.setItem(this.sync_event_name, JSON.stringify({
						site: this.site,
						event: event,
						data: data
					}));
					window.localStorage.removeItem(this.sync_event_name);
				},
				cross_tab_on: function (event, callback, callback_data) {
					// Register event
					if (!(event in this.events)) this.events[event] = {
						triggering: false,
						callbacks: [],
						removals: null
					};

					// Add
					this.events[event].callbacks.push([callback, callback_data]);
				},
				cross_tab_off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
							// Remove if empty
							if (e.length == 0) {
								delete this.events[event];
							}
						}
					}
				}

			};

			return Communication;

		})(),


		// Header
		Header: (function () {

			var Header = function (html) {
				this.page_count = 0;
				this.page_index = 0;
				this.boards = [];

				this.board = "";
				this.board_title = "";
				this.board_subtitle = "";

				this.board_title_format = "/%board/ - %title";
				this.board_subtitle_format = "%subtitle";

				this.fixed = true;

				this.screen_area = {
					left: 0,
					top: 0,
					width: 0,
					height: 0
				};

				this.op_format = {
					max_length: 80,
					cutoff: "...",
					line_separator: " // "
				};

				this.page_format = {
					main: "page %current/%total",
					list: "page %current"
				};

				this.container = null;

				this.debug_popup = null;
				this.settings_popup = null;

				this.main_menu = null;

				this_private.parse.call(this, html);
			};

			var this_private = {

				parse: function (html) {
					// Board
					this.board = info.board;

					// Board title
					this.board_title = (html.find("body>header>h1:nth-of-type(1)").text() || "").trim().replace(/^\/\w+\/\s*-\s*/, "");

					// Board subtitle
					var p = html.find("body>header>div.subtitle");
					if (p.length > 0) {
						this.board_subtitle = (p.text() || "").trim();
					}

					// Remove
					html.find("body>header").remove();

					// Create board list
					var group = 0;
					var group_add = false;
					var bl = html.find("body>.boardlist:not(.bottom)");
					var bl_a = bl.children("a");
					for (var i = 0, m, href; i < bl_a.length; ++i) {
						href = $(bl_a[i]).attr("href");
						m = /\/\/boards\.38chan\.net\/(\w+)\/index\.html/i.exec(href);
						if (m) {
							if (m[1] == this.board) {
								this.add_board(m[1], group, this.board_title, this.board_subtitle);
							}
							else {
								this.add_board(m[1], group, null, null);
							}
							group_add = true;
						}
						if (group_add && bl_a[i].nextSibling) {
							if (!/\//.test(bl_a[i].nextSibling.nodeValue || "")) {
								++group;
								group_add = false;
							}
						}
					}

					// Remove board list
					bl.remove();
					html.find("body>.boardlist").remove();

					// Remove banner
					html.find("body>img.banner,body>div.banner").remove();

					// Remove title
					var title = html.find("body>.title"), pre;
					if ((pre = title.prev()).prop("tagName") == "H1") {
						pre.remove();
					}
					title.remove();

					// Remove line and script
					var hr = html.find("body>hr").first();
					hr.remove();

					// Pages
					var pages = html.find("body>.pages");
					if (pages.length > 0) {
						this.page_index = parseInt((pages.find(".selected").html() || "").trim()) || 0;
						this.page_count = parseInt((pages.find("a").last().html() || "").trim()) || 0;
						pages.remove();
					}

					// Remove footer stuff
					html.find("body>footer").remove();

					// Remove return link
					html.find("body>a").remove();

					// Stylize
					this_private.stylize.call(this, html);
				},

				stylize: function (html) {
					var self = this;

					var body = html.find("body");

					// Create the header
					var board_list, options, post_option, thread_option, menu_option;
					body.prepend( //{
						(this.container = style.e("div", "header" + (this.fixed ? " fixed" : "")))
						.append(
							style.e("div", "header_background")
						)
						.append(
							style.e("div", "header_content")
							.append(
								(board_list = style.e("div", "header_boards"))
							)
							.append(
								style.e("div", "header_custom")
								.append(
									(options = style.e("div", "header_options"))
									.append(
										(post_option = style.e("a", "header_option header_option_reply"))
										.text("post")
									)
									.append(
										(thread_option = style.e("a", "header_option header_option_thread"))
										.text("thread")
									)
									.append(
										(menu_option = style.e("a", "header_option header_option_menu"))
										.attr("target", "_blank")
										.attr("href", xch.script.homepage)
										.text(xch.script.name)
									)
								)
							)
						)
					) //}
					.prepend(
						style.e("div", "content_padding top")
					)
					.append(
						style.e("div", "content_padding bottom")
					);

					// Add boards
					var g_id = -1;
					var board_group, b, bn;
					for (var i = 0; i < this.boards.length; ++i) {
						if (g_id != this.boards[i].group) {
							board_group = board_list.children('.header_board_group[group_id="' + this.boards[i].group + '"]');
							if (board_group.length != 1) {
								board_list.append(
									(board_group = style.e("span", "header_board_group"))
									.attr("group_id", this.boards[i].group)
								);
							}
							g_id = this.boards[i].group;
						}

						// Add
						board_group.append(
							(b = style.e("span", "header_board"))
							.html(
								style.e("a", "header_board_link")
								.attr("href", "/" + this.boards[i].board + "/index.html")
								.append(
									style.e("span", "header_board_text_short")
									.html(this.boards[i].board)
								)
								.append(
									(bn = style.e("span", "header_board_text_name"))
								)
							)
						);
						if (this.boards[i].name) {
							bn.text(this.boards[i].name);
							b.addClass("named");
						}
						if (this.boards[i].subtitle) {
							bn.attr("title", this.boards[i].subtitle);
						}
						if (this.board == this.boards[i].board) {
							b.addClass("current");
						}
					}

					// Page selector
					if (this.page_count > 0) {
						var p_sel;
						options.prepend(
							(p_sel = style.e("a", "header_option header_option_page"))
							.text(this.format_page(this.page_format.main, this.page_index, this.page_count))
						);
						var p_sel_data = { self: this, menu: null };
						p_sel.on("mouseenter click", p_sel_data, this_private.on_page_selector_create_click);
					}

					// Events
					var data = { self: this };
					post_option.on("click", data, this_private.on_post_option_click);
					thread_option.on("click", data, this_private.on_thread_option_click);
					menu_option.on("click", data, this_private.on_menu_option_click);
					$(window).on("resize", data, this_private.on_window_resize);

					// Board info
					this.container.after(
						style.e("div", "board_info")
						.append( //{ Banner
							style.e("div", "board_banner_container")
							.append(
								style.e("img", "board_banner")
								.on("load", this_private.on_banner_load)
								.on("error", this_private.on_banner_error)
								.attr("src", "/banners/banner.php")
							)
						) //}
						.append(
							style.e("div", "board_info_title")
							.text(this.format_board_info(this.board_title_format))
						)
						.append(
							style.e("div", "board_info_subtitle")
							.text(this.format_board_info(this.board_subtitle_format))
						)
					);

					// Update
					this_private.update_screen_area.call(this);
				},

				on_page_selector_create_click: function (event) {
					// Create page selector
					this_private.create_page_selector.call(event.data.self, $(this), event.data);
				},
				on_post_option_click: function (event) {
					if (event.which != 1) return true;

					var qr = content.qr;
					if (!qr.is_open()) {
						qr.open();
						if (qr.settings.window.clear_post_on_reopen) {
							qr.clear();
						}
					}
					qr.focus_comment();

					return false;
				},
				on_thread_option_click: function (event) {
					if (event.which != 1) return true;

					return false;
				},
				on_menu_option_click: function (event) {
					if (event.which != 1) return true;

					this_private.create_main_menu.call(event.data.self, $(this));

					return false;
				},

				on_banner_load: function () {
					$(this).parent().addClass("loaded");
				},
				on_banner_error: function () {
					$(this).parent().addClass("error");
				},

				on_window_resize: function (event) {
					this_private.update_screen_area.call(event.data.self);
				},
				on_main_menu_close: function (event, self) {
					api.signal("main_menu_close", {
						menu: self.main_menu
					});
					self.main_menu = null;
				},
				on_main_menu_settings_click: function (event) {
					if (event.which != 1) return true;

					event.data.option.menu.close();

					this_private.open_settings.call(event.data.callback_data);

					return false;
				},
				on_main_menu_debug_info_click: function (event) {
					if (event.which != 1) return true;

					event.data.option.menu.close();

					this_private.popup_debug_info.call(event.data.callback_data);

					return false;
				},
				on_main_menu_homepage_click: function (event) {
					if (event.which != 1) return true;

					event.data.option.menu.close();
					//location.go_to_new(event.data.option.container.attr("href"));

					return true;//false;
				},

				create_page_selector: function (object, event_data) {
					if (event_data.menu == null) {
						var self = this;

						// Create page list
						var options = [];
						for (var i = 0; i < this.page_count; ++i) {
							options.push({
								html: (
									style.e("a", "page_selection")
									.attr("href", info.create_url.to_board(info.board, i + 1))
									.text(this.format_page(this.page_format.list, i + 1, this.page_count))
								),
								on: {
									click: function (event) {
										if (event.which != 1) return true;

										event.data.option.menu.close();
										location.go_to_new(event.data.option.container.attr("href"));
										return false;
									}
								}
							});
						}

						// Create menu
						event_data.menu = new xch.Menu(object, {
							close_on_mouseleave: true,
							fit_width_min: true,
							keep_on_screen: true,
							max_idle_time: 5.0,
							fixed_z: null,
							open: "down",
							on: {
								close: function (event2) {
									event_data.menu = null;
								}
							},
							options: options
						});
					}
				},
				create_main_menu: function (object) {
					if (this.main_menu != null) {
						this.main_menu.close();
					}
					var self = this;

					this.main_menu = new xch.Menu(object, {
						anchor: {
							x: {
								container: this.container,
								container_side: "right",
								menu_side: "right"
							}
						},
						menu_class: "expandable_point_left",
						menu_class_inherit: null,
						close_on_mouseleave: false,
						fit_width_min: true,
						keep_on_screen: true,
						fixed_z: null,
						open: "down",
						on: {
							close: {
								callback_data: this,
								callback: this_private.on_main_menu_close
							}
						},
						options: [{
							text: "Settings",
							on: {
								click: {
									callback_data: this,
									callback: this_private.on_main_menu_settings_click
								}
							}
						}, {
							text: "Debug Info",
							on: {
								click: {
									callback_data: this,
									callback: this_private.on_main_menu_debug_info_click
								}
							}
						}, {
							html: (
								style.e("a")
								.attr("target", "_blank")
								.attr("href", xch.script.homepage)
								.text("Homepage")
							),
							on: {
								click: {
									callback_data: this,
									callback: this_private.on_main_menu_homepage_click
								}
							}
						}]
					});

					api.signal("main_menu_open", {
						menu: this.main_menu
					});
				},

				popup_debug_info: function () {
					if (this.debug_popup != null && this.debug_popup.open) return;

					this.debug_popup = new xch.Popup({
						title: "Debug Information",
						description: "Any personal information (such as passwords, posted content, etc.) and unimportant information (such as the details of current threads/posts) has been omitted.",
						textarea: {
							height: 200,
							value: xch.get_debug_info(),
							readonly: true
						},
						buttons: [{
							text: "Close",
							on: {
								click: {
									callback_data: null,
									callback: function (event) {
										if (event.which != 1) return true;

										event.data.popup.close();
									}
								}
							}
						}],
						no_close: true,
						size: {
							width: 600
						}
					});
				},
				open_settings: function () {
					if (this.settings_popup != null && this.settings_popup.open) return;

					this.settings_popup = new xch.Popup({
						title: "Settings",
						description: "Settings are not available yet, please wait warmly.",
						size: {
							width: 180
						},
						on: {
							close: {
								callback: function (event, self) {
									self.settings_popup = null;
								},
								callback_data: this
							}
						}
					});
				},

				update_screen_area: function () {
					var h = this.container.outerHeight();
					if (!this.fixed) {
						h = Math.max(0, h - win.scrollTop());
					}

					var win = $(window);

					this.screen_area.left = 0;
					this.screen_area.top = h;
					this.screen_area.width = win.width();
					this.screen_area.height = win.height() - h;
				}

			};

			Header.prototype = {

				constructor: Header,

				add_board: function (board, group, name, subtitle) {
					this.boards.push({
						board: board,
						group: group,
						name: name,
						subtitle: subtitle
					});
				},

				get_height: function () {
					return (this.container.outerHeight());
				},
				is_fixed: function () {
					return (this.container.hasClass("fixed"));
				},
				get_screen_area: function () {
					return {
						left: this.screen_area.left,
						top: this.screen_area.top,
						width: this.screen_area.width,
						height: this.screen_area.height
					};
				},

				format_board_info: function (str) {
					var self = this;

					return xch.format_string(str, function (fmt) {
						if (fmt == "board") {
							fmt = self.board;
						}
						else if (fmt == "title") {
							fmt = self.board_title;
						}
						else if (fmt == "subtitle") {
							fmt = self.board_subtitle;
						}
						else if (fmt == "op") {
							fmt = self.format_op();
						}

						return fmt;
					});
				},
				format_op: function () {
					var op = "";

					// Find main thread
					var thread = null;
					for (var i = 0; i < content.threads.length; ++i) {
						if (content.threads[i].visible) {
							thread = content.threads[i];
							break;
						}
					}

					// Exists
					if (thread != null) {
						var thread_op = thread.posts[0];

						var val = thread_op.get_subject_plaintext();
						if (!val) {
							val = thread_op.get_comment_plaintext();
						}

						if (val) {
							val = val.trim();
							if (val.length > this.op_format.max_length + this.op_format.cutoff.length) {
								val = val.substr(0, this.op_format.max_length);
								val += this.op_format.cutoff;
							}
							op = val.replace(/(\r?\n|\r)+/g, this.op_format.line_separator);
						}
					}

					// Default
					if (op.length == 0) {
						op = this.board_title;
					}

					return op;
				},

				format_page: function (format, current, total) {
					return xch.format_string(format, function (fmt) {
						if (fmt == "current") fmt = current;
						else if (fmt == "total") fmt = total;
						return fmt;
					});
				}

			};

			return Header;

		})(),

		// Quick reply
		QuickReply: (function () {

			var QuickReply = function (html) {
				this.persistent = false;
				this.spoiler_available = false;
				this.target_thread = null;
				this.target_thread_is_current = false;

				this.target_selector = null;

				// Position and sizing settings
				this.container = null;
				this.fields = null;

				this.position = {
					x: 64,
					y: 64,
					anchor: {
						x: 1,
						y: 0
					}
				};

				this.size = {
					width: 300,
					height: 120
				};
				this.size_min = {
					width: 64,
					height: 20
				};
				this.moving = {
					active: false,
					offset: {
						x: 0,
						y: 0
					}
				};
				this.resizing = {
					active: false,
					x: 0,
					y: 0,
					base_pos: {
						x: 0,
						y: 0
					},
					base_size: {
						width: 0,
						height: 0
					},
					base_mouse: {
						x: 0,
						y: 0
					}
				};
				this.resizer_display_timer = null;

				// Post data settings
				this.post_data_names = {
					thread: "thread",
					board: "board",
					name: "name",
					email: "email",
					subject: "subject",
					comment: "body",
					file: "file",
					spoiler: "spoiler",
					password: "password"
				};
				this.post_data = [];
				this.post_data_id_current = 0;
				this.limits = {
					name: 50,
					email: 40,
					subject: 100,
					password: 18
				};
				this.post_context = {
					acquiring: false,
					percent: 0,
					thread: null,
					data_fields_extra: []
				};
				this.saved_post_settings = {
					password: window.localStorage.getItem("password", ""),
					name: window.localStorage.getItem("name", ""),
					email: window.localStorage.getItem("email", "")
				};
				if (this.saved_post_settings.password.length == 0) {
					this.saved_post_settings.password = this.create_password(8);
					window.localStorage.setItem("password", this.saved_post_settings.password);
				}

				// Submitting settings
				this.submitting = {
					active: false,
					ajax: null,
					data: null,
					abortable: false,
					parsing: false,
					cleared_fields: false,
					queued: false,
					status: {
						progress: 0,
						step: null
					}
				};

				// Cooldown
				this.cooldown = {
					timer: null,
					time: 0,
					time_total: 1,
					retry_number: 0,
					complete: true,
					bar: null,
					bar_inner: null
				};

				// Settings
				this.settings = {
					window: {
						auto_open: {
							in_thread: false,
							on_index: false
						},
						resize_display_time: 0.25,
						clear_post_on_reopen: true,
						anchor_border_size: 10
					},
					posting: {
						highlight_after_post: true,
						max_retries: 5,
						require_parse_complete_before_post_clear: true,
						require_parse_complete_before_posting_again: true,
						show_parse_status: true
					},
					cooldown: {
						parse_error: {
							timeout: 30,
							stop: false
						},
						http_error: {
							timeout: 10,
							stop: false
						},
						context_error: {
							timeout: 5,
							stop: false
						},
						connection_error: {
							timeout: 5,
							stop: false
						},
						posting_error: {
							timeout: 30,
							stop: false
						},
						post_retrieval_error: {
							timeout: 30,
							stop: true
						},
						success: {
							timeout: 30,
							stop: true
						}
					}
				};

				// Submission requirements
				this.requirements = {
					new_thread: {
						image: false,
						image_or_comment: true
					},
					reply: {
						image: false,
						image_or_comment: true
					}
				};
				this.valid_file_mimes = [
					"image/jpeg",
					"image/gif",
					"image/png",
					"image/bmp"
				];
				this.max_file_size = 10 * 1024 * 1024;
				this.post_submit_value = {
					new_thread: "New Topic",
					reply: "New Reply"
				};

				// Unsaveable settings
				this.unsaveable = {
					names: [],
					emails: ["sage","noko"]
				};

				// Messages
				this.info_message = null;
				this.error_message = null;

				// Load settings
				this_private.load_all.call(this);

				// Start
				this_private.init.call(this, html);
				this.set_target(this.target_thread);

				// Window events
				var data = { self: this, resize_timer: null };
				$(window)
				.on("mouseup", data, this_private.on_window_mouseup)
				.on("mousemove", data, this_private.on_window_mousemove)
				.on("resize", data, this_private.on_window_resize);

				content.on("thread_update", this_private.on_thread_updated, this);
				content.on("thread_load", this_private.on_thread_deleted, this);

				communication.cross_tab_on("qr_save", this_private.on_cross_tab_save, this);
				communication.cross_tab_on("qr_context_expire", this_private.on_cross_tab_context_change, this);
			};

			var this_private = {

				load_all: function () {
					// Load all settings
					this_private.load_position.call(this, false);
					this_private.load_size.call(this, false);
					this_private.load_persistency.call(this, false);
				},
				load_position: function (apply) {
					var pos = xch.site_get_value("qr_position", this.position);
					if (pos !== this.position) {
						xch.merge_settings(pos, this.position, false);

						if (apply) {
							this.set_position(this.position.x, this.position.y, true, true);
						}
					}
				},
				load_size: function (apply) {
					var size = xch.site_get_value("qr_size", this.size);
					if (size !== this.size) {
						xch.merge_settings(size, this.size, false);

						if (apply) {
							this.set_size(this.size.width, this.size.height, true);
						}
					}
				},
				load_persistency: function (apply) {
					this.persistent = xch.site_get_value("qr_persistent", this.persistent);

					if (apply) {
						this.set_persistency(this.persistent, true);
					}
				},
				save_position: function () {
					xch.site_set_value("qr_position", this.position);

					communication.cross_tab_trigger("qr_save", {
						value: "position"
					});
				},
				save_size: function () {
					xch.site_set_value("qr_size", this.size);

					communication.cross_tab_trigger("qr_save", {
						value: "size"
					});
				},
				save_persistency: function () {
					xch.site_set_value("qr_persistent", this.persistent);

					communication.cross_tab_trigger("qr_save", {
						value: "persistent"
					});
				},

				on_cross_tab_save: function (event, self) {
					if (event.value == "position") {
						this_private.load_position.call(self, true);
					}
					else if (event.value == "size") {
						this_private.load_size.call(self, true);
					}
					else if (event.value == "persistent") {
						this_private.load_persistency.call(self, true);
					}
					else if (event.value == "post_name") {
						this_private.load_post_name.call(self);
					}
					else if (event.value == "post_email") {
						this_private.load_post_email.call(self);
					}
				},
				on_cross_tab_context_change: function (event, self) {
					// Check if context needs an update
					var target = (self.target_thread_is_current ? self.target_thread : self.post_context.thread);
					var needs_update = false;
					if (target) {
						if (
							event.thread_id === target.id &&
							event.board == target.board
						) {
							needs_update = true;
						}
					}
					else if (event.thread_id === null) {
						needs_update = true;
					}

					// Update
					if (needs_update && !self.post_context.acquiring) {
						this_private.acquire_post_context.call(self, self.target_thread)
					}
				},

				on_window_mouseup: function (event) {
					if (event.data.self.moving.active) {
						event.data.self.moving.active = false;

						// Save position
						this_private.save_position.call(event.data.self);
					}
					if (event.data.self.resizing.active) {
						event.data.self.resizing.active = false;
						// Update position
						event.data.self.set_position(event.data.self.position.x, event.data.self.position.y, true, true);

						// Save position and size
						this_private.save_position.call(event.data.self);
						this_private.save_size.call(event.data.self);
					}
				},
				on_window_mousemove: function (event) {
					if (event.data.self.resizing.active) {
						this_private.resize.call(event.data.self, { x:event.pageX, y:event.pageY });
					}
					if (event.data.self.moving.active) {
						var x = event.pageX - event.data.self.moving.offset.x - $(this).scrollLeft();
						var y = event.pageY - event.data.self.moving.offset.y - $(this).scrollTop();

						event.data.self.set_position(x, y, false, true);
					}
				},
				on_window_resize: function (event) {
					// Update position
					var ev_data = event.data;
					if (ev_data.self.container != null) {
						ev_data.self.set_position(ev_data.self.position.x, ev_data.self.position.y, true, true);

						// Short delay, so this isn't over-triggered
						if (ev_data.resize_timer !== null) {
							clearTimeout(ev_data.resize_timer);
						}
						ev_data.resize_timer = setTimeout(function () {
							// Save position
							ev_data.resize_timer = null;
							this_private.save_position.call(ev_data.self);
						}, 100);
					}
				},

				on_thread_updated: function (event, self) {
					if (event.thread != self.target_thread) return;

					if (event.state_old.locked != self.target_thread.locked && self.target_thread.locked) {
						// Stop
						if (self.submitting.active) {
							this_private.submit_abort.call(self);
						}
						else if (self.submitting.queued) {
							this_private.submit_dequeue.call(self);
						}
					}
				},
				on_thread_deleted: function (event, self) {
					if (event.thread != self.target_thread) return;

					// Stop
					if (self.submitting.active) {
						this_private.submit_abort.call(self);
					}
					else if (self.submitting.queued) {
						this_private.submit_dequeue.call(self);
					}
				},

				init: function (html) {
					this_private.acquire_post_context_from_html.call(this, html, undefined, false);

					var post_form = html.find('form[name="post"]');
					if (post_form.length > 0) {
						// Spoiler
						this.spoiler_available = (post_form.find('input[name="spoiler"]').length > 0);

						// Remove
						post_form.remove();
					}

					// Open/create
					if (info.index ? this.settings.window.auto_open.on_index : this.settings.window.auto_open.in_thread) {
						this.open(null);
					}
				},

				cancel_event: function (event) {
					return (event.which != 1);
				},
				on_simple_change: function (event) {
					event.data.self.post_data[event.data.self.post_data_id_current][event.data.field].value = $(this).val();

					if ("save" in event.data) {
						event.data.save.compare.call(event.data.self);
					}
				},
				on_simple_blur: function (event) {
					var sel = xch.get_selection($(this));
					event.data.self.post_data[event.data.self.post_data_id_current][event.data.field].selection.start = sel.start;
					event.data.self.post_data[event.data.self.post_data_id_current][event.data.field].selection.end = sel.end;
				},
				on_simple_remove: function (event) {
					if (event.which != 1) return true;

					if ("save" in event.data) {
						var new_val = "";

						event.data.save.target.val(new_val);
						event.data.self.post_data[event.data.self.post_data_id_current][event.data.field].value = new_val;

						event.data.save.save.call(event.data.self, new_val);
					}
				},

				on_resizer_mousedown: function (event) {
					if (event.which != 1) return true;

					// Resize start
					var ic_pos = event.data.inner_container.offset();
					var me = $(this);
					event.data.self.resizing.active = true;

					if (me.hasClass("left")) {
						event.data.self.resizing.x = -1;
					}
					else if (me.hasClass("right")) {
						event.data.self.resizing.x = 1;
					}
					else {
						event.data.self.resizing.x = 0;
					}

					if (me.hasClass("top")) {
						event.data.self.resizing.y = -1;
					}
					else if (me.hasClass("bottom")) {
						event.data.self.resizing.y = 1;
					}
					else {
						event.data.self.resizing.y = 0;
					}

					event.data.self.resizing.base_pos.x = event.data.self.position.x;
					event.data.self.resizing.base_pos.y = event.data.self.position.y;

					event.data.self.resizing.base_size.width = event.data.self.size.width;
					event.data.self.resizing.base_size.height = event.data.self.size.height;

					event.data.self.resizing.base_mouse.x = event.pageX - $(window).scrollLeft();
					event.data.self.resizing.base_mouse.y = event.pageY - $(window).scrollTop();

					return false;
				},
				resizer_timeout_set: function (event_data) {
					this.resizer_display_timer = setTimeout(function () {
						event_data.resizers.removeClass("hidden");
					}, this.settings.window.resize_display_time * 1000);
				},
				on_container_mouseenter: function (event) {
					if (!event.data.self.resizing.active) {
						if (event.data.self.resizer_display_timer !== null) {
							clearTimeout(event.data.self.resizer_display_timer);
						}
						this_private.resizer_timeout_set.call(event.data.self, event.data);
					}
				},
				on_container_mouseleave: function (event) {
					if (!event.data.self.resizing.active) {
						if (event.data.self.resizer_display_timer !== null) {
							clearTimeout(event.data.self.resizer_display_timer);
							event.data.self.resizer_display_timer = null;
						}
						event.data.resizers.addClass("hidden");
					}
				},

				on_main_label_click: function (event) {
					if (event.which != 1) return true;
					// Change persistency
					event.data.self.set_persistency(!event.data.self.container.hasClass("persistent"), false);
				},
				on_main_label_target_click: function (event) {
					if (event.which != 1) return true;

					// Change thread
					if (event.data.self.target_selector_is_open()) {
						event.data.self.close_target_selector();
					}
					else {
						event.data.self.open_target_selector();
					}
					return false;
				},
				on_close_click: function (event) {
					if (event.which != 1) return true;

					// Close
					event.data.self.close();
				},
				on_grabber_mousedown: function (event) {
					if (event.which != 1) return true;

					event.data.self.moving.active = true;

					var o = event.data.self.container.offset();
					event.data.self.moving.offset.x = event.pageX - o.left;
					event.data.self.moving.offset.y = event.pageY - o.top;

					return false;
				},

				on_submit_click: function (event) {
					if (event.which != 1) return true;

					// Submit
					this_private.submit_try.call(event.data.self, event.shiftKey);
				},

				on_file_name_click: function (event) {
					if (event.which != 1) return true;

					if (!event.data.filesel.attr("readonly")) {
						if (event.data.self.post_data[event.data.self.post_data_id_current].file.file != null && (event.shiftKey || event.data.name_editing)) {
							var obj = $(this);
							obj.removeAttr("readonly");
							event.data.name_editing = true;
						}
						else {
							event.data.filesel.click();
						}
					}
				},
				on_file_name_blur: function (event) {
					if (event.data.name_editing) {
						// Updat ename
						var obj = $(this);
						obj.attr("readonly", "readonly");
						event.data.self.name_editing = false;

						var name = event.data.self.set_file_name(obj.val());
						if (name !== null) obj.val(name);
					}
				},
				on_file_remove_click: function (event) {
					if (event.which != 1) return true;

					if (!event.data.filesel.attr("readonly")) {
						event.data.self.set_file(null);
					}
				},
				on_file_change: function (event) {
					// Load file
					var files = event.target.files;
					if (files) {
						for (var i = 0; i < files.length; ++i) {
							if (event.data.self.set_file(files[i])) break;
						}
					}
					// Nullify
					this.value = null;
				},
				on_file_spoiler_change: function (event) {
					var obj = $(this);
					var ch = obj.is(":checked");
					if (obj.attr("readonly")) {
						ch = !ch;
						obj.prop("checked", ch);
					}
					event.data.self.post_data[event.data.self.post_data_id_current].spoiler.value = ch;
				},

				create: function () {
					// Objects
					var grabber, cont, main_label, main_label_text, close, i_name, i_email, i_subject, i_comment, i_file_name, i_file, i_file_spoiler, i_file_spoiler_input, i_file_remove, submit, resizers;
					var i_name_remove, i_email_remove;

					// Create QR
					(this.container = style.e("div", "popup quick_reply" + (this.persistent ? " persistent" : "")))
					.append(
						style.e("div", "popup_background")
						.append(
							(resizers = style.e("div", "popup_resizers hidden"))
						)
					)
					.append(
						(cont = style.e("div", "popup_content packed"))
						.css("width", this.size.width + "px")
						.append( //{ Label
							(grabber = style.e("div", "qr_row grab"))
							.append(
								style.e("div", "qr_cell no_bg")
								.attr("target_width", "100%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(main_label = style.e("div", "qr_main_label"))
										.append(
											(main_label_text = style.e("span", "qr_main_label_prefix"))
										)
										.append(
											style.e("span", "qr_main_label_target")
											.append(
												(this.main_label_target_link = style.e("a", "qr_main_label_target_text"))
												.attr("target", "_blank")
											)
										)
									)
								)
							)
							.append(
								style.e("div", "qr_cell no_bg")
								.attr("target_width", "auto")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(close = style.e("span", "qr_close"))
									)
								)
							)
						) //}
						.append( //{ Top
							style.e("div", "qr_row top")
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "33%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(i_name = style.e("input", "popup_input qr_input qr_name"))
										.attr("type", "text")
										.attr("placeholder", "Name")
										.attr("autocomplete", "off")
										.attr("maxlength", this.limits.name)
									)
									.append(
										style.e("div", "qr_saved_settings hidden")
										.append(style.e("div", "qr_saved_settings_v_aligner"))
										.append(
											style.e("span", "qr_saved_settings_inner")
											.append(
												(i_name_remove = style.e("a", "qr_saved_settings_unsave"))
												.attr("title", "Unsave name")
											)
										)
									)
								)
							)
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "34%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(i_email = style.e("input", "popup_input qr_input qr_email"))
										.attr("type", "text")
										.attr("placeholder", "Email")
										.attr("autocomplete", "off")
										.attr("maxlength", this.limits.email)
									)
									.append(
										style.e("div", "qr_saved_settings hidden")
										.append(style.e("div", "qr_saved_settings_v_aligner"))
										.append(
											style.e("span", "qr_saved_settings_inner")
											.append(
												(i_email_remove = style.e("a", "qr_saved_settings_unsave"))
												.attr("title", "Unsave email")
											)
										)
									)
								)
							)
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "33%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(i_subject = style.e("input", "popup_input qr_input qr_subject"))
										.attr("type", "text")
										.attr("placeholder", "Subject")
										.attr("autocomplete", "off")
										.attr("maxlength", this.limits.subject)
									)
								)
							)
						) //}
						.append( //{ Comment
							style.e("div", "qr_row")
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "100%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(i_comment = style.e("textarea", "popup_input qr_input qr_comment"))
										.attr("placeholder", "Comment")
										.attr("autocomplete", "off")
										.css("height", this.size.height + "px")
									)
								)
							)
						) //}
						.append( //{ Bottom
							style.e("div", "qr_row bottom")
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "100%")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(i_file_name = style.e("input", "popup_input qr_input qr_file_name"))
										.attr("type", "text")
										.attr("placeholder", "File")
										.attr("readonly", "readonly")
										.attr("autocomplete", "off")
									)
									.append(
										style.e("div", "qr_file_settings hidden")
										.append(style.e("div", "qr_file_settings_v_aligner"))
										.append(
											style.e("span", "qr_file_settings_inner")
											.append(
												(i_file_spoiler = style.checkbox(false, "small"))
												.addClass("qr_file_spoiler qr_file_settings_item")
												.attr("title", "Spoiler image")
											)
											.append(
												(i_file_remove = style.e("a", "qr_file_remove qr_file_settings_item"))
												.attr("title", "Remove file")
											)
											.append(
												(i_file = style.e("input", "qr_file qr_file_settings_item"))
												.attr("type", "file")
												.attr("multiple", "multiple")
											)
										)
									)
								)
							)
							.append(
								style.e("div", "qr_cell")
								.attr("target_width", "64px")
								.append(
									style.e("div", "qr_cell_inner")
									.append(
										(submit = style.e("button", "popup_button qr_button qr_submit"))
										.append(
											style.e("span", "qr_submit_text")
										)
									)
								)
							)
						) //}
						.append( //{ Status
							style.e("div", "qr_status hidden")
							.append(
								style.e("div", "qr_status_inner")
								.append(
									style.e("div", "qr_status_text")
									.append(
										style.e("span", "qr_status_message")
									)
									.append(
										style.e("span", "qr_status_attempt hidden")
									)
								)
								.append(
									style.e("div", "qr_progress default")
									.append(
										style.e("div", "qr_progress_inner")
									)
								)
							)
						) //}
					);

					// Properly style cells
					var qr_cells = this.container.find(".qr_cell_inner");
					for (var i = 0; i < qr_cells.length; ++i) {
						$(qr_cells[i].firstChild)
						.after(style.e("div", "qr_cell_inner_t"))
						.after(style.e("div", "qr_cell_inner_l"))
						.after(style.e("div", "qr_cell_inner_b"));
					}

					// Cooldown container
					this.container.find(".qr_submit").next()
						.addClass("qr_cooldown_container")
						.append(
							(this.cooldown.bar = style.e("div", "qr_cooldown ready"))
							.append(
								(this.cooldown.bar_inner = style.e("div", "qr_cooldown_inner"))
							)
						);

					// Spoiler
					if (!this.spoiler_available) {
						i_file_spoiler.addClass("hidden");
					}

					// Resizers
					for (var i = 0, r; i < 8; ++i) {
						// Create resizer
						resizers.append(
							(r = style.e("div", "popup_resizer"))
						)
						if (i < 3) r.addClass("top");
						else if (i >= 4 && i < 7) r.addClass("bottom");
						if (i == 0 || i >= 6) r.addClass("left");
						else if (i >= 2 && i < 5) r.addClass("right");
					}

					// Events
					var data = { self: this };
					var r_data = { self: this, resizers: resizers };
					var i_data;

					resizers.children(".popup_resizer")
					.on("mousedown", { self: this, inner_container: cont }, this_private.on_resizer_mousedown);

					this.container
					.on("mouseenter", r_data, this_private.on_container_mouseenter)
					.on("mouseleave", r_data, this_private.on_container_mouseleave);

					main_label.on("mousedown", this_private.cancel_event);

					main_label_text.on("mousedown", this_private.cancel_event)
					.on("click", data, this_private.on_main_label_click);

					this.main_label_target_link.on("mousedown", this_private.cancel_event)
					.on("click", data, this_private.on_main_label_target_click);

					close.on("mousedown", this_private.cancel_event)
					.on("click", data, this_private.on_close_click);

					grabber.on("mousedown", data, this_private.on_grabber_mousedown);

					submit.on("click", data, this_private.on_submit_click);

					// Input events
					i_name.on("change", i_data = { self: this, field: "name", save: { compare:this_private.compare_post_name, save:this_private.save_post_name, target:i_name } }, this_private.on_simple_change);
					i_name.on("blur", i_data, this_private.on_simple_blur);
					i_name_remove.on("click", i_data, this_private.on_simple_remove);
					i_email.on("change", i_data = { self: this, field: "email", save: { compare:this_private.compare_post_email, save:this_private.save_post_email, target:i_email } }, this_private.on_simple_change);
					i_email.on("blur", i_data, this_private.on_simple_blur);
					i_email_remove.on("click", i_data, this_private.on_simple_remove);
					i_subject.on("change", i_data = { self: this, field: "subject" }, this_private.on_simple_change);
					i_subject.on("blur", i_data, this_private.on_simple_blur);
					i_comment.on("change", i_data = { self: this, field: "comment" }, this_private.on_simple_change);
					i_comment.on("blur", i_data, this_private.on_simple_blur);
					i_file_name.on("click", i_data = { self: this, filesel: i_file, name_editing: false }, this_private.on_file_name_click)
					.on("blur", i_data, this_private.on_file_name_blur);
					i_file_remove.on("click", i_data, this_private.on_file_remove_click);
					i_file.on("change", data, this_private.on_file_change);
					(i_file_spoiler_input = i_file_spoiler.find("input")).on("change", data, this_private.on_file_spoiler_change);

					// List of all fields
					this.fields = i_name.add(i_email).add(i_subject).add(i_comment).add(i_file).add(i_file_spoiler_input);

					// Append
					content.floating_container.append(this.container);

					// Size
					this_private.update_size.call(this);
				},

				resize: function (mouse) {
					// Normalize
					var win = $(window);
					mouse.x -= win.scrollLeft();
					mouse.y -= win.scrollTop();
					var pos = this.container.offset();
					var conts = [ this.container.children(".popup_content") , this.container.find(".qr_comment") ];
					var diff, pos_update = false;
					var xy = ["x","y"];
					var wh = ["width","height"];

					// Resize
					for (var i = 0; i < 2; ++i) {
						if (this.resizing[xy[i]] != 0 && this.resizing[xy[i]] != this.position.anchor[xy[i]]) {
							// Difference
							diff = (mouse[xy[i]] - this.resizing.base_mouse[xy[i]]) * this.resizing[xy[i]];
							// Bound
							if (this.resizing.base_size[wh[i]] + diff < this.size_min[wh[i]]) {
								diff = this.size_min[wh[i]] - this.resizing.base_size[wh[i]];
							}

							// Set values
							this.size[wh[i]] = this.resizing.base_size[wh[i]] + diff;
							if (this.resizing[xy[i]] == -1) {
								this.position[xy[i]] = this.resizing.base_pos[xy[i]] - diff;
								pos_update = true;
							}

							// Apply
							conts[i].css(wh[i], this.size[wh[i]] + "px");
						}
					}

					// Update
					if (pos_update) {
						this.set_position(this.position.x, this.position.y, true, true);
					}
					this_private.update_size.call(this);
				},

				update_size: function () {
					// Sizing
					var full_size = this.container.children(".popup_content").innerWidth();
					if (full_size < 1) full_size = 1;
					var rows = this.container.find(".qr_row");
					for (var r = 0, i; r < rows.length; ++r) {
						// Init
						var total_percent = 0;
						var total_pixels = 0;
						var pixels = [];
						var percent = [];

						// Group
						var input_containers = $(rows[r]).children();
						for (i = 0; i < input_containers.length; ++i) {
							var ic = $(input_containers[i]);
							var tw = ic.attr("target_width");
							var m, val;
							if ((m = /([0-9]+)px/.exec(tw))) {
								val = parseInt(m[1]);
								pixels.push([ic, val]);
								total_pixels += val;
							}
							else if ((m = /([0-9]+)%/.exec(tw))) {
								val = parseInt(m[1]) / 100;
								percent.push([ic, val]);
								total_percent += val;
							}
							else if (tw == "auto") {
								input_containers[i].style.width = "";
								val = ic.outerWidth();
								pixels.push([ic, val]);
								total_pixels += val;
							}
						}

						// Size pixels
						var scale = 1;
						if (total_percent == 0 || total_pixels > full_size) {
							scale = full_size / total_pixels;
							total_pixels = full_size;
						}
						for (i = 0; i < pixels.length; ++i) {
							pixels[i][0].css("width", (pixels[i][1] * scale) + "px");
						}

						// Size percents
						scale = (total_percent == 0 ? 0 : 1.0 / total_percent) * (full_size - total_pixels);
						for (i = 0; i < percent.length; ++i) {
							percent[i][0].css("width", (percent[i][1] * scale) + "px");
						}

						// Height
						var max_height = 0;
						input_containers.css("height", "");
						for (i = 0; i < input_containers.length; ++i) {
							max_height = Math.max(max_height, $(input_containers[i]).outerHeight());
						}
						input_containers.css("height", max_height + "px");
					};
				},

				create_post_data: function () {
					// Empty data
					var data = {
						name: {
							value: "",
							selection: {
								start: 0,
								end: 0
							}
						},
						email: {
							value: "",
							selection: {
								start: 0,
								end: 0
							}
						},
						subject: {
							value: "",
							selection: {
								start: 0,
								end: 0
							}
						},
						comment: {
							value: "",
							selection: {
								start: 0,
								end: 0
							}
						},
						file: {
							name: "",
							file: null
						},
						spoiler: {
							value: false
						}
					};

					// Saved settings
					data.name.value = this.saved_post_settings.name;
					data.email.value = this.saved_post_settings.email;

					// Done
					return data;
				},

				acquire_post_context: function (thread) {
					this.post_context.acquiring = true;
					this.post_context.percent = 0;

					// Query URL
					xch.ajax({
						url: (thread == null ? info.create_url.to_board(info.board) : info.create_url.to_thread(thread.board, thread.id)),
						method: "GET",
						return_type: "text",
						on: {
							load: this_private.on_post_context_load,
							error: this_private.on_post_context_error,
							abort: this_private.on_post_context_abort,
							progress: this_private.on_post_context_progress
						},
						qr: this,
						qr_pc_thread: thread
					});
				},
				acquire_post_context_from_html: function (html, thread, expire_old) {
					// Find data
					var post_form = html.find('form[name="post"]');
					if (post_form.length > 0) {
						// Reset
						this.post_context.data_fields_extra = [];

						// Extra fields
						var ignore_fields = ["thread", "board", "post"];
						for (var field in this.post_data_names) {
							ignore_fields.push(this.post_data_names[field]);
						}

						var inputs = post_form.find("input,textarea");
						for (var j = 0; j < inputs.length; ++j) {
							var me = $(inputs[j]);
							var name = me.attr("name");
							for (var i = 0; i < ignore_fields.length; ++i) {
								if (name == ignore_fields[i]) break;
							}
							if (i < ignore_fields.length) continue; // Skip
							// Add
							this.post_context.data_fields_extra.push({
								name: name,
								value: me.val()
							});
						}

						this.post_context.thread = thread;

						// Context expired
						if (expire_old) {
							communication.cross_tab_trigger("qr_context_expire", {
								board: (thread ? thread.board : null),
								thread_id: (thread ? thread.id : null)
							});
						}
					}
				},
				on_post_context_load: function (event) {
					// HTML Parse
					if (event.okay) {
						// Parse response
						var html = xch.string_to_dom(event.response);
						// Check
						if (html != null && (html = $(html)).length > 0) {
							// Parse
							this_private.acquire_post_context_from_html.call(event.data.qr, html, event.data.qr_pc_thread, true);
						}
					}

					// Done
					this_private.post_context_acquire_finish.call(event.data.qr);
				},
				on_post_context_error: function (event) {
					this_private.post_context_acquire_finish.call(event.data.qr);
				},
				on_post_context_abort: function (event) {
					this_private.post_context_acquire_finish.call(event.data.qr);
				},
				on_post_context_progress: function (event) {
					var perc = event.event.loaded / event.event.total;

					event.data.qr.post_context.percent = perc;

					this_private.submit_progress_change.call(event.data.qr, "context_acquire", perc);
				},
				post_context_acquire_finish: function () {
					// Done
					this.post_context.acquiring = false;

					// Percent change
					this.post_context.percent = 0;
					this_private.submit_progress_change.call(this, "context_acquire", 1);

					// Next
					if (this.submitting.queued && this.cooldown.complete) {
						this_private.submit.call(this);
					}
				},

				on_info_message_close: function (event, self) {
					self.info_message = null;
				},
				on_error_message_close: function (event, self) {
					self.error_message = null;
				},

				submit_try: function (skip_timeout) {
					if (this.cooldown.complete) {
						if (this.submitting.active) {
							// Can abort?
							if (this.submitting.abortable) {
								// Abort
								this_private.submit_abort.call(this);
							}
						}
						else if (this.post_context.acquiring) {
							if (this.submitting.queued) {
								// De-queue
								this_private.submit_dequeue.call(this);
							}
							else {
								// Queue
								this.cooldown.retry_number = 0;
								this_private.update_retry_number_display.call(this);
								this_private.submit_queue.call(this);
							}
						}
						else {
							// Submit
							var submit_now = true;
							if (!this.target_thread_is_current) {
								// If target mismatch, don't submit
								if (this.target_thread == null) {
									if (this.post_context.thread) {
										submit_now = false;
									}
								}
								else {
									if (this.target_thread != this.post_context.thread) {
										submit_now = false;
									}
								}
							}

							if (submit_now) {
								// Submit should be okay
								this.cooldown.retry_number = 0;
								this_private.update_retry_number_display.call(this);
								this_private.submit.call(this);
							}
							else {
								// Context re-acquire
								this_private.acquire_post_context.call(this, this.target_thread);
								// Queue
								this.cooldown.retry_number = 0;
								this_private.update_retry_number_display.call(this);
								this_private.submit_queue.call(this);
							}
						}
					}
					else if (!this.submitting.active) {
						if (skip_timeout) {
							if (this.post_context.acquiring) {
								if (this.submitting.queued) {
									// De-queue
									this_private.submit_dequeue.call(this);
								}
								else {
									// Queue
									this.cooldown.retry_number = 0;
									this_private.update_retry_number_display.call(this);
									this_private.submit_queue.call(this);
								}
							}
							else {
								// Submit
								this.cooldown.retry_number = 0;
								this_private.update_retry_number_display.call(this);
								this_private.cooldown_stop.call(this);
								this_private.submit.call(this);
							}
						}
						else {
							// Queue
							if (this.submitting.queued) {
								// De-queue
								this_private.submit_dequeue.call(this);
							}
							else {
								// Queue
								this.cooldown.retry_number = 0;
								this_private.update_retry_number_display.call(this);
								this_private.submit_queue.call(this);
							}
						}
					}
				},

				submit_abort: function () {
					if (this.submitting.active && this.submitting.ajax && this.submitting.abortable) {
						this.submitting.ajax.abort();
					}
				},
				submit_queue: function () {
					if (!this.submitting.queued) {
						// Validate
						var submit_data = this.post_data[0];
						var err = this.validage_post(submit_data);
						if (err != null) {
							this_private.submit_error.call(this, {
								type: "Invalid Post",
								detail: err.detail,
								cooldown: null
							});
							return;
						}

						// Queue
						this.submitting.queued = true;

						if (!this.submitting.active) {
							this_private.change_fields_readonly.call(this, true);

							this_private.submit_status_show.call(this);
							if (this.cooldown.complete) {
								this_private.submit_status_change.call(this, "Acquiring post context...", "context_acquire", this.post_context.percent);
							}
							else {
								this_private.submit_status_change.call(this, "Cooldown timer...", "cooldown", 1 - (this.cooldown.time / this.cooldown.time_total));
							}
						}
					}
				},
				submit_dequeue: function () {
					if (this.submitting.queued) {
						this.submitting.queued = false;

						if (!this.submitting.active) {
							this_private.submit_status_hide.call(this);
							this_private.change_fields_readonly.call(this, false);
						}

						this.container.find(".qr_submit").removeClass("retry");
					}
				},

				submit: function () {
					// Make sure data is not being submitted
					if (this.submitting.active) return

					// Get submit data
					var submit_data = this.post_data[0];

					// Validate
					var err = this.validage_post(submit_data);
					if (err != null) {
						this_private.submit_error.call(this, {
							type: "Invalid Post",
							detail: err.detail,
							cooldown: null
						});
						return;
					}

					// Readonly
					this_private.change_fields_readonly.call(this, true);

					// Status change
					this_private.submit_status_show.call(this);
					this_private.submit_status_change.call(this, "Connecting...", "upload", 0);

					this.container.find(".qr_submit").addClass("active").removeClass("retry");

					this_private.cooldown_stop.call(this);

					this.submitting.active = true;
					this.submitting.data = ajax_data;
					this.submitting.abortable = true;
					this.submitting.parsing = false;
					this.submitting.cleared_fields = false;
					this.submitting.queued = false;

					// Create form data
					var fd = this_private.create_submit_form_data.call(this, submit_data);

					// Submit target
					var target_post_url = "";
					if (this.target_thread != null) {
						target_post_url = info.create_url.to_post_submit_target(this.board, this.thread);
					}
					else {
						target_post_url = info.create_url.to_post_submit_target(info.board, null);
					}

					// Begin
					var ajax_data = {
						url: target_post_url,
						method: "POST",
						return_type: "text",
						post_data: fd,
						//cred: true,
						on: {
							load: this_private.submit_on_load,
							progress: this_private.submit_on_progress,
							error: this_private.submit_on_error,
							abort: this_private.submit_on_abort,
							upload: {
								load: this_private.submit_on_upload_load,
								abort: this_private.submit_on_upload_abort,
								error: this_private.submit_on_upload_error,
								progress: this_private.submit_on_upload_progress
							}
						},
						qr: this,
						qr_target_thread: this.target_thread,
						qr_submit_data: submit_data,
						qr_password: this.saved_post_settings.password
					};
					this.submitting.ajax = xch.ajax(ajax_data);
				},

				submit_progress_change: function (step, progress) {
					if (this.submitting.status.step != step) return;

					// Set
					this.submitting.status.progress = progress;

					// Change width
					this.container.find(".qr_progress_inner").css("width", (this.submitting.status.progress * 100).toFixed(2) + "%");
				},
				submit_status_change: function (text, step, progress) {
					// Set
					var step_pre = this.submitting.status.step;
					this.submitting.status.step = step;
					this.submitting.status.progress = progress;

					// Text
					var status = this.container.find(".qr_status");
					if (arguments.length > 0) status.find(".qr_status_message").text(text);

					// Progress
					this_private.submit_progress_change.call(this, step, this.submitting.status.progress);

					// Progress colors
					if (step_pre != step) {
						var pb = status.find(".qr_progress");
						var pbi = pb.children(".qr_progress_inner");
						style.set_class(pb, "qr_progress " + step_pre);
						pbi.removeClass(step_pre).addClass(step);
					}
				},
				submit_status_show: function () {
					var status = this.container.find(".qr_status");
					if (status.hasClass("hidden")) {
						this.submitting.status.step = "default";

						this.container.find(".qr_status").removeClass("hidden");
					}
				},
				submit_status_hide: function () {
					var pb = (this.container.find(".qr_status").addClass("hidden").find(".qr_progress"));
					var pbi = pb.children(".qr_progress_inner");
					style.set_class(pb, "qr_progress default");
					style.set_class(pbi, "qr_progress_inner");
				},

				submit_on_load: function (event) {
					// Status
					this_private.submit_status_change.call(event.data.qr, "Download complete", "download", 1);

					// Change
					if (event.okay) {
						// Parse response
						var html = xch.string_to_dom(event.response);
						// Check
						if (html != null && (html = $(html)).length > 0) {
							// Parse
							this_private.submit_check.call(event.data.qr, html, event.data, event);
						}
						else {
							// Bad
							this_private.submit_error.call(event.data.qr, {
								type: "Parsing Error",
								detail: "An error occured while parsing the resulting HTML",
								cooldown: "parse_error"
							});
						}
					}
					else {
						this_private.submit_error.call(event.data.qr, {
							type: "Status Error",
							detail: "An invalid http status was returned (" + event.status + ", " + event.status_text + ")",
							cooldown: "http_error"
						});
					}
				},
				submit_on_abort: function (event) {
					// Error message
					if (event.data.qr.info_message != null) {
						event.data.qr.info_message.close();
					}
					event.data.qr.info_message = new xch.Message({
						type: "info",
						title: "Submission Cancelled",
						text: "Post download was cancelled",
						on: {
							close: {
								callback_data: event.data.qr,
								callback: this_private.on_info_message_close
							}
						}
					});

					// Done
					this_private.submit_complete.call(event.data.qr, event.data.qr_submit_data, true);
				},
				submit_on_error: function (event) {
					this_private.submit_error.call(event.data.qr, {
						type: "Error",
						detail: "An error occured while connecting",
						cooldown: "connection_error"
					});
				},
				submit_on_progress: function (event) {
					var perc = event.event.loaded / event.event.total;
					this_private.submit_progress_change.call(event.data.qr, "download", perc);
				},
				submit_on_upload_load: function (event) {
					this_private.submit_status_change.call(event.data.qr, "Downloading...", "download", 0);
				},
				submit_on_upload_abort: function (event) {
					// Error message
					if (event.data.qr.info_message != null) {
						event.data.qr.info_message.close();
					}
					event.data.qr.info_message = new xch.Message({
						type: "info",
						title: "Submission Cancelled",
						text: "Post upload was cancelled",
						on: {
							close: {
								callback_data: event.data.qr,
								callback: this_private.on_info_message_close
							}
						}
					});

					// Done
					this_private.submit_complete.call(event.data.qr, event.data.qr_submit_data, true);
				},
				submit_on_upload_error: function (event) {
					this_private.submit_error.call(event.data.qr, {
						type: "Error",
						detail: "An error occured while uploading",
						cooldown: "connection_error"
					});
				},
				submit_on_upload_progress: function (event) {
					var perc = event.event.loaded / event.event.total;
					if (event.data.qr.submitting.status.progress == 0 && perc > 0) {
						this_private.submit_status_change.call(event.data.qr, "Uploading...", "upload", perc);
					}
					else {
						this_private.submit_progress_change.call(event.data.qr, "upload", perc);
					}
				},

				submit_posting_error_check: function (ajax_data, error_str) {
					if (
						// /you\s+look\s+like\s+a\s+bot/i.test(error_str)
						/looks\s+automated/i.test(error_str)
					) {
						// Acquire new posting context
						this_private.acquire_post_context.call(this, ajax_data.qr_target_thread);
						return true;
					}
					return false;
				},
				submit_error: function (error) {
					// Error message
					if (this.error_message != null) {
						this.error_message.close();
					}
					this.error_message = new xch.Message({
						type: "error",
						title: error.type,
						text: error.detail,
						on: {
							close: {
								callback_data: this,
								callback: this_private.on_error_message_close
							}
						}
					});

					// Clear status
					this.submitting.active = false;
					this.submitting.data = null;
					this.submitting.abortable = false;
					this.submitting.parsing = false;
					this.submitting.ajax = null;
					this.submitting.cleared_fields = false;
					this.container.find(".qr_submit").removeClass("active");

					// Cooldown
					this_private.cooldown_start.call(this, "cooldown" in error ? error.cooldown : null, true);

					// Unlock fields
					if (!this.submitting.queued) {
						this_private.change_fields_readonly.call(this, false);
					}
				},
				submit_check: function (html, ajax_data, event) {
					this.submitting.abortable = false;

					// Error checking
					var error = content.check_html_for_error(html);
					if (error !== null) {
						var cooldown_type = this_private.submit_posting_error_check.call(this, ajax_data, error) ? "context_error" : "posting_error";

						// Remove last "."
						if (error[error.length - 1] == "." && error.substr(-2) != "..") {
							error = error.substr(0, error.length - 1);
						}

						this_private.submit_error.call(this, {
							type: "Posting Error",
							detail: error,
							cooldown: cooldown_type
						});
						return false;
					}

					// Otherwise, good
					this_private.submit_okay.call(this, html, ajax_data, event);

					// Done
					return true;
				},
				submit_okay: function (html, ajax_data, event) {
					// Loader settings
					var loader, loader_board, loader_thread;
					if (ajax_data.qr_target_thread == null) {
						// New thread
						loader_board = info.board;
						loader_thread = undefined;
					}
					else {
						// Reply
						loader_board = ajax_data.qr_target_thread.board;
						loader_thread = ajax_data.qr_target_thread.id;
					}
					// Loader
					loader = xch.Loader.get_thread_from_ajax_load(
						loader_board,
						loader_thread,
						null,
						{},
						ajax_data,
						event,
						html
					);

					// Status change
					this.submitting.parsing = true;
					if (this.settings.posting.show_parse_status) {
						// Change status
						this_private.submit_status_change.call(event.data.qr, "Parsing response...", "parse", 0);
					}
					else if (!this.submitting.queued) {
						this_private.submit_status_hide.call(this);
					}

					loader.on("progress", this_private.submit_on_parse_progress, this);

					// How to use the loader
					if (ajax_data.qr_target_thread == null) {
						// New thread
						this_private.setup_submitted_thread_find.call(this, ajax_data, loader, true);
						loader.run();
					}
					else {
						// Comment
						if (info.index || content.updater == null) {
							// Find comment and go to thread
							this_private.setup_submitted_post_find.call(this, ajax_data, loader, true);
							loader.run();
						}
						else {
							// Use thread updater
							this_private.setup_submitted_post_find.call(this, ajax_data, loader, false);
							content.updater.update_from_loader(loader, null);
						}
					}

					// Start the cooldown timer
					this_private.cooldown_start.call(this, "success", false);

					// Clear post
					if (!this.settings.posting.require_parse_complete_before_post_clear && !this.submitting.cleared_fields) {
						this.submitting.cleared_fields = true;
						this.submitting.queued = false;
						this_private.change_fields_readonly.call(this, false);
						this.clear();
					}

					// Post context
					this_private.acquire_post_context_from_html.call(this, html, ajax_data.qr_target_thread, true);
				},
				submit_complete: function (submit_data, aborted) {
					// Submission complete
					this.submitting.active = false;
					this.submitting.data = null;
					this.submitting.abortable = false;
					this.submitting.parsing = false;
					this.submitting.ajax = null;

					// Save
					this_private.save_post_name.call(this, submit_data.name.value);
					this_private.save_post_email.call(this, submit_data.email.value);

					// Clear post
					if (!this.submitting.cleared_fields) {
						this.submitting.queued = false;
						this_private.change_fields_readonly.call(this, false);
						if (!aborted) this.clear();
					}
					this.submitting.cleared_fields = false;

					// Clear status
					this.container.find(".qr_submit").removeClass("active");

					// Enable cooldown to finish
					this.cooldown.retry_number = 0;
					this_private.update_retry_number_display.call(this);
					this_private.cooldown_finish.call(this, false);

					// Hide status
					if (!this.submitting.queued) {
						this_private.submit_status_hide.call(this);
						// QR close?
						if (!aborted && !this.persistent) {
							this.close();
						}
					}
				},

				submit_on_parse_progress: function (event, self) {
					if (event.type == "parse") {
						this_private.submit_progress_change.call(self, "parse", event.loaded / event.total);
					}
				},

				update_retry_number_display: function () {
					var status = this.container.find(".qr_status");

					if (this.cooldown.retry_number == 0) {
						status.find(".qr_status_attempt").addClass("hidden").text("");
					}
					else {
						status.find(".qr_status_attempt").removeClass("hidden").text("attempt " + (this.cooldown.retry_number + 1));
					}
				},

				cooldown_start: function (cooldown_type, source_error) {
					/*!debug!*/assert(cooldown_type == null || cooldown_type in this.settings.cooldown, "Bad cooldown setting: " + cooldown_type);
					// Apply
					var type = (cooldown_type == null ? null : this.settings.cooldown[cooldown_type]);
					if (cooldown_type == null || !source_error || type.stop || ++this.cooldown.retry_number >= this.settings.posting.max_retries) {
						// No auto-retry
						this.submitting.queued = false;

						// Reset retry number
						if (source_error) {
							this.cooldown.retry_number = 0;
							this_private.submit_status_hide.call(this);
						}
					}
					else {
						// Auto-retry
						this.submitting.queued = true;

						// Change status
						this.container.find(".qr_submit").addClass("retry");
						this_private.submit_status_change.call(this, "Cooldown timer...", "cooldown", 1 - (this.cooldown.time / this.cooldown.time_total));
					}

					this_private.update_retry_number_display.call(this);

					// Start cooldown timer
					if (cooldown_type != null) {
						var self = this;

						this.cooldown.bar.removeClass("ready");

						var time = type.timeout;
						if (this.cooldown.timer !== null) {
							clearInterval(this.cooldown.timer);
							// Decrease from total time if already active
							if (source_error) {
								time -= (this.cooldown.time_total - this.cooldown.time);
							}
						}

						this.cooldown.complete = false;
						this.cooldown.time_total = type.timeout;
						this.cooldown.time = Math.min(time, type.timeout);

						this_private.cooldown_tick.call(this, false);
						this.cooldown.timer = setInterval(function () {
							this_private.cooldown_tick.call(self, true);
						}, 1000);
					}
				},
				cooldown_tick: function (decrease) {
					var finish = false;
					if (decrease && --this.cooldown.time <= 0) {
						// Stop timer
						if (this.cooldown.timer !== null) {
							clearInterval(this.cooldown.timer);
							this.cooldown.timer = null;
						}

						finish = true;
					}

					// Update bar percent
					var perc = 1 - (this.cooldown.time / this.cooldown.time_total);
					this.cooldown.bar_inner.css("width", (perc * 100).toFixed(2) + "%");
					this_private.submit_progress_change.call(this, "cooldown", perc);

					// Finish
					if (finish) {
						this_private.cooldown_finish.call(this, true);
					}
				},
				cooldown_stop: function () {
					// Stop timer
					if (this.cooldown.timer !== null) {
						clearInterval(this.cooldown.timer);
						this.cooldown.timer = null;
					}

					// Complete
					if (!this.cooldown.complete) {
						this.cooldown.complete = true;
						this.cooldown.bar.addClass("ready");
					}
				},
				cooldown_finish: function (end_of_timer) {
					if (this.cooldown.complete) return;

					var finish = false;
					if (end_of_timer) {
						if (!this.settings.posting.require_parse_complete_before_posting_again || !this.submitting.active || this.submitting.queued) {
							finish = true;
						}
					}
					else {
						if (this.cooldown.timer === null) {
							finish = true;
						}
					}

					if (finish) {
						// Done
						this.cooldown.complete = true;
						this.cooldown.bar.addClass("ready");
						this.container.find(".qr_submit").removeClass("retry");

						// Retry
						if (this.submitting.queued) {
							if (this.post_context.acquiring) {
								this_private.submit_status_change.call(this, "Acquiring post context...", "context_acquire", this.post_context.percent);
							}
							else {
								// (re)Submit
								this_private.submit.call(this);
							}
						}
					}
				},

				compare_post_name: function () {
					if (this.container != null) {
						var field = this.fields.filter(".qr_name");
						var field_ss = field.parent().children(".qr_saved_settings");

						if (this.saved_post_settings.name != null && this.saved_post_settings.name.length > 0 && this.post_data[this.post_data_id_current].name.value == this.saved_post_settings.name) {
							field_ss.removeClass("hidden");
							field.css("padding-right", (field_ss.outerWidth()) + "px");
						}
						else {
							field_ss.addClass("hidden");
							field.css("padding-right", "");
						}
					}
				},
				compare_post_email: function () {
					if (this.container != null) {
						var field = this.fields.filter(".qr_email");
						var field_ss = field.parent().children(".qr_saved_settings");

						if (this.saved_post_settings.email != null && this.saved_post_settings.email.length > 0 && this.post_data[this.post_data_id_current].email.value == this.saved_post_settings.email) {
							field_ss.removeClass("hidden");
							field.css("padding-right", (field_ss.outerWidth()) + "px");
						}
						else {
							field_ss.addClass("hidden");
							field.css("padding-right", "");
						}
					}
				},
				load_post_name: function () {
					this.saved_post_settings.name = window.localStorage.getItem("name", "") || "";
					this_private.compare_post_name.call(this);
				},
				load_post_email: function () {
					this.saved_post_settings.email = window.localStorage.getItem("email", "") || "";
					this_private.compare_post_email.call(this);
				},
				save_post_name: function (value) {
					for (var i = 0; i < this.unsaveable.names.length; ++i) {
						if (value == this.unsaveable.names[i]) {
							value = null;
							break;
						}
					}

					if (value !== null) {
						window.localStorage.setItem("name", value);
						this.saved_post_settings.name = value;
					}

					this_private.compare_post_name.call(this);

					// Multitab signal
					communication.cross_tab_trigger("qr_save", {
						value: "post_name"
					});
				},
				save_post_email: function (value) {
					for (var i = 0; i < this.unsaveable.emails.length; ++i) {
						if (value == this.unsaveable.emails[i]) {
							value = null;
							break;
						}
					}

					if (value !== null) {
						window.localStorage.setItem("email", value);
						this.saved_post_settings.email = value;
					}

					this_private.compare_post_email.call(this);

					// Multitab signal
					communication.cross_tab_trigger("qr_save", {
						value: "post_email"
					});
				},

				which_post_is_more_accurate: function (submit_data, posts) {
					// Returns -1 if posts[0] and posts[1] both match submit_data equally
					// Returns 0 if posts[0] more closely matches submit_data
					// Returns 1 if posts[1] more closely matches submit_data
					var p = [0,0], name, s_val, p_val, pos;

					for (var i = 0; i < p.length; ++i) {
						// Name
						name = submit_data.name.value.trim();
						pos = name.indexOf("#");
						s_val = (pos < 0 ? name : name.substr(0, pos));
						p_val = posts[i].get_name_plaintext();
						if (p_val == s_val || (s_val.length == 0 && info.is_default_name(p_val, posts[i].thread.board))) {
							++p[i];
						}

						// Tripcode
						s_val = (pos < 0 ? null : name.substr(pos + 1));
						p_val = posts[i].get_tripcode_plaintext();
						if ((s_val === null) == (p_val === null)) {
							++p[i];
						}

						// Subject
						s_val = submit_data.subject.value.trim();
						p_val = posts[i].get_subject_plaintext();
						if (
							(s_val.length == 0 && p_val === null) ||
							(s_val.length > 0 && p_val !== null && s_val == p_val.trim())
						) {
							++p[i];
						}

						// Comment
						s_val = submit_data.comment.value.trim();
						p_val = posts[i].get_comment_plaintext();
						if (
							(s_val.length == 0 && (p_val === null || p_val.trim().length == 0))
						) {
							++p[i];
						}

						// Image
						if (
							(submit_data.file.file != null) === (posts[i].image != null && posts[i].image.good())
						) {
							++p[i]
						}
					}

					// Return
					if (p[0] == p[1]) return -1;
					else if (p[0] > p[1]) return 0;
					return 1;
				},

				setup_submitted_thread_find: function (ajax_data, loader, redirect_to_thread) {
					var cb_data = {
						self: this,
						new_post: null,
						new_thread: null,
						finish_function: this_private.on_submitted_thread_loader_finish,
						redirect_to_thread: redirect_to_thread,
						submit_data: ajax_data.qr_submit_data,
						password: ajax_data.qr_password
					};

					// Events
					loader.on("thread_ready", this_private.on_submitted_thread_loader_thread_ready, cb_data);
					loader.on("post_load", this_private.on_submitted_thread_loader_post_load, cb_data);
					loader.on("complete", this_private.on_submitted_thread_loader_complete, cb_data);
				},
				on_submitted_thread_loader_finish: function (cb_data) {
					// Mark post as "you"
					content.mark_post_as_me(cb_data.new_post, cb_data.submit_data, cb_data.password, true);
					this_private.submit_complete.call(cb_data.self, cb_data.submit_data, false);

					new xch.Message({
						type: "okay",
						title: "Post Successful",
						text: "Your thread was successfully submitted"
					});

					// Go to thread
					if (cb_data.redirect_to_thread) {
						// Go to thread
						location.go_to_new(
							info.create_url.to_thread(cb_data.new_post.thread.board, cb_data.new_post.thread.id)
						);
					}
				},
				on_submitted_thread_loader_thread_ready: function (event, cb_data) {
					// Main thread
					if (cb_data.new_thread == null) {
						cb_data.new_thread = event.thread;
					}
				},
				on_submitted_thread_loader_post_load: function (event, cb_data) {
					// Main post
					if (cb_data.new_post == null && event.post.op && event.post.thread == cb_data.new_thread) {
						// Finish
						cb_data.new_post = event.post;
						cb_data.finish_function.call(cb_data.self, cb_data);
						cb_data.finish_function = null;
					}
				},
				on_submitted_thread_loader_complete: function (event, cb_data) {
					// Check
					if (cb_data.new_thread == null) {
						// Error
						this_private.submit_error.call(self, {
							type: "Post Retrieval Error",
							detail: "Your thread could not be found after submission",
							cooldown: "post_retrieval_error"
						});
					}
					else if (cb_data.finish_function != null) {
						if (cb_data.new_post == null) {
							for (var i = 0; i < cb_data.new_thread.posts.length; ++i) {
								if (cb_data.new_thread.posts[i].op) {
									cb_data.new_post = cb_data.new_thread.posts[i];
									break;
								}
							}
						}
						if (cb_data.new_post == null) {
							// Error
							this_private.submit_error.call(cb_data.self, {
								type: "Post Retrieval Error",
								detail: "Your thread's OP could not be found after submission",
								cooldown: "post_retrieval_error"
							});
						}
						else {
							// Finish
							cb_data.finish_function.call(cb_data.self, cb_data);
							cb_data.finish_function = null;
						}
					}
				},

				setup_submitted_post_find: function (ajax_data, loader, redirect_to_thread) {
					var cb_data = {
						self: this,
						new_posts: [],
						redirect_to_thread: redirect_to_thread,
						target_thread: ajax_data.qr_target_thread,
						submit_data: ajax_data.qr_submit_data,
						password: ajax_data.qr_password
					};

					content.on("post_load", this_private.on_submitted_post_loader_post_load, cb_data);
					loader.on("complete", this_private.on_submitted_post_loader_complete, cb_data);
				},
				on_submitted_post_loader_post_load: function (event, cb_data) {
					// Check if it's the correct thread
					if (event.post.thread == cb_data.target_thread) {
						if (event.post_context.is_new) {
							// New
							cb_data.new_posts.push(event.post);
						}
					}
				},
				on_submitted_post_loader_complete: function (event, cb_data) {
					// Disable events
					content.off("post_load", this_private.on_submitted_post_loader_post_load);

					// Find post
					var my_post = null;
					for (var i = cb_data.new_posts.length - 1; i >= 0; --i) {
						// Set post
						if (
							my_post == null ||
							this_private.which_post_is_more_accurate.call(cb_data.self, cb_data.submit_data, [my_post, cb_data.new_posts[i]]) == 1
						) {
							my_post = cb_data.new_posts[i];
						}
					}

					// Error checking
					if (my_post == null) {
						// Error
						this_private.submit_error.call(cb_data.self, {
							type: "Post Retrieval Error",
							detail: "Your post could not be found after submission",
							cooldown: "post_retrieval_error"
						});
					}
					else {
						// Mark post as "you"
						content.mark_post_as_me(my_post, cb_data.submit_data, cb_data.password, true);
						this_private.submit_complete.call(cb_data.self, cb_data.submit_data, false);

						// Message
						new xch.Message({
							type: "okay",
							title: "Post Successful",
							text: "Your post was successfully submitted"
						});

						// Go to thread
						if (cb_data.redirect_to_thread) {
							// Go to thread
							location.go_to_new(
								info.create_url.to_post(my_post.thread.board, my_post.thread.id, my_post.id)
							);
						}
						else {
							if (cb_data.self.settings.posting.highlight_after_post) {
								// Highlight
								location.go_to(
									info.create_url.to_post(my_post.thread.board, my_post.thread.id, my_post.id)
								);
							}
						}
					}
				},

				change_fields_readonly: function (readonly) {
					if (this.container == null) return;

					if (readonly) {
						this.fields.attr("readonly", "readonly");
					}
					else {
						this.fields.removeAttr("readonly");
					}
				},

				create_submit_form_data: function (pd) {
					var fd = new FormData();

					// Extra fields
					for (var i = 0; i < this.post_context.data_fields_extra.length; ++i) {
						fd.append(this.post_context.data_fields_extra[i].name, this.post_context.data_fields_extra[i].value);
					}

					// Target
					if (this.target_thread != null) {
						fd.append(this.post_data_names.thread, this.target_thread.id);
						fd.append(this.post_data_names.board, this.target_thread.board);
					}
					else {
						fd.append(this.post_data_names.board, info.board);
					}

					// Fields
					fd.append(this.post_data_names.name, pd.name.value);

					fd.append(this.post_data_names.email, pd.email.value);

					fd.append(this.post_data_names.subject, pd.subject.value);

					if (this.spoiler_available) {
						if (pd.spoiler.value) {
							fd.append(this.post_data_names.spoiler, "on");
						}
					}

					fd.append(this.post_data_names.comment, pd.comment.value);

					if (pd.file.file != null) {
						if ((pd.file.file instanceof File) && pd.file.file.name === pd.file.name) {
							fd.append(this.post_data_names.file, pd.file.file);
						}
						else {
							fd.append(this.post_data_names.file, pd.file.file, pd.file.name);
						}
					}

					fd.append(this.post_data_names.password, this.saved_post_settings.password);

					// Post
					if (this.target_thread != null) {
						fd.append("post", this.post_submit_value.reply);
					}
					else {
						fd.append("post", this.post_submit_value.new_thread);
					}

					return fd;
				},

				on_target_selector_option_click: function (event) {
					event.data.callback_data.self.set_target(event.data.callback_data.thread);
					event.data.option.menu.close();
					return false;
				},
				on_target_selector_close: function (event, self) {
					self.target_selector = null;
				}

			};

			QuickReply.prototype = {

				constructor: QuickReply,

				is_open: function () {
					return (this.container != null && !this.container.hasClass("closed"));
				},
				open: function (target_thread) {
					if (this.container == null) {
						this_private.create.call(this);
						this.clear();
					}
					else {
						this.container.removeClass("closed");
					}

					// Settings
					this.set_target(target_thread);
					this.set_position(this.position.x, this.position.y, true, true);
				},
				close: function () {
					// Close
					if (this.container != null) {
						this.container.addClass("closed");

						// Abort submit
						this_private.submit_abort.call(this);
						this_private.submit_dequeue.call(this);
					}
				},
				clear: function () {
					// Make sure not submitting
					if (this.submitting.active) return;

					// Clear data
					var pd = this_private.create_post_data.call(this);
					this.post_data[this.post_data_id_current] = pd;

					// Clear fields
					if (this.container != null) {
						var o;

						// File
						this.set_file(pd.file.file, pd.file.name);

						// File spoiler
						if (!(o = this.fields.filter(".qr_file_spoiler")).attr("readonly")) o.prop("checked", pd.spoiler.value);

						// Fields
						if (!(o = this.fields.filter(".qr_name")).attr("readonly")) o.val(pd.name.value);
						if (!(o = this.fields.filter(".qr_email")).attr("readonly")) o.val(pd.email.value);
						if (!(o = this.fields.filter(".qr_subject")).attr("readonly")) o.val(pd.subject.value);
						if (!(o = this.fields.filter(".qr_comment")).attr("readonly")) o.val(pd.comment.value);

						this_private.compare_post_name.call(this);
						this_private.compare_post_email.call(this);
					}
				},
				set_target: function (target_thread) {
					// Can only reply to "current"
					if (!info.index) target_thread = null;

					if (target_thread == null) {
						if (info.index) {
							// New
							this.target_thread_is_current = false;
							this.target_thread = null;

							if (this.container != null) {
								this.container.attr("target_thread", "new");
								this.main_label_target_link.attr("target_thread", "New Thread");
							}
						}
						else {
							// Current
							this.target_thread_is_current = true;
							this.target_thread = null;

							for (var i = 0; i < content.threads.length; ++i) {
								if (content.threads[i].visible) {
									this.target_thread = content.threads[i];
									break;
								}
							}

							// Delay, in case this happened before threads were parsed
							if (this.target_thread == null && !("on_content_thread_new" in this)) {
								var self = this;
								content.on("thread_new", this.on_content_thread_new = (function (event) {
									self.target_thread = event.thread;
									content.off("thread_new", self.on_content_thread_new);
									self.on_content_thread_new = null;
								}));
							}

							if (this.container != null) {
								this.container.attr("target_thread", "current");
								this.main_label_target_link.attr("target_thread", "");
							}
						}
						if (this.container != null) {
							this.main_label_target_link.removeAttr("href");
						}
					}
					else {
						// Thread
						this.target_thread_is_current = false;
						this.target_thread = target_thread;

						if (this.container != null) {
							this.container.attr("target_thread", target_thread.id);

							this.main_label_target_link
							.attr("target_thread", ">>" + target_thread.id)
							.attr("href", info.create_url.to_thread(target_thread.board, target_thread.id));
						}
					}
				},
				set_persistency: function (persistent, no_save) {
					this.persistent = persistent;

					if (this.container != null) {
						if (persistent) {
							this.container.addClass("persistent");
						}
						else {
							this.container.removeClass("persistent");
						}
					}

					// Save persistency
					if (!no_save) {
						this_private.save_persistency.call(this);
					}
				},
				open_target_selector: function () {
					if (this.target_selector == null) {
						// Create thread list
						var options = [];
						if (info.index) {
							options.push({
								html: (
									style.e("a", "thread_selection")
									.text("New Thread")
									.attr("target_thread", "new")
								),
								on: {
									click: {
										callback_data: { self: this, thread: null },
										callback: this_private.on_target_selector_option_click
									}
								}
							});
							for (var i = 0; i < content.threads.length; ++i) {
								if (content.threads[i].visible) {
									options.push({
										html: (
											style.e("a", "thread_selection")
											.attr("href", info.create_url.to_thread(content.threads[i].board, content.threads[i].id))
											.text(">>" + content.threads[i].id)
											.attr("target_thread", content.threads[i].id)
										),
										on: {
											click: {
												callback_data: { self: this, thread: content.threads[i] },
												callback: this_private.on_target_selector_option_click
											}
										}
									});
								}
							}
						}
						else {
							options.push({
								html: (
									style.e("a", "thread_selection")
									.text("Current Thread")
									.attr("target_thread", "current")
								),
								on: {
									click: {
										callback_data: { self: this, thread: null },
										callback: this_private.on_target_selector_option_click
									}
								}
							});
						}

						// Create menu
						this.target_selector = new xch.Menu(this.main_label_target_link, {
							fit_width_min: true,
							keep_on_screen: true,
							fixed_z: null,
							open: "down",
							on: {
								close: {
									callback_data: this,
									callback: this_private.on_target_selector_close
								}
							},
							options: options
						});
					}
				},
				close_target_selector: function () {
					if (this.target_selector != null) {
						this.target_selector.close();
						this.target_selector = null;
					}
				},
				target_selector_is_open: function () {
					return (this.target_selector != null);
				},
				set_position: function (x, y, no_anchor_updates, no_save) {
					this.position.x = x;
					this.position.y = y;

					if (this.container != null) {
						var bounds = content.header.get_screen_area();
						var size = {
							w: this.container.outerWidth(),
							h: this.container.outerHeight()
						};

						// Bounds updating
						if (!no_anchor_updates || this.position.anchor.x == 0) {
							this.position.anchor.x = 0;
							if (x + size.w > bounds.left + bounds.width - this.settings.window.anchor_border_size) {
								this.position.anchor.x = 1;
							}
							if (x < bounds.left + this.settings.window.anchor_border_size) {
								this.position.anchor.x = -1;
							}
						}

						if (!no_anchor_updates || this.position.anchor.y == 0) {
							this.position.anchor.y = 0;
							if (y + size.h > bounds.top + bounds.height - this.settings.window.anchor_border_size) {
								this.position.anchor.y = 1;
							}
							if (y < bounds.top + this.settings.window.anchor_border_size) {
								this.position.anchor.y = -1;
							}
						}

						// Position
						if (this.position.anchor.x == 0) {
							this.container.css("left", x + "px").css("right", "");
						}
						else if (this.position.anchor.x == -1) {
							this.container.css("left", bounds.left + "px").css("right", "");
						}
						else {
							this.container.css("right", ($(window).width() - (bounds.left + bounds.width)) + "px").css("left", "");
						}

						if (this.position.anchor.y == 0) {
							this.container.css("top", y + "px").css("bottom", "");
						}
						else if (this.position.anchor.y == -1) {
							this.container.css("top", bounds.top + "px").css("bottom", "");
						}
						else {
							this.container.css("bottom", ($(window).height() - (bounds.top + bounds.height)) + "px").css("top", "");
						}

						// Selector
						if (this.target_selector_is_open()) {
							this.target_selector.update();
						}
					}

					if (!no_save) {
						// Save
						this_private.save_position.call(this);
					}
				},
				set_size: function (width, height, no_save) {
					// Resize
					this.size.width = Math.max(width, this.size_min.width);
					this.size.height = Math.max(height, this.size_min.height);
					if (this.container != null) {
						this.container.children(".popup_content").css("width", this.size.width + "px");
						this.container.find(".qr_comment").css("height", this.size.height + "px");
					}

					// Update
					if (pos_update) {
						this.set_position(this.position.x, this.position.y, true, true);
					}
					this_private.update_size.call(this);

					// Save
					if (!no_save) {
						this_private.save_size.call(this);
					}
				},

				validage_post: function (post_data) {
					var req = (this.target_thread == null ? this.requirements.new_thread : this.requirements.reply);

					if (req.image) {
						if (post_data.file.file == null) {
							return {
								detail: "You must select an image"
							};
						}
					}

					if (req.image_or_comment) {
						if (post_data.file.file == null && post_data.comment.value.trim().length == 0) {
							return {
								detail: "You must fill in the comment field or select a file"
							};
						}
					}

					// Okay
					return null;
				},

				validate_file: function (file, name) {
					var is_file = (file instanceof File);

					if (is_file) name = file.name;

					// Extension checking
					var ext = file.name.split(".");
					ext = (ext.length > 1 ? "." + ext.pop() : "");

					var okay = false;

					for (var i = 0, j, exts; i < this.valid_file_mimes.length; ++i) {
						exts = xch.mime_types[this.valid_file_mimes[i]].extensions;
						for (j = 0; j < exts.length; ++j) {
							// Okay
							if (ext == exts[j]) {
								// Okay
								okay = true;
								i = this.valid_file_mimes.length;
								break;
							}
						}
					}

					// Error
					if (!okay) {
						var okay_types = "";
						for (var i = 0; i < this.valid_file_mimes.length; ++i) {
							if (okay_types.length > 0) okay_types += ", ";
							okay_types += xch.mime_types[this.valid_file_mimes[i]].name;
						}

						return {
							detail: "File must be one of the following types: " + okay_types
						};
					}

					// File size checking
					okay = (file.size <= this.max_file_size);

					// Error
					if (!okay) {
						return {
							detail: "File size cannot exceed " + xch.format_number(this.max_file_size, 1000, 1024, 1, [" B", " KB", " MB"])
						};
					}

					// Okay
					return null;
				},
				set_file: function (file, name) {
					if (this.container == null || this.container.find(".qr_file").attr("readonly")) return;

					var fs = this.container.find(".qr_file_settings");
					var fn = this.container.find(".qr_file_name");

					if (file === null) {
						// Nullify
						this.post_data[this.post_data_id_current].file.name = "";
						this.post_data[this.post_data_id_current].file.file = null;

						// Hide
						fs.addClass("hidden");
						fn.val("").css("padding-right", "");
					}
					else {
						// Validate file
						var err = this.validate_file(file, name);
						if (err != null) {
							// Show error
							new xch.Message({
								type: "error",
								title: "File Error",
								text: err.detail
							});

							// Bad
							return false;
						}

						// Set
						this.post_data[this.post_data_id_current].file.name = (file instanceof File ? file.name : name) || "";
						this.post_data[this.post_data_id_current].file.file = file;

						// Visible
						fs.removeClass("hidden");
						fn.val(this.post_data[this.post_data_id_current].file.name);
						fn.css("padding-right", (fs.outerWidth()) + "px");
					}

					// Okay
					return true;
				},
				set_file_name: function (name) {
					if (this.container == null || this.container.find(".qr_file").attr("readonly") || this.post_data[this.post_data_id_current].file.file == null) {
						return null;
					}

					// Set
					name = xch.ensure_same_mime_type_extension(this.post_data[this.post_data_id_current].file.name, name);
					this.post_data[this.post_data_id_current].file.name = name;

					// Visible
					if (this.container != null) {
						var fn = this.container.find(".qr_file_name");
						fn.val(this.post_data[this.post_data_id_current].file.name);
					}

					// Okay
					return name;
				},

				focus_comment: function () {
					if (this.container == null) return;

					var com = this.container.find(".qr_comment");
					if (com.length > 0) {
						// Selection
						var sel = this.post_data[this.post_data_id_current].comment.selection;

						// Select
						xch.set_selection(com, sel.start, sel.end);
					}
				},

				create_password: function (length) {
					length = length || 8;

					var pass = "";
					var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
					for (var i = 0; i < length; ++i) {
						pass += str.charAt(Math.floor(Math.random() * str.length));
					}
					return pass;
				},

				quote: function (post) {
					// Open
					if (!this.is_open()) {
						this.open(post.thread);
						this.clear();
					}
					// Quote
					var com = this.fields.filter(".qr_comment");
					if (com.length > 0 && !com.attr("readonly")) {
						// Selection
						var sel = this.post_data[this.post_data_id_current].comment.selection;
						var start, end;
						if (sel.start < sel.end) {
							start = sel.start;
							end = sel.end;
						}
						else {
							end = sel.start;
							start = sel.end;
						}

						// Quote text
						var quote_text = ">>" + post.id + "\n";

						// Update comment
						var val = com.val();
						var norm = /\r\n/.test(val);
						if (norm) {
							val = val.replace(/\r\n/g, "\n");
						}
						val = val.substr(0, start) + quote_text + val.substr(end);
						if (norm) {
							val = val.replace(/\n/g, "\r\n");
						}
						com.val(val);

						// Select
						xch.set_selection(com, start + quote_text.length, start + quote_text.length);
					}
				}

			};

			return QuickReply;

		})(),


		// Auto-updater
		Updater: (function () {

			var Updater = function (html) {
				var self = this;

				this.thread = null;
				this.first_load = true;

				this.countdown_start_after_parse = true; // false for start after the ajax has completed; true for start after the parsing has completed
				this.countdown = {
					timer: null,
					ready: false,
					time: 0,
					time_last: null,
					last_changed: false,
					last_changed_count: 0
				};

				this.countdown_settings = {
					reset_on_manual_if_auto_enabled: Updater.RESET_NEVER,
					reset_on_manual_if_auto_disabled: Updater.RESET_NEVER,
					reset_on_auto_enable: Updater.RESET_IF_DECREASES,
					initial: 60,
					minimum: 30,
					maximum: 120,
					decrease: {
						count: 1, // how many times a thread change must happen before an amount change
						count_first: 1, // how many times a thread change must happen before the first amount change
						amount: -1, // -1 indicates set to minimum
						manual: true // true = can be changed by a manual update
					},
					increase: {
						count: 2, // how many times a thread must receive no updates before an amount change
						count_first: 4, // how many times a thread must receive no updates before the first amount change
						amount: 15, // increase time by 15 seconds
						manual: false // false = cannot be changed by a manual update
					}
				};

				this.auto_start = false;
				this.auto_reload_allowed = false;
				this.auto_reload_enabled = false;

				this.loader = null;
				this.loader_parsing = true;
				this.loader_events = null;
				this.manual_updating = true;
				this.thread_changed = false;

				this.totals = {
					posts: 0,
					images: 0
				}
				this.change = {
					added: {
						posts: 0,
						images: 0
					},
					removed: {
						posts: 0,
						images: 0
					}
				};

				this.limits = {
					normal: {
						posts: 500,
						images: 250
					},
					sticky: {
						posts: -1,
						images: 250
					}
				};

				this.position = {
					x: 0,
					y: 0,
					in_header: true,
					anchor: {
						x: 1,
						y: 1
					}
				};
				this.anchor_border_size = 10;

				this.moving = {
					active: false,
					offset: {
						x: 0,
						y: 0
					}
				};

				this.title = {
					prefix: "(%unread) ",
					suffix: ""
				};

				this.status_monitor = {
					total_posts: 0,
					posts_read: 0,
					alive: true,
					nearest_reference_to_me: null
				}

				// Load
				this_private.load_all.call(this);

				// Setup
				this_private.init.call(this, html);

				this_private.update_status_title.call(this);
				this_private.update_status_favicon.call(this);

				// Event listeners
				content.on("thread_new", this_private.on_content_thread_new, this);
				content.on("thread_load", this_private.on_content_thread_load, this);
				content.on("thread_delete", this_private.on_content_thread_delete, this);
				content.on("thread_update", this_private.on_content_thread_update, this);
				content.on("post_load", this_private.on_content_post_load, this);
				content.on("post_delete", this_private.on_content_post_delete, this);

				var data = { self: this, timer_short: null, timer_long: null };
				$(window).on("scroll", data, this_private.on_window_scroll);

				communication.cross_tab_on("updater_save", this_private.on_cross_tab_save, this);
			};

			var this_private = {

				load_all: function () {
					// Load all settings
					this_private.load_position.call(this, false);
				},
				load_position: function (apply) {
					var pos = xch.site_get_value("updater_position", this.position);
					if (pos !== this.position) {
						var in_header = this.position.in_header;

						xch.merge_settings(pos, this.position, false);

						if (apply) {
							if (this.position.in_header != in_header) {
								this.position.in_header = in_header;
								this.set_in_header(!in_header, true, true);
							}
							this.set_position(this.position.x, this.position.y, true, true);
						}
					}
				},
				save_position: function () {
					xch.site_set_value("updater_position", this.position);

					communication.cross_tab_trigger("updater_save", {
						value: "position"
					});
				},

				on_cross_tab_save: function (event, self) {
					if (event.value == "position") {
						this_private.load_position.call(self, true);
					}
				},

				on_content_thread_new: function (event, self) {
					this_private.set_thread.call(self, event.thread);
					content.off("thread_new", this_private.on_content_thread_new);
				},
				on_content_thread_load: function (event) {
					if (event.thread == self.thread && self.first_load) {
						// Completed
						this_private.thread_loaded_first.call(self);
					}
				},
				on_content_thread_delete: function (event, self) {
					if (event.thread == self.thread) {
						// 404
						this_private.thread_deleted.call(self);
					}
				},
				on_content_thread_update: function (event, self) {
					if (event.thread == self.thread) {
						self.thread_changed = true;

						// Thread has been updated
						this_private.thread_updated.call(self, event.state_old);
					}
				},
				on_content_post_load: function (event, self) {
					if (event.post.thread == self.thread) {
						if (event.post_context.is_new) {
							self.thread_changed = true;

							// Update totals
							this_private.increment_value.call(self, self.totals, false, 1);
							// Update added
							if (!self.first_load) this_private.increment_value.call(self, self.change.added, false, 1);

							// Image?
							if (event.post.image != null && event.post.image.url != null) {
								// Update totals
								this_private.increment_value.call(self, self.totals, true, 1);
								// Update added
								if (!self.first_load) this_private.increment_value.call(self, self.change.added, true, 1);
							}

							// Append
							if (!event.context.is_new) {
								event.post.insert_into_thread();
							}

							// Update title
							var favicon_change = false;
							if (self.status_monitor.nearest_reference_to_me == null && event.post.references_me()) {
								self.status_monitor.nearest_reference_to_me = event.post;
								favicon_change = true;
							}

							var any_unread = (self.status_monitor.total_posts == self.status_monitor.posts_read);
							this_private.update_status_add_post.call(self, event.post);
							this_private.update_status_title.call(self);
							if (any_unread != (self.status_monitor.total_posts == self.status_monitor.posts_read) || favicon_change) {
								this_private.update_status_favicon.call(self);
							}
						}
						else if (event.updated) {
							if (event.update_data.image_deleted) {
								self.thread_changed = true;
								this_private.increment_value.call(self, self.totals, true, -1);
								this_private.increment_value.call(self, self.change.removed, true, 1);
							}
						}
					}
				},
				on_content_post_delete: function (event, self) {
					if (event.post.thread == self.thread) {
						self.thread_changed = true;
						this_private.increment_value.call(self, self.totals, false, -1);
						this_private.increment_value.call(self, self.change.removed, false, 1);
					}
				},

				on_window_scroll: function (event) {
					var ev_data = event.data;
					// Short timer
					if (ev_data.timer_short !== null) {
						clearTimeout(ev_data.timer_short);
					}
					ev_data.timer_short = setTimeout(function () {
						ev_data.timer_short = null;
						if (ev_data.timer_long !== null) {
							clearTimeout(ev_data.timer_long);
							ev_data.timer_long = null;
						}
						this_private.update_status_posts_read.call(ev_data.self);
					}, 100);

					// Long timer
					if (ev_data.timer_long === null) {
						ev_data.timer_long = setTimeout(function () {
							ev_data.timer_long = null;
							if (ev_data.timer_short !== null) {
								clearTimeout(ev_data.timer_short);
								ev_data.timer_short = null;
							}
							this_private.update_status_posts_read.call(ev_data.self);
						}, 1000);
					}
				},

				init: function (html) {
					var s_enabled, s_countdown, s_progress_bar, s_totals;

					content.floating_container.append(
						(this.container = style.e("div", "updater"))
						.append(
							style.e("div", "updater_background")
						)
						.append( //{ Small
							style.e("div", "updater_small")
							.append(
								(s_enabled = style.checkbox(false, "small"))
								.addClass("updater_small_item enabled")
								.attr("title", "Auto reload")
							)
							.append(
								style.e("span", "updater_difference updater_small_item hidden")
								.append(
									style.e("span", "updater_difference_added updater_counts hidden")
									.append(
										style.e("span", "updater_counts_inner")
										.append(
											style.e("span", "updater_counts_posts hidden")
										)
										.append(
											style.e("span", "updater_counts_images hidden")
										)
									)
								)
								.append(
									style.e("span", "updater_difference_removed updater_counts hidden")
									.append(
										style.e("span", "updater_counts_inner")
										.append(
											style.e("span", "updater_counts_posts hidden")
										)
										.append(
											style.e("span", "updater_counts_images hidden")
										)
									)
								)
							)
							.append(
								(this.small_countdown = style.e("a", "updater_countdown updater_small_item"))
								.attr("title", "Update now")
								.append(
									(s_progress_bar = style.e("div", "updater_progress"))
									.append(
										style.e("div", "updater_progress_inner")
									)
								)
								.append(
									(this.small_countdown_text = style.e("span", "updater_countdown_suffix"))
								)
							)
							.append(
								(s_totals = style.e("span", "updater_counts updater_totals updater_small_item hidden"))
								.append(
									style.e("span", "updater_counts_inner")
									.append(
										style.e("span", "updater_counts_posts")
									)
									.append(
										style.e("span", "updater_counts_images hidden")
									)
								)
							)
						) //}
					);

					// More data
					this.progress_bars = s_progress_bar;

					// Status updates
					this_private.set_value.call(this, this.totals, false, 0);
					this_private.set_value.call(this, this.totals, true, 0);
					this_private.reset_counts.call(this);
					this_private.update_countdown_status.call(this);

					// Events
					var data = { self: this };
					var g_data = { self: this, grabber: s_totals, header_container: content.header.container, header_options: content.header.container.find(".header_options") };

					s_enabled.find("input").on("change", data, this_private.on_enabler_click);
					this.small_countdown.on("click", data, this_private.on_countdown_click);

					s_totals.on("mousedown", g_data, this_private.on_grabber_mousedown);
					$(window)
					.on("mouseup", g_data, this_private.on_window_mouseup)
					.on("mousemove", g_data, this_private.on_window_mousemove)
					.on("resize", { self: this, timer: null }, this_private.on_window_resize);

					// Position
					if (this.position.in_header) {
						this.position.in_header = false;
						this.set_in_header(true, true, true);
					}
					this.set_position(this.position.x, this.position.y, true, true);
				},

				on_enabler_click: function (event) {
					if (event.data.self.auto_enabled()) {
						this_private.disable_auto.call(event.data.self);
					}
					else {
						this_private.enable_auto.call(event.data.self);
					}

					// Change
					var en = event.data.self.auto_enabled();
					if (en != $(this).is(":checked")) {
						$(this).prop("checked", en);
					}
				},
				on_countdown_click: function (event) {
					if (event.which != 1) return true;

					if (!event.data.self.first_load) {
						event.data.self.update(true);
					}

					return false;
				},
				on_grabber_mousedown: function (event) {
					if (event.which != 1) return true;

					event.data.self.moving.active = true;

					var o = event.data.self.container.offset();
					event.data.self.moving.offset.x = event.pageX - o.left;
					event.data.self.moving.offset.y = event.pageY - o.top;

					return false;
				},
				on_window_mouseup: function (event) {
					if (event.data.self.moving.active) {
						event.data.self.moving.active = false;

						// Save position
						this_private.save_position.call(event.data.self);
					}
				},
				on_window_mousemove: function (event) {
					if (event.data.self.moving.active) {
						var x = event.pageX - event.data.self.moving.offset.x - $(this).scrollLeft();
						var y = event.pageY - event.data.self.moving.offset.y - $(this).scrollTop();

						// Check if hovering over the header
						var o1 = event.data.header_container.offset();
						var o2 = event.data.header_options.offset();
						var w = event.data.header_options.width();
						var h = event.data.header_container.height();
						var self_w = (event.data.self.is_in_header() ? 0 : event.data.self.container.outerWidth());
						event.data.self.set_in_header(
							event.pageY >= o1.top && event.pageY < o1.top + h &&
							event.pageX >= o2.left - self_w && event.pageX < o2.left + w,
							true,
							true
						);

						// Position
						event.data.self.set_position(x, y, false, true);
					}
				},
				on_window_resize: function (event) {
					var ev_data = event.data;
					if (ev_data.self.container != null) {
						ev_data.self.set_position(ev_data.self.position.x, ev_data.self.position.y, true, true);

						// Save
						if (ev_data.timer !== null) {
							clearTimeout(ev_data.timer);
						}
						ev_data.timer = setTimeout(function () {
							ev_data.timer = null;
							// Save position
							this_private.save_position.call(ev_data.self);
						}, 100);
					}
				},

				set_thread: function (thread) {
					this.thread = thread;

					if (this.thread.locked) {
						this_private.disallow_auto.call(this);
					}
					else {
						this_private.allow_auto.call(this);
					}
				},

				thread_loaded_first: function () {
					// Completed initial load
					this.first_load = false;
					this.loader_parsing = false;

					// Start timer if threads should start off with auto reload
					if (this.auto_start) {
						this_private.enable_auto.call(this);
					}
				},
				thread_deleted: function () {
					// Disable
					this_private.disable_auto.call(this);
					this_private.disallow_auto.call(this);

					// Signal 404'd
					new xch.Message({
						type: "info",
						title: "Thread 404'd",
						text: "This thread no longer exists"
					});

					// Change title
					this.status_monitor.alive = false;
					this_private.update_status_favicon.call(this);
				},
				thread_updated: function (state_old) {
					if (state_old.locked != this.thread.locked) {
						if (this.thread.locked) {
							// Disable
							this_private.disable_auto.call(this);
							this_private.disallow_auto.call(this);

							// Message
							new xch.Message({
								type: "info",
								title: "Thread Locked",
								text: "This thread is now locked"
							});
						}
						else {
							this_private.allow_auto.call(this);

							// Message
							new xch.Message({
								type: "info",
								title: "Thread Unlocked",
								text: "This thread is now unlocked"
							});
						}
					}
					if (state_old.sticky != this.thread.sticky) {
						// Update totals (limits may have been changed)
						this_private.set_value.call(this, this.totals, false, this.totals.posts);
						this_private.set_value.call(this, this.totals, true, this.totals.images);

						// Message
						if (this.thread.sticky) {
							new xch.Message({
								type: "info",
								title: "Thread Stickied",
								text: "This thread is now a sticky"
							});
						}
						else {
							new xch.Message({
								type: "info",
								title: "Thread Unstickied",
								text: "This thread is no longer a sticky"
							});
						}
					}
				},

				enable_auto: function () {
					// Ignore if not allowed or already enabled
					if (!this.auto_reload_allowed || this.auto_reload_enabled || this.first_load) return;

					// Enable
					this.auto_reload_enabled = true;

					// Reset countdown settings
					this_private.reset_countdown_time.call(this, this.countdown_settings.reset_on_auto_enable);

					// Start timer if no loader is running
					if (this.loader == null || (this.loader_parsing && !this.countdown_start_after_parse)) {
						this_private.start_countdown_timer.call(this);
					}

					// Checked
					this.container.find(".checkbox.enabled input").prop("checked", true);
				},
				disable_auto: function () {
					if (!this.auto_reload_enabled) return;

					// Disable
					this.auto_reload_enabled = false;

					// Stop timer
					this_private.stop_countdown_timer.call(this);

					// Unchecked
					this.container.find(".checkbox.enabled input").prop("checked", false);
				},
				allow_auto: function () {
					this.auto_reload_allowed = true;

					this.container.find(".checkbox.enabled").removeClass("hidden");
				},
				disallow_auto: function () {
					this.auto_reload_allowed = false;

					this.container.find(".checkbox.enabled").addClass("hidden");

					// Disable
					this_private.disable_auto.call(this);
				},

				start_countdown_timer: function () {
					// Clear timer
					if (this.countdown.timer !== null) {
						clearInterval(this.countdown.timer);
					}

					// Set the timer
					if (this.countdown.time_last === null) {
						this_private.reset_countdown_time.call(this, Updater.RESET_ALWAYS);
					}
					this.countdown.time = this.countdown.time_last;
					this.countdown.ready = false;

					// Begin the timer
					var self = this;
					this.countdown.timer = setInterval(function () {
						this_private.countdown_timer_tick.call(self);
					}, 1000);

					// Update status
					this_private.update_countdown_status.call(this);
				},
				stop_countdown_timer: function () {
					// Clear timer
					if (this.countdown.timer !== null) {
						clearInterval(this.countdown.timer);
						this.countdown.timer = null;
					}

					this.countdown.time = 0;
					this.countdown.ready = false;

					// Update status
					this_private.update_countdown_status.call(this);
				},
				countdown_timer_tick: function () {
					// Time change
					if (--this.countdown.time <= 0) {
						// Clear timer
						if (this.countdown.timer !== null) {
							clearInterval(this.countdown.timer);
							this.countdown.timer = null;
						}

						// Update
						this.countdown.ready = true;
						this.update(false);
					}
					else {
						this.small_countdown.addClass("counting");
						this.small_countdown_text.text(this.countdown.time);
					}
				},
				update_countdown_time: function () {
					var cds = (this.thread_changed ? this.countdown_settings.decrease : this.countdown_settings.increase);

					// Change count
					if (this.countdown.last_changed == this.thread_changed) {
						++this.countdown.last_changed_count;
					}
					else {
						this.countdown.last_changed = this.thread_changed;
						this.countdown.last_changed_count = 1;
					}

					// Change timer
					if (!this.manual_updating || cds.manual) {
						if (this.countdown.last_changed_count >= cds.count_first) {
							var c = this.countdown.last_changed_count - cds.count_first;
							if ((c % cds.count) == 0) {
								// Change
								if (this.thread_changed) {
									// Decrease
									this.countdown.time_last = (cds.amount < 0 ?
										this.countdown_settings.minimum :
										Math.max(this.countdown_settings.minimum, this.countdown.time_last - cds.amount));
								}
								else {
									// Increase
									this.countdown.time_last = (cds.amount < 0 ?
										this.countdown_settings.maximum :
										Math.min(this.countdown_settings.maximum, this.countdown.time_last + cds.amount));
								}
							}
						}
					}
				},
				reset_countdown_time: function (reset_setting) {
					// Ignore
					if (reset_setting == Updater.RESET_NEVER) return;

					// Check for change
					var change, target_time = this.countdown_settings.initial;

					if (this.countdown.time_last === null) {
						change = true;
					}
					else {
						if (target_time > this.countdown.time_last) {
							change = ((reset_setting & Updater.RESET_IF_INCREASES) != 0);
						}
						else {
							change = ((reset_setting & Updater.RESET_IF_DECREASES) != 0);
						}
					}

					// Set
					if (change) {
						this.countdown.time_last = target_time;
						this.countdown.last_changed = false;
						this.countdown.last_changed_count = 0;
					}
				},

				update_countdown_status: function () {
					if (this.auto_reload_enabled) {
						if (this.countdown.timer === null) {
							// Ajax or parsing
							this.small_countdown.removeClass("counting");
							this.small_countdown_text.text("...");
						}
						else {
							// Timer
							this.small_countdown.addClass("counting");
							this.small_countdown_text.text(this.countdown.time);
						}
					}
					else {
						if (this.loader == null) {
							// Not activated
							this.small_countdown.removeClass("counting");
							this.small_countdown_text.text("up");
						}
						else {
							// Loading something
							this.small_countdown.removeClass("counting");
							this.small_countdown_text.text("...");
						}
					}
				},

				reset_counts: function () {
					this_private.set_value.call(this, this.change.added, false, 0);
					this_private.set_value.call(this, this.change.added, true, 0);
					this_private.set_value.call(this, this.change.removed, false, 0);
					this_private.set_value.call(this, this.change.removed, true, 0);
				},

				create_loader_events: function () {
					var self = this;
					this.loader_events = {
						load: function (event) { return this_private.on_loader_load.call(self, event, this); },
						error: function (event) { return this_private.on_loader_error.call(self, event, this); },
						complete: function (event) { return this_private.on_loader_complete.call(self, event, this); },
						progress: function (event) { return this_private.on_loader_progress.call(self, event, this); },
						status_change: function (event) { return this_private.on_loader_status_change.call(self, event, this); }
					};
				},
				create_loader: function () {
					// Clear error, indicate loading
					this.small_countdown.addClass("loading").removeClass("error");

					// Initial settings for load
					this.thread_changed = false;
					this.loader_parsing = false;

					// Create
					this_private.create_loader_events.call(this);
					this.loader = xch.Loader.get_thread(
						this.thread.board,
						this.thread.id,
						null,
						this.loader_events
					);
				},
				bind_to_loader: function (loader) {
					var self = this;

					// Clear error, indicate loading
					this.small_countdown.addClass("loading").removeClass("error");

					// Initial settings for load
					this.thread_changed = false;
					this.loader_parsing = false;

					// Bind
					this_private.create_loader_events.call(this);
					this.loader = loader;

					// Events
					for (var event in this.loader_events) {
						this.loader.on(event, this.loader_events[event]);
					}
				},

				on_loader_load: function (event, loader) {
					// Now parsing
					this.loader_parsing = true;

					// Timer
					if (this.auto_reload_enabled && !this.countdown_start_after_parse) {
						// Start reload timer
						this_private.start_countdown_timer.call(this);
					}

					// Update status
					this_private.update_countdown_status.call(this);
				},
				on_loader_error: function (event, loader) {
					// Add error class
					this.small_countdown.addClass("error");

					// Signal error
					if (this.error_message != null) {
						this.error_message.close();
					}
					this.error_message = new xch.Message({
						type: "error",
						title: "Updater Error",
						text: event.reason,
						on: {
							close: {
								callback_data: this,
								callback: this_private.on_error_message_close
							}
						}
					});
				},
				on_loader_complete: function (event, loader) {
					// Nullify loader
					this.loader = null;
					this.loader_parsing = false;
					this.loader_events = null;

					// Progress bar
					this.small_countdown.removeClass("loading");

					// Next
					if (this.auto_reload_enabled) {
						// Update timing settings here
						this_private.update_countdown_time.call(this);

						if (this.countdown.ready) {
							// Next update
							this.update();
						}
						else {
							// Start reload timer
							this_private.start_countdown_timer.call(this);
						}
					}

					// Update status
					this_private.update_countdown_status.call(this);
				},
				on_loader_progress: function (event, loader) {
					// Update percent
					this.progress_bars.children().css("width", (event.ratio * 100).toFixed(2) + "%");
				},
				on_loader_status_change: function (event, loader) {
					// Update styling of the progress bars
					switch (loader.status) {
						case xch.Loader.status.NOT_RUNNING:
						case xch.Loader.status.AJAX:
						case xch.Loader.status.ERROR:
						{
							this.progress_bars
							.removeClass("ajax parse")
							.children()
								.removeClass("parse")
								.addClass("ajax")
								.css("width", (loader.ajax_progress * 100).toFixed() + "%");
						}
						break;
						case xch.Loader.status.THREAD_DELETED:
						case xch.Loader.status.PARSE_WAITING:
						case xch.Loader.status.PARSING:
						{
							this.progress_bars
							.removeClass("parse")
							.addClass("ajax")
							.children()
								.removeClass("ajax")
								.addClass("parse")
								.css("width", (loader.parse_progress * 100).toFixed() + "%");
						}
						break;
						case xch.Loader.status.COMPLETE:
						{
							this.progress_bars
							.removeClass("ajax")
							.addClass("parse")
							.children()
								.removeClass("ajax parse")
								.css("width", "0%");
						}
						break;
					}
				},

				on_error_message_close: function (event, self) {
					self.error_message = null;
				},

				increment_value: function (target, images, count) {
					this_private.set_value.call(this, target, images, target[images ? "images" : "posts"] + count);
				},
				set_value: function (target, images, value) {
					// Set value
					if (value < 0) value = 0;
					target[images ? "images" : "posts"] = value;

					// Update display
					if (target == this.totals) {
						var limits = this.limits[(this.thread && this.thread.sticky) ? "sticky" : "normal"];

						var c1 = this.container.find(".updater_totals");
						c1.removeClass("hidden");
						if (images) {
							var c2 = c1.find(".updater_counts_images");
							if (value > 0) c2.removeClass("hidden");
							else c2.addClass("hidden");
							c2.text(value);
							if (value > limits.images && limits.images > 0) {
								c2.addClass("limit");
							}
							else {
								c2.removeClass("limit");
							}
						}
						else {
							var c2 = c1.find(".updater_counts_posts");
							c2.text(value);

							if (value > limits.posts && limits.posts > 0) {
								c2.addClass("limit");
							}
							else {
								c2.removeClass("limit");
							}
						}

						// Alt title
						var alt_title = "Thread contains " +
							(target.posts == 0 ? "no" : target.posts) + " post" + (target.posts == 1 ? "" : "s") +
							" and " + (target.images == 0 ? "no" : target.images) + " image" + (target.images == 1 ? "" : "s");

						if (target.posts > limits.posts && limits.posts > 0) alt_title += " / Bump limit reached";
						if (target.images > limits.images && limits.images > 0) alt_title += " / Image limit reached";

						c1.attr("title", alt_title);
					}
					else {
						var c1 = this.container.find(".updater_difference");
						if (
							value > 0 ||
							this.change.added.posts > 0 || this.change.added.images > 0 ||
							this.change.removed.posts > 0 || this.change.removed.images > 0
						) {
							c1.removeClass("hidden");
						}
						else {
							c1.addClass("hidden");
						}

						var c2 = c1.find(target == this.change.added ? ".updater_difference_added" : ".updater_difference_removed");
						if (target.posts > 0 || target.images > 0) {
							c2.removeClass("hidden");
						}
						else {
							c2.addClass("hidden");
						}

						var c3 = c2.find(images ? ".updater_counts_images" : ".updater_counts_posts");
						if (value > 0) {
							c3.removeClass("hidden");
						}
						else {
							c3.addClass("hidden");
						}
						c3.text(value);

						// Alt title
						var alt_title = "";
						if (target.posts > 0) {
							alt_title += target.posts + " post" + (target.posts == 1 ? "" : "s");
						}
						if (target.images > 0) {
							alt_title += (target.posts == 0 ? "" : " and ") + target.images + " image" + (target.images == 1 ? "" : "s");
						}
						if (alt_title.length > 0) {
							alt_title += (target == this.change.added ? " added" : " removed") + " in the last update";
						}

						c2.attr("title", alt_title);
					}
				},

				update_status_posts_read: function () {
					// Ignore
					if (this.thread == null) return;

					// Check for posts read
					var win = $(window);
					var area = content.header.get_screen_area();
					//area.left += win.scrollLeft();
					area.top += win.scrollTop();
					var bottom = area.top + area.height;

					var p_count = this.thread.posts.length;
					var c, offset, height, i, change = 0, me_ref_change = false;
					for (i = this.status_monitor.posts_read; i < p_count; ++i) {
						// Not loaded yet
						if (!this.thread.posts[i].loaded()) break;

						c = this.thread.posts[i].instances[0].container.children(".post");
						offset = c.offset();
						height = c.outerHeight();

						if (offset.top + height <= bottom) {
							if (this.status_monitor.nearest_reference_to_me == this.thread.posts[i]) {
								// Change
								this.status_monitor.nearest_reference_to_me = null;
								me_ref_change = true;
							}
							++change
						}
						else {
							break;
						}
					}
					if (change > 0) {
						// To-me changing
						if (me_ref_change) {
							for (; i < p_count; ++i) {
								// Not loaded yet
								if (!this.thread.posts[i].loaded()) break;

								if (this.thread.posts[i].references_me()) {
									// New post referencing me
									this.status_monitor.nearest_reference_to_me = this.thread.posts[i];
									me_ref_change = false;
									break;
								}
							}
						}

						// Update
						var any_unread = (this.status_monitor.total_posts == this.status_monitor.posts_read);
						this.status_monitor.posts_read += change;
						this_private.update_status_title.call(this);
						// Favicon update
						if (any_unread != (this.status_monitor.total_posts == this.status_monitor.posts_read) || me_ref_change) {
							this_private.update_status_favicon.call(this);
						}
					}
				},

				update_status_add_post: function (post) {
					++this.status_monitor.total_posts;
					if (this.status_monitor.posts_read == 0) {
						// Indicate OP as read
						++this.status_monitor.posts_read;
					}

					// Check if post is read
					if (this.status_monitor.posts_read == post.t_id) {
						this_private.update_status_posts_read.call(this);
					}
				},

				update_status_favicon: function () {
					var favicon = info.favicons;
					favicon = (this.status_monitor.alive ? favicon.alive : favicon.dead);

					if (this.status_monitor.posts_read == this.status_monitor.total_posts) {
						// Default
						favicon = favicon.standard;
					}
					else {
						// Unread
						favicon = (this.status_monitor.nearest_reference_to_me == null ? favicon.new_post : favicon.new_post_to_me);
					}

					// Set favicon
					content.set_favicon(favicon);
				},
				update_status_title: function () {
					// Title formatting
					var data = {
						read: this.status_monitor.posts_read,
						replies: Math.max(0, this.status_monitor.total_posts - 1),
						unread: 0
					};
					data.unread = data.replies - (data.read - 1);
					var pre = xch.format_string(this.title.prefix, data);
					var suf = xch.format_string(this.title.suffix, data);
					content.format_title(null, pre, suf);
				}

			};

			Updater.prototype = {

				constructor: Updater,

				update: function (manual) {
					if (this.loader != null) return;

					// Reset countdown settings
					if (manual) {
						if (this.auto_enabled()) {
							this_private.reset_countdown_time.call(this, this.countdown_settings.reset_on_manual_if_auto_enabled);
						}
						else {
							this_private.reset_countdown_time.call(this, this.countdown_settings.reset_on_manual_if_auto_disabled);
						}
					}

					// Clear timer
					if (this.countdown.timer !== null) {
						clearInterval(this.countdown.timer);
						this.countdown.timer = null;
					}
					this.countdown.ready = false;

					// Manual
					this.manual_updating = manual;

					// Count reset
					this_private.reset_counts.call(this);

					// Create loader
					this_private.create_loader.call(this);

					// Run
					this.loader.run();

					// Update status
					this_private.update_countdown_status.call(this);
				},
				update_from_loader: function (loader, pre_run_callback) {
					// Negate other loader
					if (this.loader != null) {
						// Remove events
						if (this.loader_events != null) {
							for (var event in this.loader_events) {
								this.loader.off(event, this.loader_events[event]);
							}
							this.loader_events = null;
						}

						// Ignore
						this.loader = null;
					}

					// Clear timer
					if (this.countdown.timer !== null) {
						clearInterval(this.countdown.timer);
						this.countdown.timer = null;
					}
					this.countdown.ready = false;

					// Manual
					this.manual_updating = true;

					// Count reset
					this_private.reset_counts.call(this);

					// Bind to loader
					this_private.bind_to_loader.call(this, loader);

					// Function call
					if (pre_run_callback) {
						pre_run_callback.call(this, this, loader);
					}

					// Run
					this.loader.run();

					// Update status
					this_private.update_countdown_status.call(this);
				},

				auto_enabled: function () {
					return this.auto_reload_enabled;
				},

				set_position: function (x, y, no_anchor_updates, no_save) {
					this.position.x = x;
					this.position.y = y;

					if (this.container != null) {
						if (this.position.in_header) {
							this.container.css({
								left: "",
								top: "",
								bottom: "",
								right: ""
							});
						}
						else {
							var bounds = content.header.get_screen_area();
							var size = {
								w: this.container.outerWidth(),
								h: this.container.outerHeight()
							};

							// Bounds updating
							if (!no_anchor_updates || this.position.anchor.x == 0) {
								this.position.anchor.x = 0;
								if (x + size.w > bounds.left + bounds.width - this.anchor_border_size) {
									this.position.anchor.x = 1;
								}
								if (x < bounds.left + this.anchor_border_size) {
									this.position.anchor.x = -1;
								}
							}

							if (!no_anchor_updates || this.position.anchor.y == 0) {
								this.position.anchor.y = 0;
								if (y + size.h > bounds.top + bounds.height - this.anchor_border_size) {
									this.position.anchor.y = 1;
								}
								if (y < bounds.top + this.anchor_border_size) {
									this.position.anchor.y = -1;
								}
							}

							// Position
							if (this.position.anchor.x == 0) {
								this.container.css("left", x + "px").css("right", "");
							}
							else if (this.position.anchor.x == -1) {
								this.container.css("left", bounds.left + "px").css("right", "");
							}
							else {
								this.container.css("right", ($(window).width() - (bounds.left + bounds.width)) + "px").css("left", "");
							}

							if (this.position.anchor.y == 0) {
								this.container.css("top", y + "px").css("bottom", "");
							}
							else if (this.position.anchor.y == -1) {
								this.container.css("top", bounds.top + "px").css("bottom", "");
							}
							else {
								this.container.css("bottom", ($(window).height() - (bounds.top + bounds.height)) + "px").css("top", "");
							}
						}
					}

					if (!no_save) {
						this_private.save_position.call(this);
					}
				},

				set_in_header: function (in_header, dont_set_position, no_save) {
					if (this.position.in_header != in_header) {
						this.position.in_header = in_header;

						if (in_header) {
							content.header.container.find(".header_options").prepend(this.container);
							this.container.addClass("header_option no_link embedded");
							if (!dont_set_position) this.set_position(this.position.x, this.position.y, true, true);
						}
						else {
							content.floating_container.append(this.container);
							this.container.removeClass("header_option no_link embedded");
							if (!dont_set_position) this.set_position(this.position.x, this.position.y, true, true);
						}

						if (!no_save) {
							this_private.save_position.call(this);
						}
						return true;
					}
					return false;
				},

				is_in_header: function () {
					return this.position.in_header;
				}

			};

			Updater.RESET_NEVER = 0;
			Updater.RESET_IF_INCREASES = 1;
			Updater.RESET_IF_DECREASES = 2;
			Updater.RESET_ALWAYS = 3;

			return Updater;

		})(),

		// Loader
		Loader: (function () {

			var Loader = function (board, thread) {
				this.board = board;
				this.thread = thread;
				this.posts_total = 0;
				this.posts_loaded = 0;
				this.ajax_progress = 0.0;
				this.parse_progress = 0.0;
				this.status = Loader.status.NOT_RUNNING;
				this.context = null;

				this.source = null;

				this.events = {
					load: [], // ajax-load
					progress: [], // take into account ajax-progress and parsing-progress
					error: [], // ajax-error

					thread_ready: [], // indicate a new thread
					thread_load: [], // thread loaded
					thread_delete: [], // thread 404
					post_load: [], // post loaded
					complete: [], // parsing complete

					status_change: [] // status change
				};
			};

			var this_private = {

				html_load: function (html) {
					// Status
					this_private.status_change.call(this, Loader.status.PARSE_WAITING);

					// Create context
					var new_info = new xch.Information(null, html);
					this.context = new xch.Content.Context({
						info: new_info,
						html: html,
						post_queue: (xch.settings.parsing_group.use_single ? content.main_context.post_queue : null),
						html_target: content.main_context.html,
						stylize: true,
						is_new: false,
						loader: this
					});

					// Enable events
					content.on("thread_ready", this_private.on_thread_ready, this);
					content.on("thread_load", this_private.on_thread_load, this);
					content.on("thread_delete", this_private.on_thread_delete, this);
					content.on("post_load", this_private.on_post_load, this);
					content.on("complete", this_private.on_complete, this);

					// Parse
					content.parse(this.context);
				},

				complete: function () {
					// Trigger complete
					if (this.status != Loader.status.COMPLETE) {
						// Error
						this_private.trigger.call(this, "complete", {
							good: false
						});
					}

					// Remove from active
					for (var i = 0, j = Loader.active_loaders.length; i < j; ++i) {
						if (this == Loader.active_loaders[i]) {
							Loader.active_loaders.splice(i, 1);
							break;
						}
					}

					// Clear events
					this.events = [];

					// Disable event listening
					if (this.context != null) {
						content.off("thread_ready", this_private.on_thread_ready);
						content.off("thread_load", this_private.on_thread_load);
						content.off("thread_delete", this_private.on_thread_delete);
						content.off("post_load", this_private.on_post_load);
						content.off("complete", this_private.on_complete);
						this.context = null;
					}

					// Not running
					this.new_content = null;
				},

				on_thread_ready: function (event, self) {
					if (event.context != self.context) return;

					// Increment total post count
					self.posts_total += event.thread_context.posts_total;

					// Trigger thread_new event
					this_private.trigger.call(self, "thread_ready", {
						thread: event.thread
					});
				},
				on_thread_load: function (event, self) {
					if (event.context != self.context) return;

					// Trigger thread_new event
					this_private.trigger.call(self, "thread_load", {
						thread: event.thread
					});
				},
				on_thread_delete: function (event, self) {
					if (event.context != self.context) return;

					// Trigger thread_new event
					this_private.trigger.call(self, "thread_delete", {
						thread: event.thread
					});
				},
				on_post_load: function (event, self) {
					if (event.context != self.context) return;

					// Change status
					if (self.status = Loader.status.PARSE_WAITING) {
						this_private.status_change.call(self, Loader.status.PARSING);
					}

					// Increment posts loaded
					self.posts_loaded += 1;

					// Progress
					self.parse_progress = self.posts_loaded / self.posts_total;
					this_private.trigger.call(self, "progress", {
						type: "parse",
						ratio: self.parse_progress,
						loaded: self.posts_loaded,
						total: self.posts_total
					});
					// Trigger event
					this_private.trigger.call(self, "post_load", {
						post: event.post
					});
				},
				on_complete: function (event, self) {
					if (event.context != self.context) return;

					// Event
					this_private.trigger.call(self, "complete", {
						good: true
					});
					// Status
					this_private.status_change.call(self, Loader.status.COMPLETE);
					// Complete
					this_private.complete.call(self);
				},

				ajax_on_load: function (event) {
					// Full ajax progress
					event.data.loader.ajax_progress = 1.0;

					// Events
					if (event.okay) {
						// Get html
						var html;
						if (event.data.loader.source == null) {
							// Parse response
							html = xch.string_to_dom(event.response);
						}
						else {
							html = event.data.loader.source.html;
							event.data.loader.source.html = null;
						}
						// Check
						if (html != null && (html = $(html)).length > 0) {
							var error;
							if ((error = content.check_html_for_error(html)) !== null) {
								// Remove last "."
								if (error[error.length - 1] == "." && error.substr(-2) != "..") {
									error = error.substr(0, error.length - 1);
								}

								// Response error
								this_private.trigger.call(event.data.loader, "error", {
									type: "response",
									reason: error
								});
								this_private.status_change.call(event.data.loader, Loader.status.ERROR);
								this_private.complete.call(event.data.loader);
							}
							else {
								// Okay
								this_private.trigger.call(event.data.loader, "load", {
									html: html
								});
								// Parse
								this_private.html_load.call(event.data.loader, html);
							}
						}
						else {
							// Bad
							this_private.trigger.call(event.data.loader, "error", {
								type: "parse",
								reason: "Could not parse the response"
							});
							this_private.status_change.call(event.data.loader, Loader.status.ERROR);
							this_private.complete.call(event.data.loader);
						}
					}
					else {
						if (event.status == 404) {
							// Mark thread as dead
							content.thread_delete(event.data.loader.board, event.data.loader.thread);
							this_private.status_change.call(event.data.loader, Loader.status.THREAD_DELETED);
							this_private.complete.call(event.data.loader);
						}
						else {
							// Error
							this_private.trigger.call(event.data.loader, "error", {
								type: "status",
								reason: "Expected ajax status 200, but received " + event.status
							});

							this_private.status_change.call(event.data.loader, Loader.status.ERROR);
							this_private.complete.call(event.data.loader);
						}
					}
				},
				ajax_on_progress: function (event) {
					// Progress
					event.data.loader.ajax_progress = (event.event.loaded / event.event.total);
					this_private.trigger.call(event.data.loader, "progress", {
						type: "ajax",
						ratio: event.data.loader.ajax_progress,
						loaded: event.event.loaded,
						total: event.event.total
					});
				},
				ajax_on_error: function (event) {
					// Error
					this_private.trigger.call(event.data.loader, "error", {
						type: "error",
						reason: "Ajax request error"
					});
					this_private.status_change.call(event.data.loader, Loader.status.ERROR);
					this_private.complete.call(event.data.loader);
				},
				ajax_on_abort: function (event) {
					// Error
					this_private.trigger.call(event.data.loader, "error", {
						type: "abort",
						reason: "Ajax request aborted"
					});
					this_private.status_change.call(event.data.loader, Loader.status.ERROR);
					this_private.complete.call(event.data.loader);
				},

				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					for (var i = 0; i < e.length; ++i) {
						e[i][0].call(this, data, e[i][1], event);
					}
				},

				status_change: function (status) {
					var s = this.status;
					this.status = status;
					this_private.trigger.call(this, "status_change", {
						old_status: s,
						new_status: this.status
					});
				}

			};

			Loader.prototype = {

				constructor: Loader,

				run: function () {
					// Only run if not running
					if (this.status != Loader.status.NOT_RUNNING) return false;
					this_private.status_change.call(this, Loader.status.AJAX);

					// Run ajax
					if (this.source == null) {
						// New call
						xch.ajax({
							url: info.create_url.to_thread(this.board, this.thread),
							method: "GET",
							return_type: "text",
							on: {
								load: this_private.ajax_on_load,
								progress: this_private.ajax_on_progress,
								error: this_private.ajax_on_error,
								abort: this_private.ajax_on_abort
							},
							loader: this
						});
					}
					else {
						// Call from source event
						this.source.ajax_data.loader = this;

						// Trigger event
						this_private.ajax_on_load.call(this.source.ajax_data, this.source.event);
					}
					return true;
				},
				running: function () {
					return (this.status != Loader.status.NOT_RUNNING);
				},
				on: function (event, callback, callback_data) {
					if (event in this.events) {
						this.events[event].push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						// Check for callback
						var e = this.events[event];
						for (var i = 0; i < e.length; ++i) {
							if (e[i][0] == callback) {
								// Remove
								e.splice(i, 1);
								break;
							}
						}
					}
				}

			};

			Loader.status = {
				NOT_RUNNING: 0,
				AJAX: 1,
				ERROR: 2,
				PARSE_WAITING: 3,
				PARSING: 4,
				COMPLETE: 5
			};

			Loader.active_loaders = [];

			Loader.get_thread_from_ajax_load = function (board, thread, pre_event_hook, events, ajax_data, ajax_on_load_event, ajax_html) {
				// Check if it exists
				var loader, found = false;
				for (var i = Loader.active_loaders.length - 1; i >= 0; --i) {
					if (
						Loader.active_loaders[i].thread == thread &&
						Loader.active_loaders[i].board == board &&
						Loader.active_loaders[i].status == Loader.status.NOT_RUNNING && // must also not have been executed yet
						Loader.active_loaders[i].source == null // and have no source
					) {
						found = true;
						loader = Loader.active_loaders[i];
						break;
					}
				}

				// Create if it doesn't
				if (!found) {
					// Create
					loader = new Loader(board, thread);
					Loader.active_loaders.push(loader);
				}

				// Set source
				loader.source = {
					ajax_data: ajax_data,
					event: ajax_on_load_event,
					html: ajax_html
				};

				// Event check
				if (!pre_event_hook || pre_event_hook.call(loader, loader)) {

					// Add callbacks
					for (var event in events) {
						loader.on(event, events[event]);
					}

				}

				// Return
				return loader;
			};

			Loader.get_thread = function (board, thread, pre_event_hook, events) {
				// Check if it exists
				var loader, found = false;
				for (var i = Loader.active_loaders.length - 1; i >= 0; --i) {
					if (Loader.active_loaders[i].thread == thread && Loader.active_loaders[i].board == board) {
						found = true;
						loader = Loader.active_loaders[i];
						break;
					}
				}

				// Create if it doesn't
				if (!found) {
					// Create
					loader = new Loader(board, thread);
					Loader.active_loaders.push(loader);
				}

				// Event check
				if (!pre_event_hook || pre_event_hook.call(loader, loader)) {

					// Add callbacks
					for (var event in events) {
						loader.on(event, events[event]);
					}

				}

				// Return
				return loader;
			};

			return Loader;

		})(),


		// Messages
		Message: (function () {

			var Messenger = function () {
				this.container = null;

				this.default_message_life = 10;

				this.spacing = {
					from_top: 10,
					from_message: 8,
					from_minimized: 8
				};

				this.messages = [];

				this.paused = false;

				this.init();

				var data = { self: this };
				$(window)
				.on("blur", data, this.on_window_blur)
				.on("focus", data, this.on_window_focus);
			};

			Messenger.prototype = {

				constructor: Messenger,

				init: function () {
					this.container = style.e("div", "message_container");
					if (content && content.floating_container) {
						content.floating_container.append(this.container);
					}
				},

				on_window_blur: function (event) {
					event.data.self.pause_all();
				},
				on_window_focus: function (event) {
					event.data.self.resume_all();
				},

				pause_all: function () {
					this.paused = true;

					for (var i = 0; i < this.messages.length; ++i) {
						this_private.pause.call(this.messages[i]);
					}
				},
				resume_all: function () {
					this.paused = false;

					for (var i = 0; i < this.messages.length; ++i) {
						this.messages[i].set_lifetime(this.messages[i].life);
					}
				}

			};

			var messenger = null;



			var Message = function (params) {
				// Create a messenger
				if (messenger == null) messenger = new Messenger();

				// Events
				this.events = {
					close: {
						triggering: false,
						callbacks: [],
						removals: null
					}
				};

				// Data
				this.container = null;
				this.timer_display = null;
				this.life = 0;
				this.life_countdown = null;
				this.closeable = true;
				this.minimized = false;

				// Init
				this_private.init.call(this, params);
			};

			var this_private = {

				init: function (params) {
					var data = { self: this };

					this.container = style.e("div", "message");
					this.container.append(style.e("div", "message_background"));
					var inner = style.e("div", "message_inner");
					this.container.append(inner);

					// Style
					if ("type" in params) {
						if (params.type == "error") this.container.addClass("error");
						else if (params.type == "good") this.container.addClass("good");
						else if (params.type == "okay") this.container.addClass("okay");
						else if (params.type == "parse") this.container.addClass("parse");
						else if (params.type == "info") this.container.addClass("info");
						else this.container.addClass("plain");
					}
					else {
						this.container.addClass("plain");
					}

					// Title
					if ("title" in params) {
						inner.append(
							style.e("div", "message_title message_shadow")
							.text(params.title)
						);
					}

					// Content
					if ("html" in params) {
						inner.append(
							params.html.addClass("message_body")
						);
					}
					else if ("text" in params) {
						inner.append(
							style.e("div", "message_body")
							.text(params.text)
						);
					}

					// Events
					if ("on" in params) {
						for (var ev in params.on) {
							if (params.on[ev] instanceof Function) {
								this.on(ev, params.on[ev], undefined);
							}
							else {
								this.on(ev, params.on[ev].callback, params.on[ev].callback_data);
							}
						}
					}

					// Close button
					inner.append(
						style.e("div", "message_buttons message_hover_shadow")
						.append(
							style.e("span", "message_button close")
							.on("click", data, this_private.on_close_minimize_click)
						)
						.append(
							(this.timer_display = style.e("span", "message_timer"))
						)
					);

					// Timer
					this.set_closeable("closeable" in params ? params.closeable : true);
					this.set_lifetime("life" in params ? params.life || 0 : (this.closeable ? messenger.default_message_life : 0));
					if (messenger.paused) this_private.pause.call(this);

					// Events
					this.container.on("click", data, this_private.on_message_click);

					// Add
					messenger.container.append(this.container);

					this.id = messenger.messages.length;
					messenger.messages.push(this);

					// Position
					this_private.set_position.call(this);
				},

				set_position: function () {
					var min = this.minimized;

					var m_pre = null, i = this.id - 1;
					for (; i >= 0; --i) {
						m_pre = messenger.messages[i];
						if (m_pre.minimized == min) break;
					}
					if (i < 0) m_pre = null;

					if (m_pre == null) {
						// From top
						var area = content.header.get_screen_area();
						this.container.css("top", (area.top + messenger.spacing.from_top) + "px");
					}
					else {
						// From other message
						var m_pre_pos = m_pre.container.offset();
						var m_pre_height = m_pre.container.outerHeight();

						m_pre_pos.top -= $(window).scrollTop();

						this.container.css("top", (m_pre_pos.top + m_pre_height + (min ? messenger.spacing.from_minimized : messenger.spacing.from_message)) + "px");
					}
				},

				on_close_minimize_click: function (event) {
					if (event.which != 1) return true;

					if ($(this).hasClass("close")) {
						event.data.self.close();
					}
					else {
						event.data.self.set_minimized(!event.data.self.minimized);
					}

					return false;
				},
				on_message_click: function (event) {
					if (event.which != 1) return true;

					if (event.data.self.life_countdown !== null) {
						event.data.self.set_lifetime(0);
					}
				},

				pause: function () {
					if (this.life_countdown !== null) {
						clearInterval(this.life_countdown);
						this.life_countdown = null;
					}
				},

				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					e.triggering = true;
					for (var i = 0, j = e.callbacks.length; i < j; ++i) {
						e.callbacks[i][0].call(this, data, e.callbacks[i][1], event);
					}
					e.triggering = false;
					if (e.removals != null) {
						for (var i = 0; i < e.removals.length; ++i) {
							this.off(event, e.removals[i]);
						}
						e.removals = null;
					}
				}

			};

			Message.prototype = {

				constructor: Message,

				close: function () {
					if (this.id < 0) return;

					// Events
					this_private.trigger.call(this, "close", {});
					this.events = {};

					// Remove events
					this.container.find(".message_button").off("click", this_private.on_close_minimize_click);
					this.container.off("click", this_private.on_message_click);

					// Stop timer
					if (this.life_countdown !== null) {
						clearInterval(this.life_countdown);
						this.life_countdown = null;
					}

					// Remove html
					this.container.remove();
					this.container = null;

					// Remove
					messenger.messages.splice(this.id, 1);

					// Update others
					for (var i = this.id; i < messenger.messages.length; ++i) {
						messenger.messages[i].id = i;
						this_private.set_position.call(messenger.messages[i]);
					}

					// Done
					this.id = -1;
				},

				is_open: function () {
					return (this.id >= 0);
				},

				set_minimized: function (minimized) {
					// Set to minimized
					this.minimized = minimized;
					if (minimized) {
						this.container.addClass("minimized");
					}
					else {
						this.container.removeClass("minimized");
					}

					// Reposition
					for (var i = this.id; i < messenger.messages.length; ++i) {
						this_private.set_position.call(messenger.messages[i]);
					}
				},
				set_lifetime: function (life) {
					this.life = (arguments.length > 0 ? life : messenger.default_message_life);

					if (this.life > 0) {
						var self = this;

						// Text
						this.timer_display.text(this.life).removeClass("hidden");

						// Start timer
						if (this.life_countdown !== null) {
							clearInterval(this.life_countdown);
						}
						this.life_countdown = setInterval(function () {
							self.life -= 1;
							if (self.life > 0) {
								self.timer_display.text(self.life);
							}
							else {
								self.timer_display.text("").removeClass("hidden");
							}
							if (self.life <= 0) {
								// Clear timer
								clearInterval(self.life_countdown);
								self.life_countdown = null;

								// Remove
								if (self.container.find(".close,.minimize").hasClass("close")) {
									self.close();
								}
								else {
									self.set_minimized(true);
								}
							}
						}, 1000);
					}
					else {
						this.timer_display.text("").addClass("hidden");

						if (this.life_countdown !== null) {
							clearInterval(this.life_countdown);
							this.life_countdown = null;
						}
					}
				},
				set_closeable: function (closeable) {
					this.closeable = closeable;
					if (closeable) {
						// Button
						this.container.find(".message_button").removeClass("minimize").addClass("close");
						this.timer_display.removeClass("hidden");
					}
					else {
						// Minimize
						this.container.find(".message_button").removeClass("close").addClass("minimize");
						this.timer_display.addClass("hidden");
					}
				},
				set_type: function (type) {
					style.set_class(this.container, "message");

					if (type == "error") this.container.addClass("error");
					else if (type == "good") this.container.addClass("good");
					else if (type == "okay") this.container.addClass("okay");
					else if (type == "parse") this.container.addClass("parse");
					else if (type == "info") this.container.addClass("info");
					else this.container.addClass("plain");
				},

				on: function (event, callback, callback_data) {
					// callback format: function (event_data, callback_data, event_name) with (this instanceof xch.Message)
					if (event in this.events) {
						// Add
						this.events[event].callbacks.push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							// Queue for removal
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							// Remove any callbacks
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
						}
					}
				}

			};

			return Message;

		})(),

		// Popups
		Popup: (function () {

			var Popup = function (params) {
				this.moving = {
					active: false,
					offset: {
						x: 0,
						y: 0
					}
				};
				this.anchor_border_size = 10;

				this.events = {
					close: {
						triggering: false,
						callbacks: [],
						removals: null
					}
				};

				this.open = true;
				this.container = null;
				this.position = {
					x: 0,
					y: 0,
					anchor: {
						x: 0,
						y: 0
					}
				};
				this.text_input = null;

				this_private.init.call(this, params);
			};

			var this_private = {

				init: function (params) {
					var message_content, title_bar, close;

					(this.container = style.e("div", "popup"))
					.append(
						style.e("div", "popup_background")
					)
					.append(
						(message_content = style.e("div", "popup_content"))
						.append(
							(title_bar = style.e("div", "popup_title_bar popup_content_item"))
							.append(
								(close = style.e("span", "popup_close"))
							)
						)
					);

					if ("no_close" in params) {
						close.addClass("hidden");
					}
					if ("title" in params) {
						title_bar.append(
							style.e("span", "popup_title")
							.text(params.title)
						);
					}
					if ("description" in params) {
						var d;
						message_content.append(
							(d = style.e("div", "popup_description popup_content_item"))
						);
						if (typeof(params.description) == typeof("")) {
							d.text(params.description);
						}
						else {
							d.html(params.description);
						}
					}
					if ("textarea" in params) {
						if (params.textarea.single_line) {
							this.text_input = style.e("input", "popup_input popup_content_item").attr("type", "text");
						}
						else {
							this.text_input = style.e("textarea", "popup_input popup_content_item");
						}
						message_content.append(this.text_input);

						if ("value" in params.textarea) {
							this.text_input.val(params.textarea.value);
						}
						if ("height" in params.textarea) {
							this.text_input.css("height", params.textarea.height + "px");
						}
						if ("readonly" in params.textarea) {
							this.text_input.attr("readonly", "readonly");
						}
					}
					if ("buttons" in params) {
						var buttons, button;
						message_content.append(
							(buttons = style.e("div", "popup_buttons popup_content_item"))
						);
						for (var i = 0; i < params.buttons.length; ++i) {
							buttons.append(
								(button = style.e("button", "popup_button"))
								.text(params.buttons[i].text)
							);
							if ("on" in params.buttons[i]) {
								for (var ev in params.buttons[i].on) {
									if (params.buttons[i].on[ev] instanceof Function) {
										button.on(ev, { popup: this, callback_data: undefined }, params.buttons[i].on[ev]);
									}
									else {
										button.on(ev, { popup: this, callback_data: params.buttons[i].on[ev].callback_data }, params.buttons[i].on[ev].callback);
									}
								}
							}
						}
					}
					if ("size" in params) {
						if ("width" in params.size) {
							this.container.css("width", params.size.width + "px");
						}
					}
					if ("on" in params) {
						for (var ev in params.on) {
							if (params.on[ev] instanceof Function) {
								this.on(ev, params.on[ev], undefined);
							}
							else {
								this.on(ev, params.on[ev].callback, params.on[ev].callback_data);
							}
						}
					}

					// Add
					if (content && content.floating_container) {
						content.floating_container.append(this.container);
					}

					// Position
					var w = this.container.outerWidth();
					var h = this.container.outerHeight();
					var area = content.header.get_screen_area();
					this.set_position((area.left + (area.width - w) / 2), (area.top + (area.height - h) / 2), true);

					// Events
					var data = { self: this };
					close.on("mousedown", this_private.cancel_event)
					.on("click", data, this_private.on_close_click);
					title_bar.on("mousedown", data, this_private.on_grabber_mousedown);
				},

				cancel_event: function (event) {
					return (event.which == 1);
				},

				on_close_click: function (event) {
					if (event.which != 1) return true;

					event.data.self.close();

					return false;
				},

				on_grabber_mousedown: function (event) {
					if (event.which != 1) return true;

					// Stop
					var moving = event.data.self.moving;
					if (moving.active) {
						this_private.move_stop.call(event.data.messenger);
					}

					// Start
					$(window)
					.on("mousemove", event.data, this_private.on_window_mousemove_scroll)
					.on("scroll", event.data, this_private.on_window_mousemove_scroll)
					.on("mouseup", event.data, this_private.on_window_mouseup);

					moving.active = true;

					var o = event.data.self.container.offset();
					moving.offset.x = event.pageX - o.left;
					moving.offset.y = event.pageY - o.top;

					// Done
					return false;
				},
				on_window_mousemove_scroll: function (event) {
					var win = $(window);
					var off = event.data.self.moving.offset;
					var x = event.pageX - win.scrollLeft() - off.x;
					var y = event.pageY - win.scrollTop() - off.y;

					event.data.self.set_position(x, y, false);
				},
				on_window_mouseup: function (event) {
					this_private.move_stop.call(event.data.self);
				},
				move_stop: function () {
					if (this.moving.active) {
						// Turn off events
						$(window)
						.off("mousemove", this_private.on_window_mousemove_scroll)
						.off("scroll", this_private.on_window_mousemove_scroll)
						.off("mouseup", this_private.on_window_mouseup);

						// Stop
						this.moving.active = false;
					}
				},

				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					e.triggering = true;
					for (var i = 0, j = e.callbacks.length; i < j; ++i) {
						e.callbacks[i][0].call(this, data, e.callbacks[i][1], event);
					}
					e.triggering = false;
					if (e.removals != null) {
						for (var i = 0; i < e.removals.length; ++i) {
							this.off(event, e.removals[i]);
						}
						e.removals = null;
					}
				}

			};

			Popup.prototype = {

				close: function () {
					if (!this.open) return;

					if (this.moving.active) {
						this_private.move_stop.call(this);
					}

					this_private.trigger.call(this, "close", {});
					this.events = {};

					this.open = false;

					this.container.find(".popup_title_bar").off("mousedown", this_private.on_grabber_mousedown);

					this.container.remove();
					this.container = null;
				},

				set_position: function (x, y, no_anchor_updates) {
					this.position.x = x;
					this.position.y = y;

					var bounds = content.header.get_screen_area();
					var size = {
						w: this.container.outerWidth(),
						h: this.container.outerHeight()
					};

					// Bounds updating
					if (!no_anchor_updates || this.position.anchor.x == 0) {
						this.position.anchor.x = 0;
						if (x + size.w > bounds.left + bounds.width - this.anchor_border_size) {
							this.position.anchor.x = 1;
						}
						if (x < bounds.left + this.anchor_border_size) {
							this.position.anchor.x = -1;
						}
					}

					if (!no_anchor_updates || this.position.anchor.y == 0) {
						this.position.anchor.y = 0;
						if (y + size.h > bounds.top + bounds.height - this.anchor_border_size) {
							this.position.anchor.y = 1;
						}
						if (y < bounds.top + this.anchor_border_size) {
							this.position.anchor.y = -1;
						}
					}

					// Position
					if (this.position.anchor.x == 0) {
						this.container.css("left", x + "px").css("right", "");
					}
					else if (this.position.anchor.x == -1) {
						this.container.css("left", bounds.left + "px").css("right", "");
					}
					else {
						this.container.css("right", ($(window).width() - (bounds.left + bounds.width)) + "px").css("left", "");
					}

					if (this.position.anchor.y == 0) {
						this.container.css("top", y + "px").css("bottom", "");
					}
					else if (this.position.anchor.y == -1) {
						this.container.css("top", bounds.top + "px").css("bottom", "");
					}
					else {
						this.container.css("bottom", ($(window).height() - (bounds.top + bounds.height)) + "px").css("top", "");
					}
				},

				is_open: function () {
					return (this.container != null);
				},

				on: function (event, callback, callback_data) {
					// callback format: function (event_data, callback_data, event_name) with (this instanceof xch.Popup)
					if (event in this.events) {
						// Add
						this.events[event].callbacks.push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							// Queue for removal
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							// Remove any callbacks
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
						}
					}
				}

			};

			return Popup;

		})(),

		// Menu
		Menu: (function () {

			var Menu = function (parent, params, source) {
				// Parent
				this.parent = parent;
				this.source = source;
				this.open = !source;

				// Settings
				this.keep_on_screen = false;
				this.close_on_mouseleave = false;
				this.fit_width_min = false;
				this.fit_height_min = false;
				this.max_idle_time = 0;
				this.fixed_z = null;
				this.use_fixed_z = true;
				this.open_direction = 1;
				this.ready = false;
				this.anchor = null;
				this.menu_class = null;

				// Options
				this.options = [];
				this.option_expanded = null;

				// Container
				this.container = null;
				this.options_container = null;

				// Closing
				this.close_timer = null;

				// Custom events
				this.events = {
					open: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					close: {
						triggering: false,
						callbacks: [],
						removals: null
					}
				};

				// Timeout init
				this.can_click_to_close = false;
				this.max_idle_timer = null;

				// Events
				this.registered_events = [];

				// Init
				this_private.init.call(this, params);
			};

			var this_private = {

				init: function (params) {
					var self = this;

					// Settings
					this.keep_on_screen = params.keep_on_screen || false;
					this.close_on_mouseleave = params.close_on_mouseleave || false;
					this.fit_width_min = params.fit_width_min || false;
					this.fit_height_min = params.fit_height_min || false;
					this.max_idle_time = ("max_idle_time" in params ? params.max_idle_time : 0);
					this.fixed_z = ("fixed_z" in params ? params.fixed_z : null);
					this.use_fixed_z = ("fixed_z" in params);
					if (params.open == "up") this.open_direction = 0;
					else if (params.open == "down") this.open_direction = 1;
					else if (params.open == "left") this.open_direction = 2;
					else this.open_direction = 3; // right/default

					// Anchors
					if ("anchor" in params) {
						this.anchor = {};
						if (params.anchor.x) {
							this.anchor.x = [ params.anchor.x.container , params.anchor.x.container_side == "right" , params.anchor.x.menu_side == "right" ];
						}
						if (params.anchor.y) {
							this.anchor.y = [ params.anchor.y.container , params.anchor.y.container_side == "bottom" , params.anchor.y.menu_side == "bottom" ];
						}
					}

					// Container
					(this.container = style.e("div", "menu"))
					.append(
						style.e("div", "menu_background")
					)
					.append(
						(this.options_container = style.e("div", "menu_options"))
					);
					if (!this.open) this.container.addClass("hidden");
					if ("menu_class" in params) {
						this.menu_class = params.menu_class;
						this.container.addClass(params.menu_class);
					}
					if ("menu_class_inherit" in params) {
						this.menu_class = params.menu_class_inherit;
					}

					// Add options
					if ("options" in params) {
						for (var i = 0; i < params.options.length; ++i) {
							this.add_option(params.options[i]);
						}
					}

					// Add
					content.floating_container.append(this.container);

					// Update
					if (this.open) {
						this.update();
					}

					// Ready
					this.ready = true;

					// Events
					if ("on" in params) {
						for (var ev in params.on) {
							if (params.on[ev] instanceof Function) {
								this.on(ev, params.on[ev], undefined);
							}
							else {
								this.on(ev, params.on[ev].callback, params.on[ev].callback_data);
							}
						}
					}

					// Timeout init
					this_private.init_timeouts.call(this);

					// Events
					var ev_data = { self: this };
					this_private.register_event.call(this, this.container, "mouseenter", this_private.on_container_mouseenter, ev_data);
					this_private.register_event.call(this, this.container, "mouseleave", this_private.on_container_mouseleave, ev_data);
					this_private.register_event.call(this, this.container, "click", this_private.on_container_click, ev_data);
					this_private.register_event.call(this, $(document), "click", this_private.on_document_click, ev_data);
					this_private.register_event.call(this, $(window), "scroll", this_private.on_window_scroll, ev_data);
					this_private.register_event.call(this, $(window), "resize", this_private.on_window_resize, ev_data);
				},

				init_timeouts: function () {
					var self = this;

					setTimeout(function () {
						self.can_click_to_close = true;
					}, 50);
					if (this.max_idle_time > 0) {
						this.max_idle_timer = setTimeout(function () {
							self.max_idle_timer = null;
							self.close();
						}, this.max_idle_time * 1000);
					}
				},

				on_container_mouseenter: function (event) {
					if (event.data.self.max_idle_timer !== null) {
						clearTimeout(event.data.self.max_idle_timer);
						event.data.self.max_idle_timer = null;
					}
				},
				on_container_mouseleave: function (event) {
					if (event.data.self.close_on_mouseleave) event.data.self.close();
				},
				on_container_click: function (event) {
					if (event.which != 1) return true;

					if (event.data.self.close_timer !== null) {
						clearTimeout(event.data.self.close_timer);
						event.data.self.close_timer = null;
					}

					return false;
				},
				on_document_click: function (event) {
					if (event.which != 1 || !event.data.self.can_click_to_close) return true;

					if (event.data.self.close_timer === null) {
						this_private.activate_close_timer.call(event.data.self);
					}
				},
				on_window_scroll: function (event) {
					event.data.self.update();
				},
				on_window_resize: function (event) {
					event.data.self.update();
				},

				activate_close_timer: function () {
					var self = this;
					this.close_timer = setTimeout(function () {
						self.close_timer = null;
						self.close();
					}, 50);
				},

				register_event: function (object, event, callback, data) {
					this.registered_events.push([object,event,callback]);
					object.on(event, null, data || null, callback);
				},
				unregister_events: function () {
					for (var i = 0; i < this.registered_events.length; ++i) {
						this.registered_events[i][0].off(this.registered_events[i][1], null, this.registered_events[i][2]);
					}
					this.registered_events = [];
				},
				destroy: function () {
					// Remove events
					this_private.unregister_events.call(this);
					// Remove container
					this.container.remove();
					// Destroy children
					for (var i = 0; i < this.options.length; ++i) {
						this.options[i].destroy();
					}
				},

				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					e.triggering = true;
					for (var i = 0, j = e.callbacks.length; i < j; ++i) {
						e.callbacks[i][0].call(this, data, e.callbacks[i][1], event);
					}
					e.triggering = false;
					if (e.removals != null) {
						for (var i = 0; i < e.removals.length; ++i) {
							this.off(event, e.removals[i]);
						}
						e.removals = null;
					}
				},

				on_option_click: function (event) {
					if (event.which != 1) return true;

					if (event.data.option.sub_menu != null && event.data.option.expand_on_click) {
						event.data.option.expand();
					}
				},
				on_option_mouseenter: function (event) {
					if (event.data.option.expand_on_hover) {
						if (event.data.option.sub_menu == null) {
							// Hide
							if (event.data.option.menu.option_expanded != null) {
								event.data.option.menu.option_expanded.unexpand();
							}
						}
						else {
							// Expand
							event.data.option.expand();
						}
					}
				}

			};

			Menu.prototype = {

				constructor: Menu,

				add_option: function (params) {
					// Create
					var opt = new Option(params, this);

					// Needs to update
					if (this.ready) {
						this.update();
					}

					// Done
					return opt;
				},
				update: function (full) {
					// Skip
					if (this.container.hasClass("hidden")) return;

					var self = this;

					// Fixed?
					this.fixed = false;
					var p_parents = this.parent.parents();
					var z_index = 0;
					for (var i = 0; i < p_parents.length; ++i) {
						var me = $(p_parents[i]);
						if (me.css("position").indexOf("fixed") >= 0) this.fixed = true;

						var zi = me.css("z-index");
						if (zi != "auto") z_index = zi;
					}
					if (this.fixed) this.container.addClass("fixed");
					else this.container.removeClass("fixed");
					if (this.use_fixed_z) {
						if (this.fixed_z !== null) {
							this.container.css("z-index", this.fixed_z);
						}
					}
					else {
						this.container.css("z-index", parseInt(z_index) + 10);
					}

					// Update size, etc.
					if (this.fit_width_min) {
						this.container.css("min-width", this.parent.width().toFixed(2) + "px");
					}
					if (this.fit_height_min) {
						this.container.css("min-height", this.parent.height().toFixed(2) + "px");
					}

					// Position vars
					var win = $(window);
					var win_scroll = {
						left: win.scrollLeft(),
						top: win.scrollTop()
					};
					var screen_area = content.header.get_screen_area();
					var p_pos = this.parent.offset();
					var p_size = [ this.parent.outerWidth() , this.parent.outerHeight() ];
					var c_size = [ this.container.outerWidth() , this.container.outerHeight() ];

					if (this.fixed) {
						p_pos.left -= win_scroll.left;
						p_pos.top -= win_scroll.top;
					}
					else {
						screen_area.left += win_scroll.left;
						screen_area.top += win_scroll.top;
					}
					p_pos = [ p_pos.left , p_pos.top ];
					var screen_pos = [ screen_area.left , screen_area.top ];
					var screen_size = [ screen_area.width , screen_area.height ];

					// Open direction
					var dirs = [ true , true ], ind;
					switch (this.open_direction) {
						case 0: // up
						{
							dirs[0] = false;
							ind = 1;
						}
						break;
						case 1: // down
						{
							dirs[0] = true;
							ind = 1;
						}
						break;
						case 2: // left
						{
							dirs[0] = false;
							ind = 0;
						}
						break;
						case 3: // right
						{
							dirs[0] = true;
							ind = 0;
						}
						break;
					}
					var l2r = [ "left" , "right" ];
					var u2d = [ "top" , "bottom" ];
					var x2y = [ "x" , "y" ];
					var l2t = [ "left" , "top" ];
					var pos = [ 0 , 0 ];

					// Main axis
					for (var d = 0, dir, anc; d < 2; ++d) {
						dir = dirs[d];
						if (this.anchor && (anc = this.anchor[x2y[ind]])) {
							pos[ind] = anc[0].offset()[l2t[ind]] + (anc[1] ? (ind == 0 ? anc[0].outerWidth() : anc[0].outerHeight()) : 0) - (anc[2] ? c_size[ind] : 0);
						}
						else {
							for (var i = 0; i < 2; ++i) {
								pos[ind] = p_pos[ind] + (dir ? (d == 0 ? p_size[ind] : 0) : -c_size[ind] + (d == 0 ? 0 : p_size[ind]));
								if ((pos[ind] + (dir ? c_size[ind] : -c_size[ind]) > screen_pos[ind] + (dir ? screen_size[ind] : 0)) == dir) {
									dir = !dir;
								}
								else break;
							}
						}
						// Bound
						if (this.keep_on_screen) {
							if (pos[ind] + c_size[ind] > screen_pos[ind] + screen_size[ind]) pos[ind] = screen_pos[ind] + screen_size[ind] - c_size[ind];
							if (pos[ind] < screen_pos[ind]) pos[ind] = screen_pos[ind];
						}
						// Next axis
						ind = 1 - ind;
					}
					this.container.css("left", pos[0] + "px");
					this.container.css("top", pos[1] + "px");

					// Update children menus
					for (var i = 0; i < this.options.length; ++i) {
						if (this.options[i].sub_menu != null) {
							this.options[i].sub_menu.update();
						}
					}
				},
				show: function () {
					if (this.container.hasClass("hidden")) {
						this.container.removeClass("hidden");
						this.update();
						// Event
						this_private.trigger.call(this, "open", {
							menu: this
						});
					}
				},
				hide: function () {
					// Unexpand anything open
					if (this.option_expanded != null) {
						this.option_expanded.unexpand();
					}

					// Hide
					this.container.addClass("hidden");

					// Event
					this_private.trigger.call(this, "close", {
						menu: this
					});
				},
				close: function () {
					if (this.source) {
						// Unexpand anything open
						if (this.option_expanded != null) {
							this.option_expanded.unexpand();
						}

						// Hide
						this.container.addClass("hidden");

						// Event
						this_private.trigger.call(this, "close", {
							menu: this
						});

						// Close source
						this.source.menu.close();
					}
					else {
						// Unexpand anything open
						if (this.option_expanded != null) {
							this.option_expanded.unexpand();
						}

						// Destroy
						this_private.destroy.call(this);

						// Event
						this_private.trigger.call(this, "close", {
							menu: this
						});
					}
				},

				on: function (event, callback, callback_data) {
					// callback format: function (event_data, callback_data, event_name) with (this instanceof xch.Message)
					if (event in this.events) {
						// Add
						this.events[event].callbacks.push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							// Queue for removal
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							// Remove any callbacks
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
						}
					}
				}

			};

			var Option = (function () {

				var Option = function (params, parent) {
					this.menu = parent;

					// Sub menus
					this.sub_menu = null;
					this.expand_on_click = ("expand_on_click" in params ? params.expand_on_click : true);
					this.expand_on_hover = ("expand_on_hover" in params ? params.expand_on_hover : true);
					this.order = params.order || 0;

					// Container
					if ("text" in params) {
						this.container = style.e("div", "menu_option");
						this.container.text(params.text);
					}
					else if ("html" in params) {
						if (typeof(params.html) == typeof("")) {
							this.container = style.e("div", "menu_option");
							this.container.html(params.html);
						}
						else {
							this.container = style.add_class(params.html.addClass("menu_option"));
						}
					}
					else {
						this.container = style.e("div", "menu_option");
						this.container.text("null");
					}

					// Other stuff
					var conts = this.container.contents();
					conts.wrap(style.e("div", "menu_option_content"));
					this.container.prepend(
						style.e("div", "menu_option_background")
					);

					// Events
					this.registered_events = [];
					if ("on" in params) {
						for (var ev in params.on) {
							if (params.on[ev] instanceof Function) {
								this.container.on(ev, { option: this, callback_data: undefined }, params.on[ev]);
							}
							else {
								this.container.on(ev, { option: this, callback_data: params.on[ev].callback_data }, params.on[ev].callback);
							}
						}
					}
					var data = { option: this };
					this.container
					.on("click", data, this_private.on_option_click)
					.on("mouseenter", data, this_private.on_option_mouseenter);

					// Add
					var i;
					for (i = this.menu.options.length - 1; i >= 0; --i) {
						if (this.order >= this.menu.options[i].order) {
							this.menu.options[i].container.after(this.container);
							this.menu.options.splice(i + 1, 0, this);
							break;
						}
					}
					if (i < 0) {
						this.menu.options_container.prepend(this.container);
						this.menu.options.splice(0, 0, this);
					}

					// Sub menu
					if ("sub_menu" in params) {
						this.sub_menu = new Menu(this.container, params.sub_menu, this);

						if (!("hidden_expand" in params)) {
							this.container.addClass("expandable");
							this.menu.container.children(".menu_options").addClass("expandable");
						}
					}
					else if ("options" in params) {
						var params_new = {
							close_on_mouseleave: false,
							keep_on_screen: this.menu.keep_on_screen,
							fixed_z: null,
							open: "right",
							options: params.options
						};
						if (this.menu.menu_class !== null) {
							params_new.menu_class = this.menu.menu_class;
						}
						this.sub_menu = new Menu(this.container, params_new, this);

						if (!("hidden_expand" in params)) {
							this.container.addClass("expandable");
							this.menu.container.children(".menu_options").addClass("expandable");
						}
					}
				};

				Option.prototype = {

					constructor: Option,

					expand: function () {
						if (this.menu.option_expanded != null) {
							this.menu.option_expanded.unexpand();
						}
						this.sub_menu.show();
						this.menu.option_expanded = this;
					},
					unexpand: function () {
						this.menu.option_expanded = null;
						this.sub_menu.hide();
					},
					destroy: function () {
						this_private.unregister_events.call(this);

						if (this.sub_menu != null) {
							this_private.destroy.call(this.sub_menu);
						}
					}

				};

				return Option;

			})();

			return Menu;

		})(),


		// Meta information
		Meta: (function () {

			var Meta = function () {
				this.page_okay = false;
				this.page_code = 200;

				var m = /\/(\w+)\/(?:($)|(?:(index)\.html|([0-9]+).html)|res\/([0-9]+)\.html)/.exec(document.location.pathname);
				if (m) {
					this.page_okay = true;
					var board = m[1];
					var page_number = (m[2] === undefined ? (m[3] === undefined ? parseInt(m[4]) : 1) : 1);
					var thread_number = (m[5] === undefined ? null : parseInt(m[5]));
				}
			};

			Meta.prototype = {

				constructor: Meta,

				validate: function (html) {
					if (html.find("title:nth-of-type(1)").text() == "404 Not Found") {
						this.page_code = 404;
						return false;
					}

					if (html.find('form[name="postcontrols"]').length <= 0) {
						// No content?
						return false;
					}

					return true;
				}

			};

			return Meta;

		})(),

		// Page information
		Information: (function () {

			var Information = function (meta, html) {
				this.meta = meta;

				this.board = "";
				this.index = false;
				this.page_index = 0;

				this.images = {
					deleted: {
						url: "http://boards.38chan.net/static/deleted.png",
						size: { width: 140, height: 50 }
					}
				};

				this.favicons = {
					alive: {
						standard: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAXElEQVQ4y81SQQ7AIAyC/v/P7OpMQWOWOC41rWAtBW6Dw1kmj3SHTcGJqHmBroNZpCUDQAWyhYaQOmD4f5rTDyAzkzZvreLkguOV83nPiLfAEQofe6OwWDpZuiUe2UAbAR05NuwAAAAASUVORK5CYII=",
						new_post: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAzElEQVQ4y6WSsRHDMAhFn3OZwY23Se9KA6j1JauZij5DeAwvQYqcFBkjN9EdJ4rPF/AEf56hJKpqJZ/neYjEllLVDCI/jaraNE01WrO2+Ak1qlkpVtUa3qQUW0o1QpOcs+WcDyaHYjBzHdxU1ZZlYRxHtm0DYF3X8wJEvhfwAF4inDro7cHP33YQUohItAROFLzQi8sDEZ0uqtakHbFr4lGV3GMOTa5QXSEGuHtUAqTOiAVzew4GArwvivd9D01OY/SW2N2BZ93DGP2XD/B7EnK1NF7SAAAAAElFTkSuQmCC",
						new_post_to_me: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABEklEQVQ4y6WSsXHEIBBFHzOuQQkNyImKuNiKtgBSxq04vvxUABG5iyCxG1ByTawDAwNIcuKdYYR29D/sf4J/limbGKOW/bqupvTeHg9MCAZAReo3pVfF1tq6YoyaDXUGVRFVEX2HuqpZERdReQe01NyIWrODiXNOnXP19NZARVRBdbiBiTGq955pmgBYlgWAbdtQ/T3g1Ri+8rghPz+Buwg1LO99l+6+753BbUj/LoIJwZxSyCT6G4j0+DIFM3IdUDEDHzEyIj6tFlVJuyVTaP0pbjHNoECH+dSkE2dUc4MR6BC3Ji+dUwgEQC5GTCkdep1ByHwBbjn9b8BaS0qJ5/N5anIY4yrEywxGhC3K8T8ZxT+A1yOTNT7ixAAAAABJRU5ErkJggg=="
					},
					dead: {
						standard: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWUlEQVQ4y82RMQ4AIAgDgf//GScTQlpBFu2ioZUgJ/JaGu5O6nLK7KCD17kJzGgVqDxDgUoeDrYD+IXC/0gOxqV1iopRyIiNYewQyA1GMrlgo/0J6RKZN9cCTJQgAMuv+3kAAAAASUVORK5CYII=",
						new_post: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiUlEQVQ4y6VSQQ7AIAjDxR/yi71tfMGvsYsQRygcZkJCaKlCJfp5hiXKrF4UGRkZcpRZbyKPk9hyDFBmjyjScrxgERo833ja/OyIpChuvFQE7aHCUxcyJxA+YyFzoBKGVqER4AVw8yDHzY0LUeT6KImQFPPL5pxnRsIqmle13fNp1VduF4msRNgLwaUKCulRKBwAAAAASUVORK5CYII=",
						new_post_to_me: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAyklEQVQ4y6VSwQ3DMAg8qgyTrJEVbot0nmxRVsgaGYc+aixMaPooEhKG42xzAH+aeGCk9aSqxFw+x9zkhacqMtnScn7OGFEVGGkbYEZ23wCbAXObgRLTX9QT7uSFwMheL5tfzR10IWjuOCeRagYAcAA47XPJIoI1TX8nIapSquADjAQnOcrXVJCsayRyFWKzN172IH9lTzfGfCYZlUhSZgkHBcrmHypkksfApAq92XttmGhTBhwtXtv0PY610uLT8tpWta8k1U7c1d5z5w0XUkvMIwAAAABJRU5ErkJggg=="
					}
				};

				// Implicit parsing
				this_private.parse.call(this, html);
			};

			var this_private = {

				parse: function (html) {
					// Board
					var p = html.find('form[name="postcontrols"]');
					if (p.length > 0) {
						this.board = p.find('input[name="board"]').val() || "";
					}

					// Page type
					p = html.find("div.pages");
					if (p.length > 0) {
						// On an index page
						this.index = true;
						p = $(p[0]);
						p = p.find("a.selected");
						if (p.length > 0) {
							this.page_index = parseInt(p.html()) || 0;
						}
					}
					else {
						// Not on the index
						this.index = false;
					}
				}

			};

			Information.prototype = {

				constructor: Information,

				urls_match: function (url1, url2) {
					return (url1 == url2);
				},
				create_url: {
					to_board: function (board, page) {
						return "/" + board + "/" + (arguments.length >= 2 && page > 1 ? (page + ".html") : "");
					},
					to_thread: function (board, thread_id) {
						return "/" + board + "/res/" + thread_id + ".html";
					},
					to_post: function (board, thread_id, post_id) {
						return "/" + board + "/res/" + thread_id + ".html#" + post_id;
					},
					to_post_submit_target: function (board, thread_id) {
						return "/post.php";
					},
					to_report_submit_target: function (board, thread_id) {
						return "/post.php";
					},
					to_delete_submit_target: function (board, thread_id) {
						return "/post.php";
					}
				},

				is_default_name: function (name, board) {
					return (name == "Anonymous");
				}

			};

			return Information;

		})(),

		// Post parsing queue
		PostQueue: (function () {

			var PostQueue = function (max, timeout) {
				this.post_queue = [];
				this.count = 0;
				this.timer = null;
				this.max = max;
				this.timeout = timeout * 1000;
			};

			var this_private = {

				test_queue: function () {
					if (this.timer === null) {
						if (this.count < this.max || this.max <= 0) {
							// Parse now
							var post_data = this.post_queue.shift();
							post_data[0].parse_immediate(post_data[1]);
							// Increase count
							++this.count;
							// Next
							return true;
						}
						else {
							// Timer
							var self = this;
							this.timer = setTimeout(function () {
								// Reset
								self.timer = null;
								self.count = 0;
								// Parse more if they exist
								while (self.post_queue.length > 0 && this_private.test_queue.call(self));
							}, this.timeout);
						}
					}
					// Did not parse any
					return false;
				}

			};

			PostQueue.prototype = {

				constructor: PostQueue,

				queue: function (post, data) {
					this.post_queue.push([post, data]);
					this_private.test_queue.call(this);
				}

			};

			return PostQueue;

		})(),

		// Page content
		Content: (function () {

			var Content = function (main_context) {
				this.threads = [];
				this.board_map = {};
				this.incomplete_references = [];
				this.dead_references = [];

				this.main_context = main_context;

				this.container = null;

				this.floating_container = null;

				this.updater = null;

				this.header = null;
				this.qr = null;

				this.events = {
					thread_new: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					thread_ready: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					thread_load: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					thread_delete: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					thread_update: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					post_new: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					post_load: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					post_delete: {
						triggering: false,
						callbacks: [],
						removals: null
					},
					complete: {
						triggering: false,
						callbacks: [],
						removals: null
					}
				};

				this.title_format = {
					index: "/%board/ - %title",
					thread: "/%board/ - %op"
				};

				this.my_posts = {};

				this.favicon_node = null;

				// Delete/reporting
				this.delete_report_popup = null;
				this.post_marking_popup = null;

				// Sourcing nodes
				this.sourcing = [];

				// Load
				this_private.load_all.call(this);

				// Sourcing update
				this_private.update_sourcing.call(this);

				// Highlight waiting
				this.post_highlight_id_target = -1;

				// Event listening
				location.on("change", this_private.on_location_change, this);

				// Title update with OP
				if (!info.index) {
					this.on("post_load", this_private.on_post_load_title_update, this);
				}

				communication.cross_tab_on("my_posts_change", this_private.on_cross_my_posts_change, this);

				// Initial location test
				this_private.on_location_change.call(location, {
					location: location,
					self_init: true
				}, this);
			};

			var this_private = {

				load_all: function () {
					this_private.load_post_settings.call(this, false);
					this_private.load_my_posts.call(this, false);
				},
				load_post_settings: function (apply) {
					var set = xch.get_value("settings_post", xch.settings.post);
					if (set === xch.settings.post) {
						// Defaults
						xch.settings.post.time.offset = -(new Date()).getTimezoneOffset() * 60 * 1000;
					}
					else {
						// TODO
					}
				},
				load_my_posts: function (apply) {
					var my_posts = xch.site_get_value_raw("my_posts", null);
					if (my_posts !== null && my_posts.length == 0) my_posts = null;

					if (my_posts !== null) {
						var sep = "/";
						var my_posts_split = my_posts.split(sep);
						for (var i = 0; i < my_posts_split.length; ++i) {
							// Load by key
							this_private.load_my_post_by_id.call(this, my_posts_split[i], apply);
						}
					}
				},
				load_my_post_by_id: function (key, apply) {
					var val = xch.site_get_value("my_posts_" + key, null);
					if (val !== null) {
						// Set
						this.my_posts[key] = val;

						// Apply?
						if (apply) {
							// Find post
							var key_split = this_private.unformat_my_post_key.call(this, event.key);
							var board = key_split[0];
							var thread_id = key_split[1];
							var post_id = key_split[2];

							if (
								board in this.board_map &&
								thread_id in this.board_map[board].thread_map &&
								post_id in this.board_map[board].thread_map[thread_id].post_map
							) {
								// Post found
								var post = this.board_map[board].thread_map[thread_id].post_map[post_id];

								// Update references
								post.update_all_reply_references();
								post.update_all_backlink_references();
							}
						}
					}
				},
				save_my_post: function (new_post_key, add) {
					var my_posts = xch.site_get_value_raw("my_posts", null);
					if (my_posts !== null && my_posts.length == 0) my_posts = null;

					// Check for key
					var sep = "/";
					var i = 0, my_posts_split = null;
					if (my_posts !== null) {
						my_posts_split = my_posts.split(sep);
						for (; i < my_posts_split.length; ++i) {
							if (my_posts_split[i] == new_post_key) break;
						}
					}

					if (add) {
						if (my_posts_split == null || i == my_posts_split.length) {
							// Add
							if (my_posts === null) my_posts = "";
							else if (my_posts.length > 0) my_posts += sep;
							my_posts += new_post_key;

							// Save
							xch.site_set_value_raw("my_posts", my_posts);
						}

						// Save data
						xch.site_set_value("my_posts_" + new_post_key, this.my_posts[new_post_key]);
					}
					else {
						// Remove
						if (my_posts_split != null && i < my_posts_split.length) {
							my_posts_split.splice(i, 1);
							if (my_posts_split.length > 0) {
								// Set
								xch.site_set_value_raw("my_posts", my_posts_split.join(sep));
							}
							else {
								// Empty: remove
								xch.site_delete_value("my_posts");
							}
						}

						// Delte data
						xch.site_delete_value("my_posts_" + new_post_key);
					}

					// Trigger event
					communication.cross_tab_trigger("my_posts_change", {
						key: new_post_key,
						add: add
					});
				},

				on_cross_my_posts_change: function (event, self) {
					if (event.add) {
						// Load
						this_private.load_my_post_by_id.call(self, event.key, true);
					}
					else {
						// Unmark without save
						var key_split = this_private.unformat_my_post_key.call(self, event.key);
						self.unmark_post_as_me(key_split[0], key_split[1], key_split[2], false);
					}
				},

				format_my_post_key: function (board, thread_id, post_id) {
					return post_id + "_" + thread_id + "_" + board;
				},
				unformat_my_post_key: function (post_key) {
					// returns [board, thread_id, post_id]
					var key_split = post_key.split("_");

					var post_id = parseInt(key_split[0]);
					var thread_id = parseInt(key_split[1]);

					key_split.splice(0, 2);
					var board = key_split.join("_");

					return [board,thread_id,post_id];
				},

				thread_add_sort_function: function (existing_thread, inserting_thread) {
					return (existing_thread.id < inserting_thread.id);
				},

				incomplete_reference_update_function: function (ref, target_post, origin_post) {
					// Complete
					ref.complete(target_post);

					// Stylize / fix target
					origin_post.update_reference_style(ref);
				},
				reference_forwards_death_update_function: function (ref, skip, original_post) {
					// Nothing
				},

				on_post_load_title_update: function (event, self) {
					if (event.post.op) {
						self.format_title();
						self.off("post_load", this_private.on_post_load_title_update);
					}
				},

				on_location_change: function (event, self) {
					if (event.location.fragment !== null && /[0-9]+/.test(event.location.fragment)) {
						// Highlight post with this id
						var post_id = parseInt(event.location.fragment) || 0;

						// Find posts
						if ("self_init" in event) {
							// Set highlighting target
							self.post_highlight_id_target = post_id;
							self.on("post_load", this_private.on_post_load_highlight, self);
							self.on("complete", this_private.on_complete_highlight, self);
						}
						else {
							var c = self.main_context.html.find('.thread>.post_container[post_id="' + post_id + '"]');
							if (c.length > 0) {
								self.main_context.html.find(".thread>.post_container.highlighted").removeClass("highlighted");
								c = c.first();
								c.addClass("highlighted");
								if (!event.is_new) {
									// Scroll to
									xch.Post.prototype.scroll_to.call(null, c);
								}
							}
						}
					}
					else {
						if (!("self_init" in event)) {
							// Un-highlight
							self.main_context.html.find(".thread>.post_container.highlighted").removeClass("highlighted");
						}
					}
				},
				on_post_load_highlight: function (event, self) {
					if (event.context != self.main_context) return;
					if (event.post.id == self.post_highlight_id_target) {
						// Un-highlight others
						self.main_context.html.find(".thread>.post_container.highlighted").removeClass("highlighted");
						// Highlight
						var c = event.post.instances[0].container;
						c.addClass("highlighted");
						// Scroll to
						event.post.scroll_to(c);
						// Disable events
						self.post_highlight_id_target = -1;
						self.off("post_load", this_private.on_post_load_highlight);
						self.off("complete", this_private.on_complete_highlight);
					}
				},
				on_complete_highlight: function (event, self) {
					if (event.context != self.main_context) return;
					// Disable events
					self.post_highlight_id_target = -1;
					self.off("post_load", this_private.on_post_load_highlight);
					self.off("complete", this_private.on_complete_highlight);
				},

				update_sourcing: function () {
					var src = xch.settings.sourcing.source_text;
					this.sourcing = [];

					var tree = [{
						options: this.sourcing
					}];

					src = src.split(/\r?\n|\r/);
					for (var i = 0, j; i < src.length; ++i) {
						// Split
						var start = 0, pos = 0;
						var temp = [], val, esc = false, key;
						while (pos >= 0) {
							pos = src[i].indexOf(";", pos);
							if (pos >= 0) {
								if (pos == 0 || src[i][pos - 1] != "\\") {
									val = src[i].substr(start, pos - start);
									if (esc) {
										val = val.replace("\\;", ";");
										esc = false;
									}
									temp.push(val);
									start = ++pos;
								}
								else {
									esc = true;
									++pos;
								}
							}
							else {
								val = (start > 0 ? src[i].substr(start) : src[i]);
								if (esc) {
									val = val.replace("\\;", ";");
									esc = false;
								}
								if (val.length > 0) temp.push(val);
								break;
							}
						}

						// Skip empty lines
						if (temp.length == 0) continue;

						// Depth check
						var depth = 0;
						for (j = 0; j < temp[0].length; ++j) {
							if (temp[0][j].charCodeAt(0) <= 32) continue;
							else if (temp[0][j] == "#") {
								j = -1;
								break;
							}
							else if (temp[0][j] == ">") {
								++depth;
							}
							else {
								if (j > 0) temp[0] = temp[0].substr(j);
								break;
							}
						}
						if (j < 0) continue;

						// Create new
						var opt = {
							url: temp[0],
							text: "",
							options: [],
							allow_if_spoiler: 3
						};
						for (j = 1; j < temp.length; ++j) {
							key = temp[j].substr(0, pos = (temp[j].indexOf(":")));
							val = temp[j].substr(pos + 1);

							if (key == "text") opt.text = val;
							else if (key == "if_spoiler") {
								if (!xch.string_to_truth(val)) opt.allow_if_spoiler &= ~1;
							}
							else if (key == "if_not_spoiler") {
								if (!xch.string_to_truth(val)) opt.allow_if_spoiler &= ~2;
							}
						}
						if (opt.text.length == 0) {
							var m1, m2;
							if ((m1 = /(?:.+?\:)?\/\/(.+?)\/(?:.*?)/.exec(opt.url)) && (m2 = /([^\.]+)(?:\.[^\.]+)$/.exec(m1[1]))) {
								opt.text = m2[1];
							}
							else {
								opt.text = "text";
							}
						}

						// Add
						if (depth >= tree.length) depth = tree.length - 1;
						tree[depth].options.push(opt);
						++depth;
						tree.splice(depth, tree.length - depth, opt);
					}
				},
				sourcing_format_function: function (fmt, post) {
					if (fmt == "board") {
						fmt = post.thread.board;
					}
					else if (fmt == "thread_id") {
						fmt = post.thread.id;
					}
					else if (fmt == "post_id") {
						fmt = post.id;
					}
					else if (fmt == "thumbnail") {
						if (post.image != null && post.image.thumbnail != null) {
							fmt = post.image.thumbnail;
						}
					}
					else if (fmt == "image") {
						if (post.image != null && post.image.url != null) {
							fmt = post.image.url;
						}
					}

					return fmt;
				},

				spawn_delete_report_popup: function (report, title, description, action, action_data) {
					var data = { self: this, action: action, action_data: action_data, report: (report !== null) };

					var params = {
						title: title,
						description: description,
						size: {
							width: 320
						},
						buttons: [{
							text: "Cancel",
							on: {
								click: {
									callback_data: data,
									callback: function (event) {
										if (event.which != 1) return true;

										event.data.popup.close();
									}
								}
							}
						}, {
							text: (data.report ? "Report" : "Delete"),
							on: {
								click: {
									callback_data: data,
									callback: function (event) {
										if (event.which != 1) return true;

										var input_val = (event.data.popup.text_input ? event.data.popup.text_input.val() : null);

										if (event.data.callback_data.action) {
											close = event.data.callback_data.action.call(event.data.callback_data.self, event.data.callback_data.action_data, input_val);
										}

										if (close) {
											event.data.popup.close();
										}
									}
								}
							}
						}],
						on: {
							close: {
								callback_data: data,
								callback: function (event, callback_data) {
									callback_data.self.delete_report_popup = null;
								}
							}
						}
					};

					// Add textarea
					if (data.report) {
						params.textarea = {
							value: report,
							single_line: true
						};
					}

					// Create
					this.delete_report_popup = new xch.Popup(params);

					// Select
					if (data.report) {
						xch.set_selection(this.delete_report_popup.text_input, 0, report.length);
					}
				},
				spawn_delete_report_message: function (report, post, delete_image) {
					var is_report = (report !== null);

					// Create message
					var pb, pb_inner, message_text;
					var msg = new xch.Message({
						type: "info",
						title: (is_report ? "Reporting Post" : "Deleting Post"),
						html: (style.e("div").append(
							(message_text = style.e("div"))
							.text(is_report ? "Post is being reported..." : (delete_image ? "Image is being deleted..." : "Post is being deleted..."))
						).append(
							(pb = style.e("div", "message_progress default"))
							.append(
								(pb_inner = style.e("div", "message_progress_inner active"))
							)
						)),
						closeable: false,
						life: 0
					});

					// Create form data
					var fd = new FormData();
					var target_post_url;

					// Fields
					var password;
					fd.append("board", post.thread.board);
					fd.append("delete_" + post.id, "on");
					if (is_report) {
						fd.append("reason", report);
						fd.append("password", this.qr.create_password(8)); // Using a random password, becuase why not
						fd.append("report", "Report");

						target_post_url = info.create_url.to_report_submit_target(post.thread.board, post.thread.id);
					}
					else {
						var my_post_data = this.posted_by_me_data(post);
						if (my_post_data == null) {
							password = this.qr.saved_post_settings.password || "";
						}
						else {
							password = my_post_data.password;
						}

						if (delete_image) fd.append("file", "on");
						fd.append("password", password);
						fd.append("delete", "Delete");

						target_post_url = info.create_url.to_delete_submit_target(post.thread.board, post.thread.id);
					}

					// Ajax request
					var ajax_data = {
						url: target_post_url,
						method: "POST",
						return_type: "text",
						post_data: fd,
						//cred: true,
						on: {
							load: this_private.report_delete_on_load,
							progress: this_private.report_delete_on_progress,
							error: this_private.report_delete_on_error,
							abort: this_private.report_delete_on_abort
						},
						event_data: {
							self: this,
							message: msg,
							progress_bar: pb,
							progress_inner: pb_inner,
							message_text: message_text,
							is_report: is_report,
							delete_image: delete_image,
							post: post
						}
					};

					// Submit
					xch.ajax(ajax_data);
				},

				report_delete_on_load: function (event) {
					// Change
					if (event.okay) {
						// Parse response
						var html = xch.string_to_dom(event.response);
						// Check
						if (html != null && (html = $(html)).length > 0) {
							// Parse
							var error = event.data.event_data.self.check_html_for_error(html);
							if (error === null) {
								// Okay; done
								this_private.report_delete_success.call(event.data.event_data.self, event.data.event_data);
							}
							else {
								// Remove last "."
								if (error[error.length - 1] == "." && error.substr(-2) != "..") {
									error = error.substr(0, error.length - 1);
								}

								this_private.report_delete_error.call(event.data.event_data.self,
									event.data.event_data,
									error
								);
							}
						}
						else {
							// Bad
							this_private.report_delete_error.call(event.data.event_data.self,
								event.data.event_data,
								"An error occured while parsing the resulting HTML"
							);
						}
					}
					else {
						// Error
						this_private.report_delete_error.call(event.data.event_data.self,
							event.data.event_data,
							"An invalid http status was returned (" + event.status + ", " + event.status_text + ")"
						);
					}

				},
				report_delete_on_progress: function (event) {
					// Percent update
					var perc = event.event.loaded / event.event.total;
					event.data.event_data.progress_inner.css("width", (perc * 100).toFixed(2) + "%");
				},
				report_delete_on_error: function (event) {
					// Connection error
					this_private.report_delete_error.call(event.data.event_data.self,
						event.data.event_data,
						"A connection error occured"
					);
				},
				report_delete_on_abort: function (event) {
					// Abort
					this_private.report_delete_error.call(event.data.event_data.self,
						event.data.event_data,
						"The submission was aborted"
					);
				},

				report_delete_success: function (event_data) {
					event_data.message.set_type("okay");
					event_data.message.container.find(".message_title").text(event_data.is_report ? "Report Successful" : "Delete Successful");
					event_data.message_text.text(event_data.is_report ? "Post was successfully reported" : (event_data.delete_image ? "Image was successfully deleted" : "Post was successfully deleted"));
					event_data.progress_bar.addClass("hidden");

					event_data.message.set_closeable(true);
					event_data.message.set_lifetime();

					// If this was a delete, update deleted status
					if (!event_data.is_report) {
						if (event_data.delete_image) {
							event_data.post.mark_as_dead_image(false);
						}
						else {
							event_data.post.mark_as_dead(false);
						}
					}
				},
				report_delete_error: function (event_data, error_message) {
					event_data.message.set_type("error");
					event_data.message.container.find(".message_title").text(event_data.is_report ? "Reporting Error" : "Deletion Error");
					event_data.message_text.text(error_message);
					event_data.progress_bar.addClass("hidden");

					event_data.message.set_closeable(true);
					event_data.message.set_lifetime();
				},

				spawn_post_marking_popup: function (title, description, button, action, action_data) {
					var data = { self: this, action: action, action_data: action_data };

					var params = {
						title: title,
						description: description,
						size: {
							width: 320
						},
						buttons: [{
							text: "Cancel",
							on: {
								click: {
									callback_data: data,
									callback: function (event) {
										if (event.which != 1) return true;

										event.data.popup.close();
									}
								}
							}
						}, {
							text: button,
							on: {
								click: {
									callback_data: data,
									callback: function (event) {
										if (event.which != 1) return true;

										var input_val = (event.data.popup.text_input ? event.data.popup.text_input.val() : null);

										if (event.data.callback_data.action) {
											close = event.data.callback_data.action.call(event.data.callback_data.self, event.data.callback_data.action_data, input_val);
										}

										if (close) {
											event.data.popup.close();
										}
									}
								}
							}
						}],
						on: {
							close: {
								callback_data: data,
								callback: function (event, callback_data) {
									callback_data.self.post_marking_popup = null;
								}
							}
						}
					};

					// Create
					this.post_marking_popup = new xch.Popup(params);
				},

				sourcing_info_build_menu_options: function (opts, post) {
					var text, href, sp_allow, options = [];

					for (var i = 0; i < opts.length; ++i) {
						// Spoiler allowing
						sp_allow = (post.image == null ? true : ((opts[i].allow_if_spoiler & (post.image.spoiler ? 1 : 2)) != 0));
						if (sp_allow) {
							// Format values
							text = xch.format_string(opts[i].text, this_private.sourcing_format_function, post);
							href = xch.format_string(opts[i].url, this_private.sourcing_format_function, post);
							// Add
							var option = {
								html: (
									style.e("a")
									.attr("target", "_blank")
									.attr("href", href)
									.text(text)
								),
								on: {
									click: function (event) {
										if (event.which != 1) return true;
										event.data.option.menu.close();
										return true;
									}
								}
							};

							// Recursive options
							if (opts[i].options.length > 0) {
								option.options = this_private.sourcing_info_build_menu_options.call(this, opts[i].options, post);
							}

							// Add
							options.push(option);
						}
					}

					// Done
					return options;
				},
				sourcing_info_click: function (event) {
					if (event.which != 1) return true;

					// Create menu
					var opts = content.sourcing[event.data.sourcing_id].options;
					if (opts && opts.length > 0) {
						// Create menu
						if (event.data.menu == null) {
							var options = this_private.sourcing_info_build_menu_options.call(this, opts, event.data.post);

							// Create
							if (options.length > 0) {
								event.data.menu = new xch.Menu($(this), {
									close_on_mouseleave: false,
									fit_width_min: true,
									keep_on_screen: true,
									menu_class: "small",
									fixed_z: null,
									open: "down",
									on: {
										close: {
											callback_data: event.data,
											callback: this_private.sourcing_info_on_menu_close
										}
									},
									options: options
								});
							}
						}
						else {
							// Close
							event.data.menu.close();
						}

						// Done
						return false;
					}
					return true;
				},
				sourcing_info_on_menu_close: function (event, event_data) {
					// Nullify
					event_data.menu = null;
				},

				delete_post_image_action: function (post) {
					this.delete_post_image(post, true);
					return true;
				},
				delete_post_action: function (post) {
					this.delete_post(post, true);
					return true;
				},
				report_post_action: function (post, input_val) {
					if (input_val.trim().length == 0) return false;
					this.report_post(post, input_val, true);
					return true;
				},
				mark_post_as_me_ask_action: function (data) {
					this.mark_post_as_me_ask(data.post, data.mark, true);
					return true;
				}

			};

			Content.prototype = {

				constructor: Content,

				init: function (context) {
					// Get container
					this.container = context.html.find('form[name="postcontrols"]').first();

					// Get the favicon node
					this.favicon_node = context.html.find('head>link[rel="shortcut icon"]');
					if (this.favicon_node.length == 0) this.favicon_node = null;
					this.set_favicon(info.favicons.alive.standard);

					// Remove stuff
					if (this.container.length > 0) {
						// Remove delete options
						this.container.children(".delete,input").remove();

						// Replace
						var cont = this.container.contents();
						var c = this.container;
						c.replaceWith(
							(this.container = style.e("div", "content"))
							.html(cont)
						);
					}

					// Add floating inline container
					context.html.find("body").append(
						(this.floating_container = style.e("div", "floating_inline_container"))
					);

					// Create header
					this.header = new xch.Header(context.html);
					// Create quick reply
					this.qr = new xch.QuickReply(context.html);
					// Create updater
					if (!info.index) {
						this.updater = new xch.Updater(context.html);
					}

					// Title
					this.format_title();
				},
				parse: function (context) {
					var self = this;

					if (context.is_new) {
						// Init
						this.init(context);
					}

					// Parse queue
					var parse_queue = [];

					// Find threads
					var html_threads = context.html.find('div[id^="thread_"]');
					for (var i = 0; i < html_threads.length; ++i) {
						var obj = $(html_threads[i]), existing, thread_context;
						// Append new thread
						var thread = new xch.Thread();
						thread.init(obj, context);
						// Check for duplicate
						if (context.is_new || (existing = this.get_thread(thread.id, thread.board)) == null) {
							// New
							thread_context = [
								thread,
								obj,
								{
									is_new: true,
									posts_loaded: [],
									posts_total: 0
								}
							];
							this.thread_new(thread, context, thread_context[2]);
						}
						else {
							// Update
							thread_context = [
								existing,
								obj,
								{
									is_new: false,
									posts_loaded: [],
									posts_total: 0,
								}
							];
							// Trigger event
							this.thread_new(existing, context, thread_context[2]);
							// Update any settings
							existing.update_with(thread, context, thread_context[2]);
						}
						parse_queue.push(thread_context);
					}

					// Start thread parsing
					context.threads_total = parse_queue.length;
					for (var i = 0, j = parse_queue.length, p_q; i < j; ++i) {
						p_q = parse_queue[i];
						p_q[0].parse(p_q[1], context, p_q[2]);
					}

					// Complete
					if (parse_queue.length == 0) {
						this.trigger("complete", {
							context: context
						});
					}
				},

				thread_new: function (thread, context, thread_context) {
					if (thread_context.is_new) {
						// Add
						xch.insert_element_sorted(this.threads, thread, this_private.thread_add_sort_function);
						// Map
						if (!(thread.board in this.board_map)) {
							// New
							this.board_map[thread.board] = {
								thread_map: {}
							};
						}
						var b = this.board_map[thread.board];
						// Add
						b.thread_map[thread.id] = thread;
					}
					// Signal
					this.trigger("thread_new", {
						thread: thread,
						context: context,
						thread_context: thread_context
					});
				},
				thread_ready: function (thread, context, thread_context) {
					// Signal
					this.trigger("thread_ready", {
						thread: thread,
						context: context,
						thread_context: thread_context
					});
				},
				thread_loaded: function (thread, context, thread_context) {
					// Dead posts
					var i, j, m, n;
					/*!debug!*/var dead_count = 0;
					for (i = 0, m = thread.posts.length, n = thread_context.posts_loaded.length; i < m; ++i) {
						// Skip if already deleted
						if (thread.posts[i].deleted) continue;

						// Check if exists
						for (j = 0; j < n; ++j) {
							if (thread.posts[i] == thread_context.posts_loaded[j]) break;
						}

						// Deleted
						if (j == n) {
							/*!debug!*/++dead_count;
							// Dead post
							thread.posts[i].mark_as_dead(true);
							// Event
							this.trigger("post_delete", {
								post: thread.posts[i],
								context: context,
								thread_context: thread_context
							});
						}
					}
					/*!debug!*/if (dead_count > 0) {console.log(context.html.html());}

					// Forwards dead post checking
					for (i = 0, j = this.incomplete_references.length; i < j; ++i) {
						if (this.incomplete_references[i].origin.thread == thread && this.incomplete_references[i].forwards_death()) {
							// Update html
							this.incomplete_references[i].origin.update_reference(this.incomplete_references[i], this_private.reference_forwards_death_update_function, null);
							// Move to dead
							this.incomplete_references.splice(i, 1);
							this.add_dead_reference(this.incomplete_references[i]);
							--i;
							--j;
						}
					}

					// Trigger event
					this.trigger("thread_load", {
						thread: thread,
						context: context,
						thread_context: thread_context
					});
					// Complete?
					if (++context.threads_loaded == context.threads_total) {
						this.trigger("complete", {
							context: context
						});
					}
				},
				thread_update: function (thread, context, thread_context, state_old) {
					// Trigger event
					this.trigger("thread_update", {
						thread: thread,
						context: context,
						thread_context: thread_context,
						state_old: state_old
					});
				},
				thread_delete: function (board, thread_id) {
					var thread = null;

					if (board in this.board_map) {
						if (thread_id in this.board_map[board].thread_map) {
							thread = this.board_map[board].thread_map[thread_id];
						}
					}

					if (thread != null && !thread.deleted) {
						// Mark as deleted
						thread.deleted = true;

						// Signal
						this.trigger("thread_delete", {
							thread: thread
						});
					}
				},

				add_incomplete_reference: function (reference) {
					this.incomplete_references.push(reference);
				},
				check_for_incomplete_references: function (post) {
					for (var i = 0, j = this.incomplete_references.length, ref; i < j; ++i) {
						ref = this.incomplete_references[i];
						if (ref.target_post_id == post.id && ref.target_board == post.thread.board) {
							if (ref.target_thread_id === null) {
								if (post.thread.id == ref.origin.thread.id) {
									// Okay
									ref.origin.update_reference(ref, this_private.incomplete_reference_update_function, post);
									// Next
									this.incomplete_references.splice(i, 1);
									--i;
									--j;
								}
							}
							else if (ref.target_thread_id == post.thread.id) {
								// Okay
								ref.origin.update_reference(ref, this_private.incomplete_reference_update_function, post);
								// Next
								this.incomplete_references.splice(i, 1);
								--i;
								--j;
							}
						}
					}
				},

				add_dead_reference: function (reference) {
					this.dead_references.push(reference);
				},

				change_incomplete_to_dead_reference: function (reference) {
					for (var i = 0, j = this.incomplete_references.length; i < j; ++i) {
						if (this.incomplete_references[i] == reference) {
							// Dead
							this.add_dead_reference(reference);
							// Next
							this.incomplete_references.splice(i, 1);
							--i;
							--j;
						}
					}
				},

				get_thread: function (thread_id, board) {
					if (board in this.board_map) {
						var m = this.board_map[board].thread_map;
						if (thread_id in m) return m[thread_id];
					}
					return null;
				},
				get_post: function (post_id, board) {
					var p;
					for (var i = 0; i < this.threads.length; ++i) {
						if (this.threads[i].board == board && (p = this.threads[i].get_post(post_id)) != null) return p;
					}
					return null;
				},

				format_title: function (format, prefix, suffix) {
					if (!format) {
						format = (info.index ? this.title_format.index : this.title_format.thread);
					}

					format = this.header.format_board_info(format);

					this.main_context.html.find("head>title").html((prefix || "") + format + (suffix || ""));
				},

				on: function (event, callback, callback_data) {
					if (event in this.events) {
						this.events[event].callbacks.push([callback, callback_data]);
					}
				},
				off: function (event, callback) {
					if (event in this.events) {
						var e = this.events[event];
						if (e.triggering) {
							if (e.removals == null) e.removals = [];
							e.removals.push(callback);
						}
						else {
							e = e.callbacks;
							for (var i = 0; i < e.length; ++i) {
								if (e[i][0] == callback) {
									e.splice(i, 1);
									--i;
								}
							}
						}
					}
				},
				trigger: function (event, data) {
					// Trigger an event
					var e = this.events[event];
					/*!debug!*/assert(e, "Bad event [" + event + "]");
					e.triggering = true;
					for (var i = 0, j = e.callbacks.length; i < j; ++i) {
						/*!debug!*/assert(e.callbacks[i], "Bad event in [" + event + "]; " + i + "/" + j+"; "+e.callbacks[i][0].toString());
						/*!debug!*/try {
						e.callbacks[i][0].call(this, data, e.callbacks[i][1], event);
						/*!debug!*/}
						/*!debug!*/catch (err) {
						/*!debug!*/	assert(false, "Bad event in [" + event + "] (" + err + "); " + i + "/" + j+"; "+e.callbacks[i][0].toString());
						/*!debug!*/}
					}
					e.triggering = false;
					if (e.removals != null) {
						for (var i = 0; i < e.removals.length; ++i) {
							this.off(event, e.removals[i]);
						}
						e.removals = null;
					}
				},

				mark_post_as_me: function (post, source, password, save) {
					var post_key = this_private.format_my_post_key.call(this, post.thread.board, post.thread.id, post.id);

					this.my_posts[post_key] = {
						name: (source ? source.name.value : null),
						password: password,
						m_time: (new Date()).getTime(),
						s_time: post.timestamp
					};

					// Save
					if (save) {
						this_private.save_my_post.call(this, post_key, true);
					}

					// Update references
					post.update_all_reply_references();
					post.update_all_backlink_references();
				},
				unmark_post_as_me: function (board, thread_id, post_id, save) {
					// Arguments can also be: (post, save)
					var post_key, post = null;

					if (arguments.length > 0 && (arguments[0] instanceof xch.Post)) {
						post = arguments[0];
						post_key = this_private.format_my_post_key.call(this, post.thread.board, post.thread.id, post.id);

						save = arguments[1];
					}
					else {
						post_key = this_private.format_my_post_key.call(this, board, thread_id, post_id);
						if (
							board in this.board_map &&
							thread_id in this.board_map[board].thread_map &&
							post_id in this.board_map[board].thread_map[thread_id].post_map
						) {
							post = this.board_map[board].thread_map[thread_id].post_map[post_id];
						}
					}

					if (post_key in this.my_posts) {
						delete this.my_posts[post_key];

						if (save) {
							this_private.save_my_post.call(this, post_key, false);
						}
					}

					// Update references
					if (post != null) {
						post.update_all_reply_references();
						post.update_all_backlink_references();
					}
				},
				posted_by_me: function (board, thread_id, post_id) {
					if (arguments[0] instanceof xch.Post) {
						board = arguments[0].thread.board;
						thread_id = arguments[0].thread.id;
						post_id = arguments[0].id;
					}

					var post_key = this_private.format_my_post_key.call(this, board, thread_id, post_id);
					return (post_key in this.my_posts);
				},
				posted_by_me_data: function (board, thread_id, post_id) {
					if (arguments[0] instanceof xch.Post) {
						board = arguments[0].thread.board;
						thread_id = arguments[0].thread.id;
						post_id = arguments[0].id;
					}

					var post_key = this_private.format_my_post_key.call(this, board, thread_id, post_id);
					return (post_key in this.my_posts ? this.my_posts[post_key] : null);
				},

				delete_post_image: function (post, auto) {
					if (auto) {
						// Delete
						this_private.spawn_delete_report_message.call(this, null, post, true);
					}
					else {
						// Confirm delete
						if (this.delete_report_popup != null && this.delete_report_popup.open) return;

						this_private.spawn_delete_report_popup.call(this,
							null,
							"Deleting Image",
							"Are you sure you want to delete the image of >>" + post.id + "?",
							this_private.delete_post_image_action,
							post
						);
					}
				},
				delete_post: function (post, auto) {
					if (auto) {
						// Delete
						this_private.spawn_delete_report_message.call(this, null, post, false);
					}
					else {
						// Confirm delete
						if (this.delete_report_popup != null && this.delete_report_popup.open) return;

						this_private.spawn_delete_report_popup.call(this,
							null,
							"Deleting Post",
							"Are you sure you want to delete >>" + post.id + "?",
							this_private.delete_post_action,
							post
						);
					}
				},
				report_post: function (post, reason, auto) {
					if (auto) {
						// Report
						this_private.spawn_delete_report_message.call(this, reason || "", post, false);
					}
					else {
						// Confirm report
						if (this.delete_report_popup != null && this.delete_report_popup.open) return;

						this_private.spawn_delete_report_popup.call(this,
							reason || "",
							"Reporting Post",
							"Enter a reason why you're reporting >>" + post.id + ":",
							this_private.report_post_action,
							post
						);
					}
				},
				mark_post_as_me_ask: function (post, mark, auto) {
					if (auto) {
						// Unmark
						if (mark) {
							this.mark_post_as_me(post, null, null, true);
						}
						else {
							this.unmark_post_as_me(post, true);
						}
						// Message
						new xch.Message({
							type: "okay",
							title: "Post " + (mark ? "Marked" : "Unmarked"),
							html: (
								style.e("div")
								.append(style.t("Post "))
								.append(
									style.e("a", "message_link")
									.text(">>" + (post.id))
									.attr("href", info.create_url.to_post(post.thread.board, post.thread.id, post.id))
								)
								.append(style.t(" has been " + (mark ? "marked" : "unmarked") + " as yours"))
							)
						});
					}
					else {
						// Confirm delete
						if (this.post_marking_popup != null && this.post_marking_popup.open) return;

						this_private.spawn_post_marking_popup.call(this,
							(mark ? "Mark" : "Unmark") + " Post",
							"Are you sure you want to " + (mark ? "mark" : "unmark") + " >>" + post.id + " as yours?",
							(mark ? "Mark" : "Unmark"),
							this_private.mark_post_as_me_ask_action,
							{
								post: post,
								mark: mark
							}
						);
					}
				},

				set_favicon: function (url) {
					if (this.favicon_node != null) {
						this.favicon_node.remove();
					}
					this.main_context.html.find("head").append(
						(this.favicon_node = style.e("link"))
						.attr("rel", "shortcut icon")
						.attr("href", url)
					);
				},

				append_sourcing_info: function (container, post) {
					var text, href, sp_allow;
					for (var i = 0; i < this.sourcing.length; ++i) {
						// Spoiler allowing
						sp_allow = (post.image == null ? true : ((this.sourcing[i].allow_if_spoiler & (post.image.spoiler ? 1 : 2)) != 0));
						if (sp_allow) {
							// Format values
							text = xch.format_string(this.sourcing[i].text, this_private.sourcing_format_function, post);
							href = xch.format_string(this.sourcing[i].url, this_private.sourcing_format_function, post);
							// Add
							container.append(
								style.e("a", "post_file_info_extra_link post_file_info_extra_link_sourcing")
								.attr("sourcing_id", i)
								.attr("target", "_blank")
								.attr("href", href)
								.text(text)
							);
						}
					}
				},
				prepare_sourcing_info: function (container, post, instance) {
					// Update events
					var sl = container.children(".post_file_info_extra_link_sourcing");
					var sli, sid, data
					for (var i = 0; i < sl.length; ++i) {
						sli = $(sl[i]);
						sid = sli.attr("sourcing_id");
						if (sid !== undefined) {
							sid = parseInt(sid) || 0;
							if (sid >= 0 && sid < this.sourcing.length && this.sourcing[sid].options.length > 0) {
								// Bind event
								data = { content: this, post: post, instance: instance, sourcing_id: sid, menu: null };
								instance.bind_html_event(
									sli,
									"click", data, this_private.sourcing_info_click, false
								);
							}
						}
					}
				},

				check_html_for_error: function (html) {
					if ((html.find("title").html() || "").toLowerCase().trim() == "error") {
						var error = false;
						var h1s = html.find("header>h1");
						for (var i = 0; i < h1s.length; ++i) {
							if (($(h1s[i]).html() || "").toLowerCase().trim() == "error") {
								error = true;
							}
						}
						if (error) {
							error = html.find("div>h2");
							if (error.length > 0) {
								error = (error.html() || "").trim();
							}
							else {
								error = "Unknown error.";
							}
							return error;
						}
					}
					if (html.find("body>header").length == 0 || html.find("body>footer").length == 0) {
						return "Document not fully loaded.";
					}
					return null;
				},

				on_get_posts: function () {
					var posts = [];

					for (var i = 0, j, t_posts; i < this.threads.length; ++i) {
						t_posts = this.threads[i].posts;
						for (j = 0; j < t_posts.length; ++j) {
							if (t_posts[j].loaded()) {
								posts.push(t_posts[j]);
							}
						}
					}

					return posts;
				}

			};

			Content.Context = (function () {

				var Context = function (settings) {
					if (!settings) settings = {};

					this.info = settings.info || null;
					this.html = settings.html || null;
					this.is_new = settings.is_new || false;
					this.stylize = settings.stylize || false;
					this.html_target = settings.html_target || null;
					this.post_queue = (settings.post_queue ? settings.post_queue : new xch.PostQueue(xch.settings.parsing_group.size, xch.settings.parsing_group.interval));
					this.loader = settings.loader || null;

					this.threads_loaded = 0;
					this.threads_total = 0;
				};

				return Context;

			})();

			return Content;

		})(),

		// Thread and its posts
		Thread: (function () {

			var Thread = function () {
				this.id = null;
				this.posts = [];
				this.post_map = {};
				this.sticky = false;
				this.locked = false;
				this.board = null;
				this.posts_omitted = 0;
				this.images_omitted = 0;
				this.post_earliest = null;
				this.post_latest = null;
				this.visible = false;
				this.deleted = false;

				this.container = null;
			};

			var this_private = {

				post_add_sort_function: function (existing_post, inserting_post) {
					return (inserting_post.id > existing_post.id);
				}

			};

			Thread.prototype = {

				constructor: Thread,

				init: function (html, context) {
					var self = this;

					// Visible
					this.visible = context.is_new;

					// Info
					this.board = context.info.board;

					// OP post
					var op = html.find("div.post.op");

					// Omitted
					var om = op.find(".omitted");
					if (om.length > 0) {
						om = $(om[0]).text();
						om = /([0-9]+)\spost(s)?(\sand\s([0-9]+)\simage\srepl(y|ies)\somitted)?/i.exec(om);
						if (om) {
							this.posts_omitted = parseInt(om[1] || "0") || 0;
							this.images_omitted = parseInt(om[4] || "0") || 0;
						}
					}

					// Id
					var intro = op.find(".intro");
					this.id = parseInt((intro.find(".post_no:nth-of-type(2)").html() || "").trim()) || 0;

					// Icons
					var icons = intro.find(".icon");
					for (var i = 0; i < icons.length; ++i) {
						var icon = $(icons[i]);
						if (icon.hasClass("icon-pushpin")) {
							this.sticky = true;
						}
						else if (icon.hasClass("icon-lock")) {
							this.locked = true;
						}
					}

					// Container
					this.container = html;
				},
				parse: function (html, context, thread_context) {
					var self = this;

					// Stylize
					if (context.is_new && context.stylize) {
						html = this.stylize(html);
					}

					// Parse queue
					var parse_queue_new = [];
					var parse_queue_old = (xch.settings.post.fetching.new_priority ? [] : parse_queue_new);
					var parse_queue_length = 0;

					// Create posts
					var html_posts = html.find("div.post");
					for (var i = 0; i < html_posts.length; ++i) {
						var obj = $(html_posts[i]), existing;
						// Append
						var post = new xch.Post(this);
						post.init(obj, context);
						// Check for duplicate
						if (thread_context.is_new || (existing = this.get_post(post.id)) == null) {
							// New
							this.add_post(post, context, thread_context);
							parse_queue_new.push([
								post,
								obj,
								{
									is_new: true
								}
							]);
						}
						else {
							// Update
							parse_queue_old.push([
								existing,
								obj,
								{
									is_new: false
								}
							]);
						}
						++parse_queue_length;
					}

					// Set
					thread_context.posts_total = parse_queue_length;

					// Thread ready
					content.thread_ready(this, context, thread_context);

					// Start post parsing
					var i, j, p_q;
					for (i = 0, j = parse_queue_new.length, p_q; i < j; ++i) {
						p_q = parse_queue_new[i];
						p_q[0].parse(p_q[1], context, thread_context, p_q[2]);
					}
					for (i = 0, j = parse_queue_old.length, p_q; i < j; ++i) {
						p_q = parse_queue_old[i];
						p_q[0].parse(p_q[1], context, thread_context, p_q[2]);
					}

					// Fully loaded?
					if (thread_context.posts_total == 0) {
						content.thread_loaded(this, context, thread_context);
					}
				},
				add_post: function (post, context, thread_context) {
					// Add
					var post_n = xch.insert_element_sorted(this.posts, post, this_private.post_add_sort_function);
					post.t_id = post_n;
					// Update IDs after
					while (++post_n < this.posts.length) {
						// This loop never runs unless inserting posts out of order, so this doesn't consume any noteworthy time
						this.posts[post_n].t_id = post_n;
					}
					// Add to map
					this.post_map[post.id] = post;
					// Earliest/latest
					if (context.is_new && !post.op) {
						if (this.post_earliest == null || post.id < this.post_earliest) {
							this.post_earliest = post;
						}
						if (this.post_latest == null || post.id > this.post_latest) {
							this.post_latest = post;
						}
					}
					// Signal
					content.trigger("post_new", {
						post: post
					});
				},

				update_with: function (other_thread, context, thread_context) {
					// Old state
					var changed = false;
					var state_old = {
						sticky: this.sticky,
						locked: this.locked
					};

					// Compare settings, update locked/sticky status
					if (this.sticky != other_thread.sticky) {
						this.sticky = other_thread.sticky;
						changed = true;
					}
					if (this.locked != other_thread.locked) {
						this.locked = other_thread.locked;
						changed = true;
					}

					// Event
					if (changed) {
						content.thread_update(this, context, thread_context, state_old);
					}
				},

				post_loaded: function (post, context, thread_context, post_context, updated, update_data) {
					// Add
					thread_context.posts_loaded.push(post);
					// Events
					content.trigger("post_load", {
						post: post,
						context: context,
						thread_context: thread_context,
						post_context: post_context,
						updated: updated,
						update_data: (updated ? update_data : null)
					});
					// Fully loaded?
					if (thread_context.posts_loaded.length == thread_context.posts_total) {
						content.thread_loaded(this, context, thread_context);
					}
				},
				post_updated: function (post, update_data) {
					// Events
					content.trigger("post_load", {
						post: post,
						context: null,
						thread_context: { is_new: false },
						post_context: { is_new: false },
						updated: true,
						update_data: update_data
					});
				},

				ready: function () {
					return (this.id !== null);
				},
				loaded: function () {
					return (this.posts_loaded >= this.posts.length);
				},

				set_expanded: function (expand) {
					if (expand) {
						if (!this.container.hasClass("expanded")) {
							this.container.addClass("expanded");

							// Expand
							var insert_after = this.container.children(".post_container.op").first();

							// Get posts
							var posts = [], max_id = this.post_earliest.id, i, j;
							for (i = 0, j = this.posts.length; i < j; ++i) {
								// Not displayed
								if (this.posts[i].id < max_id && !this.posts[i].op) {
									xch.insert_element_sorted(posts, this.posts[i], this_private.post_add_sort_function);
								}
							}

							// Insert
							for (i = 0, j = posts.length; i < j; ++i) {
								insert_after.after(
									posts[i].instances[0].container
								);
								insert_after = posts[i].instances[0].container;
							}

						}
					}
					else {
						if (this.container.hasClass("expanded")) {
							this.container.removeClass("expanded");

							// Get posts
							var posts = [], max_id = this.post_earliest.id, i, j;
							for (i = 0, j = this.posts.length; i < j; ++i) {
								// Not displayed
								if (this.posts[i].id < max_id && !this.posts[i].op) {
									posts.push(this.posts[i]);
								}
							}

							// Remove
							for (i = 0, j = posts.length; i < j; ++i) {
								posts[i].instances[0].container.detach();
							}

						}
					}
				},

				stylize: function (html) {
					// New container
					var c_inner = style.e("div", "thread");

					// Replace
					this.container.after(c_inner);
					c_inner
					.attr("thread_id", this.id)
					.append(this.container.contents())
					.children("input,br.clear,hr,.delete").remove();
					this.container.remove();
					this.container = c_inner;

					// Remove last br
					c_inner.children("br").last().remove();

					// Return
					return this.container;
				},

				get_post: function (post_id) {
					if (post_id in this.post_map) return this.post_map[post_id];
					return null;
				}

			};

			return Thread;

		})(),

		// Post and its contents
		Post: (function () {

			var Post = function (thread) {
				this.thread = thread;

				this.id = null;
				this.t_id = null;
				this.op = false;
				this.image = null;
				this.timestamp = 0;
				this.comment_truncated = false;
				this.deleted = false;

				this.instances = [ null ];

				this.references = [];
				this.replies = [];
			};

			var events = {

				position_floating_post: function (container, data) {
					// Params
					var me = $(this);
					var win = $(window);
					var area = content.header.get_screen_area();
					area.left += win.scrollLeft();
					area.top += win.scrollTop();
					var this_pos = me.offset();
					var this_width = me.width();

					// Initial position
					var min_left = (data.instance.container.offset().left + style.post.inline.floating.offsets.x);
					var left = min_left;
					var top = (this_pos.top + me.height() + style.post.inline.floating.offsets.y);
					container.css({
						left: left + "px",
						top: top + "px",
						"max-width": ""
					});


					// Horizontal position
					var c_width = container.width();
					var w_change = false;

					// Link bounding
					if (
						left > this_pos.left + this_width ||
						left + c_width < this_pos.left
					) {
						// Center
						left = this_pos.left + (this_width - c_width) / 2;
					}

					// Screen bounding
					if (left + c_width > area.left + area.width) {
						left = area.left + area.width - c_width;
					}
					if (left < min_left) {
						left = min_left;
					}
					if (left < area.left) {
						left = area.left;
					}
					if (left + c_width > area.left + area.width) {
						c_width = area.width + area.left - left;
						w_change = true;
					}

					container.css("left", left + "px");
					if (c_width > 0 && w_change) container.css("max-width", c_width + "px");


					// Vertical position
					var c_height = container.outerHeight();
					var bottom = (this_pos.top - style.post.inline.floating.offsets.y);
					if (
						top + c_height > area.top + area.height &&
						(area.top + area.height - top) < (bottom - area.top) &&
						(bottom - c_height >= area.top)
					) {
						top = bottom - c_height;
						container.css("top", top + "px");
					}
				},
				update_loader_status: function (container, loader, text, progress_selector) {
					var text_str = "";

					switch (loader.status) {
						case xch.Loader.status.NOT_RUNNING:
						{
							text_str = "Loading thread...";

							container.find(progress_selector)
							.removeClass("ajax parse")
							.children()
								.removeClass("parse")
								.addClass("ajax")
								.css("width", "0%");
						}
						break;
						case xch.Loader.status.AJAX:
						{
							text_str = "Loading thread...";

							container.find(progress_selector)
							.removeClass("ajax parse")
							.children()
								.removeClass("parse")
								.addClass("ajax")
								.css("width", (loader.ajax_progress * 100).toFixed() + "%");
						}
						break;
						case xch.Loader.status.ERROR:
						{
							text_str = "Error loading";

							container.find(progress_selector)
							.removeClass("ajax parse")
							.children()
								.removeClass("parse ajax")
								.css("width", "0%");
						}
						break;
						case xch.Loader.status.THREAD_DELETED:
						{
							text_str = "Thread deleted";

							container.find(progress_selector)
							.removeClass("ajax parse")
							.children()
								.removeClass("parse ajax")
								.css("width", "0%");
						}
						break;
						case xch.Loader.status.PARSE_WAITING:
						{
							text_str = "Waiting to parse...";

							container.find(progress_selector)
							.removeClass("parse")
							.addClass("ajax")
							.children()
								.removeClass("ajax")
								.addClass("parse")
								.css("width", "0%");
						}
						break;
						case xch.Loader.status.PARSING:
						{
							text_str = "Parsing...";

							container.find(progress_selector)
							.removeClass("parse")
							.addClass("ajax")
							.children()
								.removeClass("ajax")
								.addClass("parse")
								.css("width", (loader.parse_progress * 100).toFixed() + "%");
						}
						break;
						case xch.Loader.status.COMPLETE:
						{
							text_str = "Complete";

							container.find(progress_selector)
							.removeClass("ajax")
							.addClass("parse")
							.children()
								.removeClass("ajax parse")
								.css("width", "0%");
						}
						break;
					}

					// Set text
					if (text) container.find(".post_body").text(text_str);
				},
				create_inline_instance: function (data, post_target) {
					// Create and parent
					data.inlined_instance = post_target.create_inline(data.instance);
					// Settings
					var container = data.inlined_instance.container;
					container.addClass("floating");
					// Highlight quote
					(data.backlink ?
						Post.get_html_references(data.inlined_instance.container, '[post="' + data.ref.target_post_id + '"][thread="' + data.ref.target_thread_id + '"][board="' + data.ref.target_board + '"]') :
						Post.get_html_backlinks(data.inlined_instance.container, '[post="' + data.ref.origin.id + '"][thread="' + data.ref.origin.thread.id+ '"][board="' + data.ref.origin.thread.board + '"]')
					).addClass("highlighted");
					// Add
					content.floating_container.append(container);
					// Position
					events.position_floating_post.call(this, container, data);
					// Add inline reference
					data.instance.add_inlined_instance(data.inlined_instance);
				},
				set_inline_floating: function (obj, container, data, floating, instance) {
					if (floating) {
						// Close
						obj.removeClass("open");
						var par = container.parent();

						// Move
						content.floating_container.append(container);
						container.addClass("floating").removeClass("focused");
						events.position_floating_post.call(this, container, data);

						// Remove more inlines
						if (data.inlined_instance != null) {
							data.inlined_instance.remove_inlines();
						}

						// Empty parent?
						if (data.backlink) {
							if (par.contents().length == 0) {
								par.addClass("empty");
							}
						}

						// Highlighting
						if (instance != null) {
							if (xch.settings.post.inlining.highlight_on_hover.if_floating.original) {
								instance.post.instances[0].container.addClass("focused");
							}
							else {
								instance.post.instances[0].container.removeClass("focused");
							}
						}
					}
					else {
						// Find container to place
						var target_container = null;
						if (data.backlink) {
							var par_container = data.instance.container.children(".post");
							var selector = ".post_embedded_backlink_container";
							target_container = par_container.children(".footer:not(.hidden)").children(selector);
							if (target_container.length == 0) {
								target_container = par_container.children(selector);
							}
						}

						if (target_container == null || target_container.length > 0) {
							// Open
							obj.addClass("open");

							// Move
							if (target_container != null) {
								target_container.prepend(container).removeClass("empty");
							}
							else {
								obj.after(container);
							}

							container.removeClass("floating");
							container.css({left:"",top:""});

							// Focus
							if (xch.settings.post.inlining.highlight_on_hover.if_embedded.target) {
								container.addClass("focused");
							}
							if (instance != null) {
								if (xch.settings.post.inlining.highlight_on_hover.if_embedded.original) {
									instance.post.instances[0].container.addClass("focused");
								}
								else {
									instance.post.instances[0].container.removeClass("focused");
								}
							}
						}
					}
				},
				set_thread_expansion: function (data, expand) {
					var thread = data.post.thread;
					thread.set_expanded(expand);

					if (expand) {
						// Update
						data.object.parent().removeClass("expand").addClass("shrink");
					}
					else {
						// Update
						data.object.parent().removeClass("shrink").addClass("expand");
					}
				},
				open_image_preview: function (obj, event_data, timeout) {
					// Spawn function
					var fcn = function () {
						event_data.open_timer = null;
						if (event_data.preview == null) {
							// Create new
							event_data.preview = event_data.image.create_preview(obj, event_data);
							// Add
							content.floating_container.append(event_data.preview);
						}
					};
					// Timeout
					if (event_data.open_timer !== null) {
						clearTimeout(event_data.open_timer);
					}
					// Time
					if (timeout > 0) {
						event_data.open_timer = setTimeout(fcn, timeout * 1000);
					}
					else {
						fcn();
					}
				},
				check_for_cycle: function (new_post, instance) {
					while (instance != null) {
						if (instance.post == new_post) return instance;
						instance = instance.parent;
					}
					return null;
				},
				check_on_screen: function (container, header) {
					// Get the inner container
					container = container.children(".post");

					var win = $(window);
					var area = header.get_screen_area();
					var c_pos = container.offset();
					var c_width = container.outerWidth();
					var c_height = container.outerHeight();
					area.left += win.scrollLeft();
					area.top += win.scrollTop();

					if (
						(c_pos.left <= area.left + area.width && c_pos.left + c_width >= area.left) &&
						(c_pos.top <= area.top + area.height && c_pos.top + c_height >= area.top)
					) {
						if (
							(c_pos.left >= area.left && c_pos.left + c_width <= area.left + area.width) &&
							(c_pos.top >= area.top && c_pos.top + c_height <= area.top + area.height)
						) {
							return "complete";
						}
						return "partial";
					}
					return "none";
				},

				reference_mouseenter: function (event) {
					if (event.data.inlined_instance == null) {
						var p_t = (event.data.backlink ? event.data.ref.origin : event.data.ref.target);
						if (p_t != null) {
							var cycle_object = null;
							if (xch.settings.post.inlining.allow_cyclic || (cycle_object = events.check_for_cycle(p_t, event.data.instance)) == null) {
								// On screen setting
								var on_screen = events.check_on_screen.call(this, p_t.instances[0].container, content.header);
								on_screen = xch.settings.post.inlining.on_screen[on_screen];
								if (on_screen.inline) {
									// Create
									events.create_inline_instance.call(this, event.data, p_t);
								}
							}

							// Highlighting
							if (cycle_object != null) {
								if (xch.settings.post.inlining.highlight_on_hover.if_floating.target) {
									cycle_object.container.addClass("focused");
								}
							}
							if (xch.settings.post.inlining.highlight_on_hover.if_floating.original) {
								p_t.instances[0].container.addClass("focused");
							}
						}
						else if (!event.data.backlink) {
							if (!event.data.ref.target_dead && event.data.ref.target_thread_id !== null) {
								// Message
								if (event.data.temporary == null) {
									// Create
									event.data.temporary = event.data.ref.origin.create_inline_message();
									// Settings
									var container = event.data.temporary;
									container.addClass("floating");
									// Add
									content.floating_container.append(container);
									// Set text
									container.find(".post_subject").text("Loading Post");
									// Update status
									events.update_loader_status.call(this, container, event.data.loader, true, ".post_header_progress");
									// Position
									events.position_floating_post.call(this, container, event.data);
								}
								else {
									// Highlight if embedded
									if (!event.data.temporary.hasClass("floating")) {
										if (xch.settings.post.inlining.highlight_on_hover.if_embedded.target) {
											event.data.temporary.addClass("focused");
										}
									}
								}
								// Run the loader (if it isn't already)
								event.data.loader.run();
							}
						}
					}
					else {
						// Highlighting
						if (!event.data.inlined_instance.container.hasClass("floating")) {
							if (xch.settings.post.inlining.highlight_on_hover.if_embedded.target) {
								event.data.inlined_instance.container.addClass("focused");
							}
							if (xch.settings.post.inlining.highlight_on_hover.if_embedded.original) {
								event.data.inlined_instance.post.instances[0].container.addClass("focused");
							}
						}
					}
				},
				reference_mouseleave: function (event) {
					// Unhighlight
					var p_t = (event.data.backlink ? event.data.ref.origin : event.data.ref.target);
					if (p_t != null) {
						var cycle_object = events.check_for_cycle(p_t, event.data.instance);
						if (cycle_object != null) {
							cycle_object.container.removeClass("focused");
						}
						p_t.instances[0].container.removeClass("focused");
					}
					if (event.data.inlined_instance != null) {
						// Unhighlight
						event.data.inlined_instance.container.removeClass("focused");

						// Remove
						if (event.data.inlined_instance.container.hasClass("floating")) {
							event.data.inlined_instance.destroy();
							event.data.inlined_instance = null;
						}
					}
					else if (event.data.temporary != null) {
						// Unhighlight
						event.data.temporary.removeClass("focused");

						// Remove
						if (event.data.temporary.hasClass("floating")) {
							event.data.temporary.remove();
							event.data.temporary = null;
						}
					}
				},
				reference_mousemove: function (event) {
				},
				reference_click: function (event) {
					if (event.which != 1) return true;

					// On screen check
					var p_t = (event.data.backlink ? event.data.ref.origin : event.data.ref.target);
					if (p_t != null) {
						var on_screen = events.check_on_screen.call(this, p_t.instances[0].container, content.header);
						on_screen = xch.settings.post.inlining.on_screen[on_screen];
						if (!on_screen.embed) {
							// Scroll to
							if (on_screen.scroll) {
								event.data.post.scroll_to(p_t.instances[0].container);
							}
							if (on_screen.highlight) {
								location.go_to(info.create_url.to_post(p_t.thread.board, p_t.thread.id, p_t.id));
							}
							// Done, don't inline
							return false;
						}
					}

					// Inline
					var container = (event.data.inlined_instance != null ? event.data.inlined_instance.container : event.data.temporary);
					if (container != null) {
						// Inline
						var obj = $(this);

						events.set_inline_floating.call(this, obj, container, event.data, obj.hasClass("open"), event.data.inlined_instance);
					}

					return false;
				},
				reference_update: function (event) {
					// Reference has been updated
					if (event.data.temporary != null) {
						var floating = event.data.temporary.hasClass("floating");
						var focused = event.data.temporary.hasClass("focused");
						// Remove
						event.data.temporary.remove();
						event.data.temporary = null;
						// Add
						var p_t = (event.data.backlink ? event.data.ref.origin : event.data.ref.target);
						if (p_t != null) {
							// Create
							events.create_inline_instance.call(this, event.data, p_t);

							// Inline
							if (!floating) {
								var container = event.data.inlined_instance.container;
								var obj = $(this);
								events.set_inline_floating.call(this, obj, container, event.data, false, event.data.inlined_instance);
							}

							if (focused) {
								event.data.inlined_instance.container.addClass("focused");
							}
						}
					}
				},

				reference_loader_progress: function (event, data) {
					// Progress
					if (data.temporary != null) {
						data.temporary.find(".post_header_progress_inner")
						.css("width", (event.ratio * 100).toFixed(2) + "%");
					}
				},
				reference_loader_status_change: function (event, data) {
					// Change status
					if (data.temporary != null) {
						events.update_loader_status.call(this, data.temporary, this, true, ".post_header_progress");
					}
				},

				notification_loader_progress: function (event, data) {
					// Update percent
					data.object.find(".post_notification_progress_inner")
					.css("width", (event.ratio * 100).toFixed(2) + "%");
				},
				notification_loader_status_change: function (event, data) {
					// Change status
					events.update_loader_status.call(this, data.object, this, false, ".post_notification_progress");
				},
				notification_loader_complete: function (event, data) {
					if (!data.complete) {
						// Expand thread
						var p = data.object.parent();
						if (p.hasClass("active")) {
							// Expand
							p.removeClass("active").addClass("loaded");
							events.set_thread_expansion.call(data.object, data, true);
						}
						else {
							p.addClass("loaded");
							events.set_thread_expansion.call(data.object, data, false);
						}
					}
				},
				notification_loader_post_load: function (event, data) {
					if (!data.complete && event.post == data.post) {
						// Expand
						var p = data.object.parent();
						if (p.hasClass("active")) {
							data.instance.container.children(".post").children(".post_body").addClass("full");
							p.addClass("shrink loaded").removeClass("active");
						}
						else {
							p.addClass("expand loaded");
						}
					}
				},

				notification_truncated_message_click: function (event) {
					if (event.which != 1) return true;

					var par = $(this).parent();

					if (par.hasClass("loaded")) {
						// Toggle
						var body = event.data.instance.container.children(".post").children(".post_body");
						if (body.hasClass("full")) {
							// Shrink
							var h1 = body.next().outerHeight();
							// Change display
							body.removeClass("full");
							par.removeClass("shrink").addClass("expand");
							// Scroll up
							var h2 = body.outerHeight();
							var top = $(document).scrollTop();
							$(document).scrollTop(Math.max(0, top - (h1 - h2)));
						}
						else {
							// Expand
							body.addClass("full");
							par.removeClass("expand").addClass("shrink");
						}
					}
					else {
						// Active
						if (par.hasClass("active")) {
							par.removeClass("active");
						}
						else {
							par.addClass("active");
						}
						// Run the loader
						event.data.loader.run();
					}

					return false;
				},
				notification_omitted_posts_click: function (event) {
					if (event.which != 1) return true;

					var par = $(this).parent();

					if (par.hasClass("loaded")) {
						// Expand/shrink
						events.set_thread_expansion.call(this, event.data, par.hasClass("expand"));
					}
					else {
						// Active
						if (par.hasClass("active")) {
							par.removeClass("active");
						}
						else {
							par.addClass("active");
						}
						// Run the loader
						event.data.loader.run();
					}

					return false;
				},

				header_identity_click: function (event) {
					if (event.which != 1) return true;

					return false;
				},
				header_number_click: function (event) {
					if (event.which != 1) return true;

					if ($(this).hasClass("post_no")) {
						// Post "No."
						if (info.index) return true;

						var post_id = event.data.post.id.toString();
						if (location.fragment == post_id) {
							location.go_to(
								info.create_url.to_thread(event.data.post.thread.board, event.data.post.thread.id)
							);
						}
						else {
							location.go_to(
								info.create_url.to_post(event.data.post.thread.board, event.data.post.thread.id, event.data.post.id)
							);
						}
					}
					else {
						// Post #
						content.qr.quote(event.data.post);
					}
					return false;
				},
				header_settings_click: function (event) {
					if (event.which != 1) return true;

					// Open settings menu
					if (event.data.instance.settings_menu == null) {
						// Form options
						var options = [];
						var event_data = event.data;

						if (!event.data.post.deleted) {
							options.push({
								text: "Report",
								on: {
									click: function (event) {
										if (event.which != 1) return true;

										event.data.option.menu.close();

										content.report_post(event_data.post, "", false);

										return false;
									}
								}
							});

							options.push({
								text: "Delete",
								on: {
									click: function (event) {
										if (event.which != 1) return true;

										event.data.option.menu.close();

										content.delete_post(event_data.post, false);

										return false;
									}
								}
							});
							if (event.data.post.image != null && event.data.post.image.good() && !event.data.post.image.deleted) {
								options.push({
									text: "Delete image",
									on: {
										click: function (event) {
											if (event.which != 1) return true;

											event.data.option.menu.close();

											content.delete_post_image(event_data.post, false);

											return false;
										}
									}
								});
							}
						}
						if (content.posted_by_me(event.data.post)) {
							options.push({
								text: "Unmark as (you)",
								on: {
									click: function (event) {
										if (event.which != 1) return true;

										event.data.option.menu.close();

										// Unmark
										content.mark_post_as_me_ask(event_data.post, false, false);

										return false;
									}
								}
							});
						}

						// Create
						if (options.length > 0) {
							event.data.instance.settings_menu = new xch.Menu($(this), {
								close_on_mouseleave: false,
								fit_width_min: true,
								keep_on_screen: true,
								fixed_z: null,
								open: "down",
								on: {
									close: {
										callback_data: event.data.instance,
										callback: events.on_settings_menu_close
									}
								},
								options: options
							});
						}
					}
					else {
						event.data.instance.settings_menu.close();
					}
				},

				on_settings_menu_close: function (event, instance) {
					instance.settings_menu = null;
				},

				image_click: function (event) {
					if (event.which != 1) return true;

					// Non-deleted image
					var obj = $(this);
					if (obj.attr("href") !== undefined) {
						// What to do on click
						var opt = xch.settings.image_preview.click;
						opt = (event.data.preview == null ? opt.if_closed : opt.if_open);
						var par = obj.parent();
						if (par.hasClass("embed")) opt = "embed";

						// Switch
						if (opt == "toggle") {
							if (event.data.preview == null) {
								// Open
								events.open_image_preview.call(this, obj, event.data, 0);
							}
							else {
								// Close
								event.data.image.close_preview(event.data);
							}
						}
						else if (opt == "tab") {
							// Let it open in a new tab
							return true;
						}
						else if (opt == "embed") {
							// Embed toggle
							var embed = !par.hasClass("embed");
							event.data.post.set_image_embedded(embed, event.data.instance, par);
							// Close
							if (embed) event.data.image.destroy_preview(event.data);
						}
						// Else, do nothing

						// Cancel event
						return false;
					}
				},
				image_mouseenter: function (event) {
					// Non-deleted image
					var obj = $(this);
					if (obj.attr("href") !== undefined && !obj.parent().hasClass("embed")) {
						if (event.data.preview == null) {
							if (event.data.open_timer === null && event.data.image.previewable()) {
								// Time
								var t = xch.settings.image_preview;
								t = (event.data.image.spoiler ? t.open_timeout_spoiler : t.open_timeout);
								// Spawn
								events.open_image_preview.call(this, obj, event.data, t);
							}
						}
						else {
							// Cancel closing
							event.data.image.close_preview_cancel(event.data);
						}
					}
				},
				image_mouseleave: function (event) {
					// Non-deleted image
					if ($(this).attr("href") !== undefined) {
						// Remove
						if (event.data.preview != null) {
							event.data.image.close_preview(event.data);
						}
						else if (event.data.open_timer !== null) {
							clearTimeout(event.data.open_timer);
							event.data.open_timer = null;
						}
					}
				},
				image_window_scroll: function (event) {
					if (event.data.preview != null) {
						// Position
						event.data.image.position_preview(event.data.object, event.data.preview, event.data, false);
					}
				},
				image_window_resize: function (event) {
					if (event.data.preview != null) {
						// Position
						event.data.image.position_preview(event.data.object, event.data.preview, event.data, false);
					}
				}

			};

			var this_private = {

				backlink_insert_sort_function: function (existing_element, inserting_element, ref) {
					// Sorting function
					var b = existing_element.attr("board");
					var p = parseInt(existing_element.attr("post"));
					return (b == ref.target_board ? p < ref.origin.id : (b == ref.origin.thread.board ? p < ref.origin.id : b < ref.origin.thread.board));
				},

				post_insert_sort_function: function (existing_element, inserting_element) {
					return ((parseInt(inserting_element.attr("post_id") || "0") || 0) > (parseInt(existing_element.attr("post_id") || "0") || 0));
				},

				parse_immediate_new: function (data) {
					var self = this;

					// Create instance
					var instance = new Post.Instance(this, data.html);
					this.instances[0] = instance;
					var html = data.html;

					// Intro
					var intro = html.find(".intro");


					// Find image
					var img = null, img_data;
					if (this.op) {
						img_data = html.parent().children(".fileinfo");
						img = html.prev();
						if (img.prop("tagName") != "IMG") {
							img = img.children("img");
							if (img.length == 0) img = null;
						}
					}
					else {
						img_data = html.find(".fileinfo");
						if (img_data.length == 0) {
							if ((img = intro.next()).prop("tagName") != "IMG") img = null;
						}
						else {
							if ((img = img_data.next().children("img")).prop("tagName") != "IMG") img = null;
						}
					}

					// Image data
					if (img_data.length > 0 || img != null) {
						// Has image
						this.image = new xch.Image();
						this.image.parse((img_data.length > 0 ? $(img_data[0]) : null), img, data.context.info);
					}


					// Time
					if ((o = intro.find("time[datetime]")).length > 0) {
						var m = /([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)/i.exec(o.attr("datetime") || "");
						if (m) {
							this.timestamp = (new Date(
								parseInt(m[1]),
								parseInt(m[2]) - 1,
								parseInt(m[3]),
								parseInt(m[4]),
								parseInt(m[5]),
								parseInt(m[6])
							)).getTime();
						}
					}


					// Stylizing data
					var stylize_data = {
						subject: null,
						name: null,
						email: null,
						tripcode: null,
						capcode: null,
						comment: null
					};

					// Subject
					var o;
					if ((o = intro.find(".subject")).length > 0) {
						stylize_data.subject = (o.text() || "").trim();
					}
					// Name
					if ((o = intro.find(".name")).length > 0) {
						stylize_data.name = (o.text() || "").trim();
					}
					// Email
					if ((o = intro.find(".email")).length > 0) {
						stylize_data.email = (o.attr("href") || "").substr(7);
					}
					// Tripcode
					if ((o = intro.find(".trip")).length > 0) {
						stylize_data.tripcode = (o.text() || "").trim();
					}
					// Tripcode
					if ((o = intro.find(".capcode")).length > 0) {
						stylize_data.capcode = (o.text() || "").trim().replace(/^\s*#+\s*/, "");
					}

					// Comment
					stylize_data.comment = style.set_class(html.find(".body"));
					this.comment_truncated = (stylize_data.comment.find(".toolong").length > 0);

					// Stylize
					if (data.context.stylize) {
						this_private.stylize.call(this, this.instances[0], (data.context.html_target == null), stylize_data);
						this.prepare(this.instances[0]);
					}

					// Incomplete reference checking
					content.check_for_incomplete_references(this);

					// Loaded
					this.thread.post_loaded(this, data.context, data.thread_context, data.post_context, false);

				},
				parse_immediate_old: function (data) {
					var changed = false;
					var update_data = {
						comment_fully_loaded: false,
						image_deleted: false
					};
					var html = data.html;

					// Update comment (if truncated)
					if (this.comment_truncated && html.find(".body").find(".toolong").length == 0) {
						// Get the remaining comment
						var com = style.set_class(html.find(".body"), "post_body_full"), new_com;
						this_private.stylize_comment.call(this, com);
						// Insert
						for (var i = 0, j = this.instances.length; i < j; ++i) {
							// Prepare
							new_com = (i == 0 ? com : com.clone());
							this.prepare_comment(this.instances[i], new_com);
							// Append
							this.instances[i].container.children(".post").children(".post_body").after(new_com);
						}

						// Not truncated
						this.comment_truncated = false;
						changed = true;
						update_data.comment_fully_loaded = true;
					}

					// Intro
					var intro = html.find(".intro");

					// Find image
					var img = null, img_data;
					if (this.op) {
						img_data = html.parent().children(".fileinfo");
						img = html.prev();
						if (img.prop("tagName") != "IMG") {
							img = img.children("img");
							if (img.length == 0) img = null;
						}
					}
					else {
						img_data = html.find(".fileinfo");
						if (img_data.length == 0) {
							if ((img = intro.next()).prop("tagName") != "IMG") img = null;
						}
						else {
							if ((img = img_data.next().children("img")).prop("tagName") != "IMG") img = null;
						}
					}

					// Image data
					var image = null;
					if (img_data.length > 0 || img != null) {
						// Has image
						image = new xch.Image();
						image.parse((img_data.length > 0 ? $(img_data[0]) : null), img, data.context.info);
					}

					// Check if image is deleted
					if ((this.image != null && !this.image.deleted) && (image == null || image.deleted)) {
						// Image deleted
						this.mark_as_dead_image(true);

						// Changed
						changed = true;
						update_data.image_deleted = true;
					}

					// Loaded
					this.thread.post_loaded(this, data.context, data.thread_context, data.post_context, changed, update_data);
				},

				stylize: function (instance, replace_old_style, stylize_data) {
					// New container
					var outer = style.e("div", "post_container " + (this.op ? "op" : "reply"));
					var inner = style.e("div", "post");
					outer.attr("post_id", this.id);

					//{ Header
						var header = style.e("div", "post_header")

						// Subject
						if (stylize_data.subject !== null) {
							var subject_container = style.e("span", "post_subject").text(stylize_data.subject);
							header.append(subject_container);
						}

						// Name
						var has_name = false;
						var name_container = style.e("a", "post_identity");
						if (stylize_data.name !== null) {
							name_container.append(
								style.e("span", "post_identity_name").text(stylize_data.name)
							);
							has_name = true;
						}
						if (stylize_data.tripcode !== null) {
							name_container.append(
								style.e("span", "post_identity_tripcode").text(stylize_data.tripcode)
							);
							has_name = true;
						}
						if (stylize_data.capcode !== null) {
							name_container.append(
								style.e("span", "post_identity_capcode_indicator").text(style.post.header.identity.capcode.indicator)
							)
							.append(
								style.e("span", "post_identity_capcode").text(stylize_data.capcode)
							);

							var cc = stylize_data.capcode.toLowerCase();
							if (cc.indexOf("admin") >= 0) name_container.addClass("admin");
							else if (cc.indexOf("mod") >= 0) name_container.addClass("mod");

							has_name = true;
						}
						if (has_name) {
							if (stylize_data.email !== null) {
								name_container.attr("href", "mailto:" + stylize_data.email);
							}
							header.append(name_container);
						}

						// More header stuff
						header.append(
							style.e("span", "post_time")
							.text(xch.date.format(this.timestamp + xch.settings.post.time.offset, xch.settings.post.time.format))
						)
						.append(
							style.e("a", "post_no")
							.attr("href", info.create_url.to_post(this.thread.board, this.thread.id, this.id))
							.text(style.post.header.number.indicator)
						)
						.append(
							style.e("a", "post_number no_spacing")
							.attr("href", info.create_url.to_post(this.thread.board, this.thread.id, this.id))
							.text(this.id)
						);

						// Icons
						if (this.op) {
							// Sticky
							if (this.thread.sticky) {
								header.append(
									style.e("span", "post_icon sticky")
									.attr("title", "Sticky")
								);
							}

							// Locked
							if (this.thread.locked) {
								header.append(
									style.e("span", "post_icon locked")
									.attr("title", "Locked")
								);
							}

							// Reply
							if (info.index) {
								header.append(
									style.e("span", "post_option reply_to no_inline")
									.append(
										style.e("a", "post_option_text")
										.attr("href", info.create_url.to_thread(this.thread.board, this.thread.id))
									)
								);
							}
						}

						// Backlinks
						header.append(
							style.e("span", "post_backlinks empty")
						);

						// Options
						header.append(
							style.e("span", "post_settings")
						);

					//}

					// File info
					var file_info = null, file_image = null, file_extras = null;
					if (this.image != null) {
						if (!this.image.deleted) {
							file_info = style.e("div", "post_file_info")
							.append(
								style.e("a", "post_file_info_file")
								.text(this.image.filename_original)
								.attr("href", this.image.url)
								.attr("target", "_blank")
							)
							.append(
								style.e("span", "post_file_info_attributes")
								.append(
									style.e("span")
									.text(this.image.filesize_label[0] + " " + this.image.filesize_label[1] + ", " + this.image.width + style.symbols.mult + this.image.height)
								)
							)
							.append(
								(file_extras = style.e("span", "post_file_info_extra_links"))
							);
						}

						var img;
						file_image = style.e("div", "post_image_container").append(
							style.e("a", "post_image_link")
							.attr("href", this.image.url)
							.attr("target", "_blank")
							.append(
								(img = style.e("img", "post_image"))
								.attr("src", this.image.thumbnail)
								.attr("title", "")
								.attr("alt", "")
							)
						);
						this.image.stylize_size(img, this.op);
					}

					// Comment
					stylize_data.comment.find(".toolong").remove();
					stylize_data.comment.addClass("post_body");
					this_private.stylize_comment.call(this, stylize_data.comment);

					// Notifications
					var notifications = style.e("div", "post_notifications empty");
					if (this.op && (this.thread.posts_omitted > 0 || this.thread.images_omitted > 0)) {
						notifications.removeClass("empty").append(
							style.e("div", "post_notification omitted")
							.append(
								style.e("a", "post_notification_message")
								.attr("href", info.create_url.to_thread(this.thread.board, this.thread.id))
								.append(
									style.e("div", "post_notification_progress").html(
										style.e("div", "post_notification_progress_inner")
									)
								)
								.append(
									style.e("span", "post_notification_text")
									.attr("omitted_value", this.thread.posts_omitted + " repl" + (this.thread.posts_omitted == 1 ? "y" : "ies") + (this.thread.images_omitted > 0 ? (" and " + this.thread.images_omitted + " image" + (this.thread.images_omitted == 1 ? "" : "s")) : ""))
								)
							)
						);
					}
					if (this.comment_truncated) {
						notifications.removeClass("empty").append(
							style.e("div", "post_notification truncated")
							.append(
								style.e("a", "post_notification_message")
								.attr("href", info.create_url.to_post(this.thread.board, this.thread.id, this.id))
								.append(
									style.e("div", "post_notification_progress").html(
										style.e("div", "post_notification_progress_inner")
									)
								)
								.append(style.e("span", "post_notification_text"))
							)
						);
					}

					// Top backlinks
					var top_backlink_container = style.e("div", "post_embedded_backlink_container empty");

					// Footer
					var footer = style.e("div", "post_footer hidden empty");
					footer.append(
						style.e("span", "post_backlinks")
					)
					.append(
						style.e("div", "post_embedded_backlink_container empty")
					);
					if (xch.settings.post.footer_backlinks) {
						footer.removeClass("hidden");
					}

					// Source info
					if (file_extras != null) {
						content.append_sourcing_info(file_extras, this);
					}

					// Add contents
					if (!this.op) {
						inner.append(header).append(top_backlink_container);
					}
					if (file_info != null) inner.append(file_info);
					if (file_image != null) inner.append(file_image);
					if (this.op) {
						inner.append(header).append(top_backlink_container);
					}
					inner
					.append(stylize_data.comment)
					.append(style.e("div", "post_body_after"))
					.append(notifications)
					.append(footer);
					outer.append(inner);

					// Replace
					if (replace_old_style) {
						// Remove old stuff
						var p, par, cont;
						if (this.op) {
							if ((p = instance.container.prev()).length > 0 && (p.prop("tagName") == "A" || p.prop("tagName") == "IMG")) {
								p.remove();
							}
							if ((p = instance.container.prev()).length > 0 && p.hasClass("fileinfo")) {
								p.remove();
							}
						}
						else {
							// Remove separator after
							if ((p = instance.container.prev()).length > 0 && p.prop("tagName") == "BR") {
								p.remove();
							}
						}

						// Replace and remove old
						cont = instance.container[0];
						par = cont.parentNode;
						if (par != null) {
							var ns = cont.nextSibling;

							par.removeChild(cont);

							if (ns == null) {
								par.appendChild(outer[0]);
							}
							else {
								par.insertBefore(outer[0], ns);
							}
						}
					}
					// New
					instance.container = outer;
				},
				stylize_comment: function (comment) {
					var self = this;

					// Greentext
					var quotes = comment.find(".quote");
					for (var i = 0; i < quotes.length; ++i) {
						// Dead links
						var obj = $(quotes[i]);
						var c = obj.contents();
						if (c.length == 1) {
							c = /^>>(?:>\/(\w+)\/)?([0-9]+)$/i.exec(c.text());
							if (c) {
								// Set
								var board = c[1] || this.thread.board;
								var post_id = parseInt(c[2]);
								var thread_id = null;

								// Add reference
								var rr, ref = this.add_reference(board, thread_id, post_id);

								// Make a resurrected quote
								obj.after(
									(rr = style.e("a", "post_reference resurrected"))
									.attr("board", board)
									.attr("post", post_id)
									.attr("href", info.create_url.to_post(board, this.thread.id, post_id))
								);
								style.format_reference_style(rr, ref);

								// Remove dead
								obj.remove();
								return;
							}
						}

						// Add class
						style.set_class(obj, "quote");
					}

					// Spoilers
					style.set_class(comment.find(".spoiler"), "spoiler");

					// Links
					var links = comment.find("a");
					var re = /\/\/boards\.38chan\.net\/(\w+)\/res\/([0-9]+)\.html#([0-9]+)/i;
					for (var i = 0; i < links.length; ++i) {
						var obj = $(links[i]);
						var m = re.exec(obj.attr("href") || "");
						if (m) {
							// Reference
							var board = m[1];
							var thread_id = parseInt(m[2]);
							var post_id = parseInt(m[3]);
							// Update element
							style.set_class(obj, "post_reference")
							.removeAttr("onclick")
							.off("click")
							.attr("board", board)
							.attr("thread", thread_id)
							.attr("post", post_id)
							.attr("href", info.create_url.to_post(board, thread_id, post_id));
							// Add reference
							var ref = this.add_reference(board, thread_id, post_id);
							// Re-format
							style.format_reference_style(obj, ref);
						}
						else {
							obj.addClass("post_link");
						}
					}
				},
				stylize_reference: function (ref) {
					if (ref.target != null && ref.target != ref.origin) {
						// Update reply count
						for (var i = 0, j = ref.target.instances.length; i < j; ++i) {
							// Find post
							var c = ref.target.instances[i].container.children(".post");

							// Add backlink
							var selector = ".post_backlinks";
							var footer = c.children(".post_footer:not(.hidden)");
							var backlink_container = (footer.length > 0 ? footer : c.children(".post_header")).find(selector);
							var backlink;
							// Backlink
							(backlink = style.e("a", "post_backlink"))
							.attr("board", ref.origin.thread.board)
							.attr("thread", ref.origin.thread.id)
							.attr("post", ref.origin.id)
							.attr("href", info.create_url.to_post(ref.origin.thread.board, ref.origin.thread.id, ref.origin.id));
							style.format_backlink_style(backlink, ref);
							// Insert
							xch.insert_dom_element_sorted(backlink_container, backlink, this_private.backlink_insert_sort_function, ref);
							(footer.length > 0 ? footer : backlink_container).removeClass("empty");

							// Reference links
							ref.target.prepare_backlink(backlink, ref.target.instances[i]);
						}
					}
				},

				mark_as_dead_update_reference_function: function (ref, target_post) {
					// Dead
					ref.target_dead = true;
				},

				get_comment_plaintext_dom_filter: function (obj, parent) {
					return (!obj.hasClass("inline post_container"));
				},

				on_embedded_post_image_load: function (event) {
					event.data.obj.addClass("loaded");
				},

				prepare_notification_truncated: function (obj, instance) {
					var data = { post: this, instance: instance, loader: null, object: obj };
					data.loader = xch.Loader.get_thread(
						this.thread.board,
						this.thread.id,
						null,
						{
							progress: function (event) { return events.notification_loader_progress.call(this, event, data); },
							post_load: function (event) { return events.notification_loader_post_load.call(this, event, data); },
							status_change: function (event) { return events.notification_loader_status_change.call(this, event, data); }
						}
					);
					instance.bind_html_event(
						obj,
						"click", data, events.notification_truncated_message_click, false
					);
				},
				prepare_notification_omitted: function (obj, instance) {
					var data = { post: this, instance: instance, loader: null, object: obj };
					data.loader = xch.Loader.get_thread(
						this.thread.board,
						this.thread.id,
						null,
						{
							progress: function (event) { return events.notification_loader_progress.call(this, event, data); },
							complete: function (event) { return events.notification_loader_complete.call(this, event, data); },
							status_change: function (event) { return events.notification_loader_status_change.call(this, event, data); }
						}
					);
					instance.bind_html_event(
						obj,
						"click", data, events.notification_omitted_posts_click, false
					);
				}

			};

			Post.prototype = {

				constructor: Post,

				init: function (html, context) {
					// OP and id
					this.op = html.hasClass("op");
					this.id = parseInt((html.find(".intro .post_no:nth-of-type(2)").html() || "").trim()) || 0;
				},
				parse: function (html, context, thread_context, post_context) {
					// Queue
					context.post_queue.queue(this, {
						html: html,
						context: context,
						thread_context: thread_context,
						post_context: post_context
					});
				},
				parse_immediate: function (data) {
					if (data.post_context.is_new) {
						this_private.parse_immediate_new.call(this, data);
					}
					else {
						this_private.parse_immediate_old.call(this, data);
					}
				},
				add_reference: function (board, thread_id, post_id) {
					var ref;
					if ((ref = Post.Reference.find(this, board, thread_id, post_id)) == null) {
						// New
						ref = new Post.Reference(this, board, thread_id, post_id);

						// Stylize
						this_private.stylize_reference.call(this, ref);
					}
					return ref;
				},
				update_reference: function (ref, update_function, update_function_data) {
					// Selector
					var selector = ".post_reference";
					if (ref.target_board !== null) selector += '[board="' + ref.target_board + '"]';
					if (ref.target_thread_id !== null) selector += '[thread="' + ref.target_thread_id + '"]';
					if (ref.target_post_id !== null) selector += '[post="' + ref.target_post_id + '"]';

					// Update
					if (update_function) update_function.call(this, ref, update_function_data, this);

					// Fix origin
					for (var i = 0, j = ref.origin.instances.length; i < j; ++i) {
						// Find post comment
						var c = ref.origin.instances[i].container.children(".post").children(".post_body");
						// Check each
						var h_refs = c.find(selector);
						for (var k = 0; k < h_refs.length; ++k) {
							// Must have correct parent
							var obj = $(h_refs[k]);
							if (obj.parents(".post_body")[0] == c[0]) {
								// Fix reference
								ref.origin.update_reference_html(ref, obj, ref.origin.instances[i]);
							}
						}
					}
				},
				update_reference_style: function (ref) {
					this_private.stylize_reference.call(this, ref);
				},
				update_reference_html: function (ref, obj, instance) {
					// Change attributes
					var okay = true;
					if (ref.target_board !== null) {
						obj.attr("board", ref.target_board);
					}
					else {
						okay = false;
						obj.removeAttr("board");
					}
					if (ref.target_thread_id !== null) {
						obj.attr("thread", ref.target_thread_id);
					}
					else {
						okay = false;
						obj.removeAttr("thread");
					}
					if (ref.target_post_id !== null) {
						obj.attr("post", ref.target_post_id);
					}
					else {
						okay = false;
						obj.removeAttr("post");
					}

					// Change text and link
					if (okay) {
						obj.attr("href", info.create_url.to_post(ref.target_board, ref.target_thread_id, ref.target_post_id));
					}
					else {
						obj.removeAttr("href");
					}
					style.format_reference_style(obj, ref);

					// Prepare
					if (instance) this.prepare_reference(obj, instance);
				},
				update_backlink: function (ref, update_function, update_function_data) {
					// Selector
					var selector = ".post_backlink";
					selector += '[board="' + ref.origin.thread.board + '"]';
					selector += '[thread="' + ref.origin.thread.id + '"]';
					selector += '[post="' + ref.origin.id + '"]';

					// Update
					if (update_function) update_function.call(this, ref, update_function_data, this);
					if (ref.target == null) return;

					// Fix origin
					for (var i = 0, j = ref.target.instances.length; i < j; ++i) {
						// Find post
						var c = ref.target.instances[i].container.children(".post");

						// Add backlink
						var footer = c.children(".post_footer:not(.hidden)");
						var header = c.children(".post_header");
						var backlink_container = header.add(footer).find(".post_backlinks");

						// Check each
						var backlinks = backlink_container.find(selector);
						for (var k = 0; k < backlinks.length; ++k) {
							// Check
							var obj = $(backlinks[i]);
							obj
							.attr("board", ref.origin.thread.board)
							.attr("thread", ref.origin.thread.id)
							.attr("post", ref.origin.id)
							.attr("href", info.create_url.to_post(ref.origin.thread.board, ref.origin.thread.id, ref.origin.id));
							style.format_backlink_style(obj, ref);
						}
					}
				},

				get_reference: function (board, thread_id, post_id) {
					for (var i = 0, ref; i < this.references.length; ++i) {
						ref = this.references[i];
						if (ref.target_board == board && ref.target_thread_id === thread_id && ref.target_post_id == post_id) return ref;
					}
					return null;
				},
				get_backlink: function (board, thread_id, post_id) {
					for (var i = 0, post; i < this.replies.length; ++i) {
						post = this.replies[i].origin;
						if (post.thread.board == board && post.thread.id === thread_id && post.id == post_id) return this.replies[i];
					}
					return null;
				},

				prepare: function (instance) {
					var obj, data;

					// Comment
					this.prepare_comment(instance, null);
					var p_container = instance.container.children(".post");
					// Backlinks
					var backlinks = instance.container.find(".post_backlink");
					for (var i = 0; i < backlinks.length; ++i) {
						// Prepare
						this.prepare_backlink($(backlinks[i]), instance);
					}

					if (this.image != null) {
						// Data
						obj = instance.container.find(".post_image_link");
						data = {
							post: this,
							instance: instance,
							image: this.image,
							preview: null,
							object: obj,
							close_timer: null,
							zoom: 1,
							mouse_last: {x:0,y:0},
							bounding: null,
							open_timer: null
						};

						// Image
						instance.bind_html_event(
							obj,
							"click", data, events.image_click, false
						);
						instance.bind_html_event(
							obj,
							"mouseenter", data, events.image_mouseenter, false
						);
						instance.bind_html_event(
							obj,
							"mouseleave", data, events.image_mouseleave, false
						);
						$(window)
						.on("scroll", data, events.image_window_scroll)
						.on("resize", data, events.image_window_resize);

						// Sourcing
						var ex = p_container.children(".post_file_info").children(".post_file_info_extra_links");
						if (ex.length > 0) {
							content.prepare_sourcing_info(ex, this, instance);
						}
					}

					// Data
					data = { post: this, instance: instance };

					// Header
					instance.bind_html_event(
						instance.container.find(".post_identity"),
						"click", data, events.header_identity_click, false
					);
					instance.bind_html_event(
						instance.container.find(".post_no,.post_number"),
						"click", data, events.header_number_click, false
					);
					instance.bind_html_event(
						instance.container.find(".post_settings"),
						"click", data, events.header_settings_click, false
					);

					// Notifications
					obj = instance.container.find(".post_notification.truncated>.post_notification_message");
					if (obj.length > 0) {
						this_private.prepare_notification_truncated.call(this, obj, instance);
					}
					obj = instance.container.find(".post_notification.omitted>.post_notification_message");
					if (obj.length > 0) {
						this_private.prepare_notification_omitted.call(this, obj, instance);
					}

					// Trigger prepare
					api.signal("post_prepare", {
						post: this,
						post_instance: instance
					});
				},

				prepare_comment: function (instance, html) {
					// Find html
					if (html == null) {
						html = instance.container.children(".post").children(".post_body,.post_body_full");
					}

					// Reference links
					var refs = html.find(".post_reference");
					for (var i = 0; i < refs.length; ++i) {
						this.prepare_reference($(refs[i]), instance);
					}
				},
				prepare_reference: function (obj, instance) {
					// Data
					var e = instance.get_html_event(obj[0], "mouseenter");
					if (e !== null) {
						// Update event
						events.reference_update.call(obj[0], { data: e.data });
					}
					else {
						// New
						var data = {
							post: this,
							backlink: false,
							instance: instance,
							inlined_instance: null,
							ref: null,
							loader: null,
							temporary: null
						};
						// Get reference
						var b = obj.attr("board");
						var t = obj.attr("thread");
						var p = parseInt(obj.attr("post"));
						t = (t === undefined ? null : parseInt(t));
						data.ref = this.get_reference(b, t, p);
						/*!debug!*/assert(data.ref !== null, "Bad reference to " + b + "/" + t + "/" + p);
						// Get loader
						if (!data.ref.target_dead && data.ref.target_thread_id !== null) {
							data.loader = xch.Loader.get_thread(
								data.ref.target_board,
								data.ref.target_thread_id,
								null,
								{
									progress: function (event) { return events.reference_loader_progress.call(this, event, data); },
									status_change: function (event) { return events.reference_loader_status_change.call(this, event, data); }
								}
							);
						}

						// Events
						instance.unbind_html_event(obj, "mouseenter");
						instance.unbind_html_event(obj, "mouseleave");
						instance.unbind_html_event(obj, "mousemove");
						instance.unbind_html_event(obj, "click");
						instance.bind_html_event(obj, "mouseenter", data, events.reference_mouseenter, true);
						instance.bind_html_event(obj, "mouseleave", data, events.reference_mouseleave, true);
						instance.bind_html_event(obj, "mousemove", data, events.reference_mousemove, true);
						instance.bind_html_event(obj, "click", data, events.reference_click, true);
					}
				},
				prepare_backlink: function (obj, instance) {
					// Data
					var e = instance.get_html_event(obj[0], "mouseenter");
					if (e !== null) {
						// Update event
						events.reference_update.call(obj[0], { data: e.data });
					}
					else {
						var data = {
							post: this,
							backlink: true,
							instance: instance,
							inlined_instance: null,
							ref: null,
							loader: null,
							temporary: null
						};
						// Get reference
						var b = obj.attr("board");
						var t = obj.attr("thread");
						var p = parseInt(obj.attr("post"));
						t = (t === undefined ? null : parseInt(t));
						data.ref = this.get_backlink(b, t, p);
						/*!debug!*/assert(data.ref !== null, "Bad backlink to " + b + "/" + t + "/" + p);

						// Events
						instance.unbind_html_event(obj, "mouseenter");
						instance.unbind_html_event(obj, "mouseleave");
						instance.unbind_html_event(obj, "mousemove");
						instance.unbind_html_event(obj, "click");
						instance.bind_html_event(obj, "mouseenter", data, events.reference_mouseenter, true);
						instance.bind_html_event(obj, "mouseleave", data, events.reference_mouseleave, true);
						instance.bind_html_event(obj, "mousemove", data, events.reference_mousemove, true);
						instance.bind_html_event(obj, "click", data, events.reference_click, true);
					}
				},
				unprepare: function (instance) {
					// Unbind events
					instance.unbind_html_events();

					// Close settings menu
					if (instance.settings_menu != null) {
						instance.settings_menu.close();
					}

					// Trigger prepare
					api.signal("post_unprepare", {
						post: this,
						post_instance: instance
					});
				},

				mark_as_dead_image: function (no_event) {
					if (this.image == null ||this.image.deleted) return;

					if (!no_event) {
						// Event
						var update_data = {
							comment_fully_loaded: false,
							image_deleted: true
						};
						this.thread.post_updated(this, update_data);
					}

					// Update html
					var i, j, c, d;
					j = this.instances.length;
					for (i = 0; i < j; ++i) {
						// Find post comment
						c = this.instances[i].container.children(".post").children(".post_header");
						d = c.find(".post_indicator_deleted_image,.post_indicator_deleted_post");
						if (d.length > 0) {
							d.removeClass("post_indicator_deleted_post").addClass("post_indicator_deleted_image");
						}
						else {
							c.prepend(
								style.e("span", "post_indicator_deleted_image")
							);
						}
					}

					// Deleted
					this.image.deleted = true;
				},
				mark_as_dead: function (no_event) {
					if (this.deleted) return;

					if (!no_event) {
						// Event
						content.trigger("post_delete", {
							post: this,
							context: null,
							thread_context: null
						});
					}

					// Kill references
					var i, j, c, d;
					j = this.replies.length;
					for (i = 0; i < j; ++i) {
						// Kill
						this.replies[i].origin.update_reference(this.replies[i], this_private.mark_as_dead_update_reference_function);

						// Mark as dead if incomplete
						content.change_incomplete_to_dead_reference(this.replies[i]);
					}


					// Update html
					j = this.instances.length
					for (i = 0; i < j; ++i) {
						// Find post comment
						c = this.instances[i].container.children(".post").children(".post_header");
						d = c.find(".post_indicator_deleted_image,.post_indicator_deleted_post");
						if (d.length > 0) {
							d.removeClass("post_indicator_deleted_image").addClass("post_indicator_deleted_post");
						}
						else {
							c.prepend(
								style.e("span", "post_indicator_deleted_post")
							);
						}
					}

					// Deleted
					this.deleted = true;

					// Kill backlinks
					this.update_all_backlink_references();
				},

				create_inline: function (parent) {
					// Clone
					var c = this.instances[this.instances.length - 1].container;
					c = c.clone();
					var inner = c.children(".post");

					// Remove highlight
					c.removeClass("highlighted focused");

					// Remove any inline containers open within this one
					c.find(".post_container.inline").remove();

					// Remove anything that shouldn't be in an inline container
					c.find(".no_inline").remove();

					// Un-highlight
					Post.get_html_references(c).removeClass("highlighted open");
					Post.get_html_backlinks(c).removeClass("highlighted open");

					// Setup indication of inline
					c.addClass("inline");

					// De-op
					if (!c.hasClass("reply")) {
						// Add reply class
						c.addClass("reply").removeClass("op");

						// Shift around stuff
						var h = inner.children(".post_header");
						var blc = inner.children(".post_embedded_backlink_container");
						var ref_container = inner.children(".post_file_info,.post_image_container");
						if (ref_container.length > 0) {
							ref_container = ref_container.first();
							ref_container.before(h);
							h.after(blc);
						}
					}

					// Remove thread expansion notification
					var n_container = c.find(".post_notifications");
					n_container.children(".post_notification.omitted").remove();
					if (n_container.children().length == 0) {
						n_container.remove();
					}

					// Add to list
					var instance = new Post.Instance(this, c);
					instance.parent = parent || null;
					this.instances.push(instance);

					// Remove image embed
					this.set_image_embedded(false, instance, null);

					// Setup events
					this.prepare(instance);

					// Done
					return instance;
				},
				create_inline_message: function () {
					var e = style.e("div", "post_container reply inline");

					e.append(
						style.e("div", "post")
						.append(
							style.e("div", "post_header")
							.append(
								style.e("span", "post_subject")
							)
							.append(
								style.e("div", "post_header_progress no_spacing")
								.append(
									style.e("div", "post_header_progress_inner")
								)
							)
						)
						.append(
							style.e("div", "post_body")
						)
					);

					return e;
				},

				get_name_plaintext: function () {
					var s = this.instances[0].container.children(".post").children(".post_header");
					var name = s.children(".post_identity").children(".post_identity_name");

					if (name.length == 0) return null;
					return xch.dom_to_string(name);
				},
				get_tripcode_plaintext: function () {
					var s = this.instances[0].container.children(".post").children(".post_header");
					var tripcode = s.children(".post_identity").children(".post_identity_tripcode");

					if (tripcode.length == 0) return null;
					return xch.dom_to_string(tripcode);
				},
				get_subject_plaintext: function () {
					/*!debug!*/assert(this.instances[0], "Bad instance");
					var s = this.instances[0].container.children(".post").children(".post_header");
					var subject = s.children(".post_subject");

					if (subject.length == 0) return null;
					return xch.dom_to_string(subject);
				},
				get_comment_plaintext: function () {
					var b = this.instances[0].container.children(".post");
					var body = b.children(".post_body_full");
					if (body.length == 0) body = b.children(".post_body");

					if (body.length == 0) return null;
					return xch.dom_to_string(body, this_private.get_comment_plaintext_dom_filter);
				},

				update_all_reply_references: function () {
					// Update references
					for (var i = 0, j = this.replies.length; i < j; ++i) {
						// Update
						this.replies[i].origin.update_reference(this.replies[i], null);
					}
				},
				update_all_backlink_references: function () {
					// Update references
					for (var i = 0, j = this.references.length; i < j; ++i) {
						// Update
						if (this.references[i].target !== null) {
							this.references[i].target.update_backlink(this.references[i], null);
						}
					}
				},

				loaded: function () {
					return (this.instances[0] != null);
				},

				insert_into_thread: function () {
					// Insert into thread
					xch.insert_dom_element_sorted(this.thread.container, this.instances[0].container, this_private.post_insert_sort_function);
				},

				scroll_to: function (container) {
					var top = container.offset().top;
					var height = container.height();
					var win_height = $(window).outerHeight();
					var min_top = -content.header.get_screen_area().top;
					$(document).scrollTop(top + Math.min(min_top, (height - win_height) / 2));
				},

				set_image_embedded: function (embedded, instance, obj) {
					if (this.image != null && this.image.url !== null) {
						if (!obj) {
							obj = instance.container.children(".post").children(".post_image_container");
						}
						if (obj.length > 0) {
							if (embedded) {
								if (!obj.hasClass("embed")) {
									// Embed
									obj.addClass("embed");
									// Add
									var img;
									var link = obj.children(".post_image_link");
									if (!this.image.spoiler && this.image.extension != ".gif") {
										link.append(
											style.e("div", "post_image_thumbnail")
											.css({
												"background-image": 'url("' + style.escape_string(this.image.thumbnail) + '")',
												"background-size": this.image.width + "px " + this.image.height + "px"
											})
										);
									}
									link.append(
										(img = style.e("img", "post_image full"))
										.attr("title", "")
										.attr("alt", "")
										.on("load", { obj: obj }, this_private.on_embedded_post_image_load)
										.css({
											width: this.image.width + "px",
											height: this.image.height + "px"
										})
										.attr("src", this.image.url)
									);
								}
							}
							else {
								if (obj.hasClass("embed")) {
									// Un-embed
									obj.removeClass("embed loaded");
									// Remove
									var link = obj.children(".post_image_link");
									link.children(".post_image.full").off("load").remove();
									link.children(".post_image_thumbnail").remove();
								}
							}
						}
					}
				},

				references_me: function () {
					for (var i = 0, ref; i < this.references.length; ++i) {
						ref = this.references[i];
						if (ref.target_thread_id !== null && content.posted_by_me(ref.target_board, ref.target_thread_id, ref.target_post_id)) {
							return true;
						}
					}
					return false;
				}

			};

			Post.get_html_references = function (container, additional_selector) {
				return container
					.children(".post")
					.children(".post_body")
					.find(".post_reference" + (additional_selector || ""));
			};
			Post.get_html_backlinks = function (container, additional_selector) {
				var con = container.children(".post");
				return con.children(".post_header")
						.add(con.children(".post_footer:not(.hidden)")).find(".post_backlinks")
						.find(".post_backlink" + (additional_selector || ""));
			};

			Post.Reference = (function () {

				var Reference = function (origin, target_board, target_thread_id, target_post_id) {
					this.origin = origin;
					this.target = null;
					this.target_board = target_board;
					this.target_thread_id = target_thread_id;
					this.target_post_id = target_post_id;
					this.target_dead = (target_thread_id === null) && (origin.thread.board != target_board || origin.id > target_post_id);

					// Forward-reference
					origin.references.push(this);

					// Back-reference
					var ref;
					if (target_thread_id !== null) {
						if ((ref = content.get_thread(target_thread_id, target_board)) !== null && (ref = ref.get_post(target_post_id)) !== null) {
							this.target = ref;
							ref.replies.push(this);
						}
					}

					// Add to incomplete list if necessary
					if (this.target == null) {
						if (this.target_dead) {
							content.add_dead_reference(this);
						}
						else {
							content.add_incomplete_reference(this);
						}
					}
				};

				Reference.prototype = {

					constructor: Reference,

					equals: function (origin, target_board, target_thread_id, target_post_id) {
						return (
							this.origin == origin &&
							this.target_post_id == target_post_id &&
							(target_thread_id === null || this.target_thread_id == target_thread_id) &&
							this.target_board == target_board
						);
					},
					complete: function (target) {
						// Update
						this.target = target;
						this.target_board = target.thread.board;
						this.target_thread_id = target.thread.id;
						this.target_post_id = target.id;
						this.target_dead = false;
						// Add to reply list
						target.replies.push(this);
					},
					forwards_death: function () {
						if (this.target_thread_id === null && this.origin.id < this.target_post_id) {
							this.target_dead = true;
							return true;
						}
						return false;
					}

				};

				Reference.find = function (origin, target_board, target_thread_id, target_post_id) {
					for (var i = 0; i < origin.references.length; ++i) {
						if (origin.references[i].equals(origin, target_board, target_thread_id, target_post_id)) return origin.references[i];
					}
					return null;
				};

				return Reference;

			})();

			Post.Instance = (function () {

				var Instance = function (post, container) {
					this.parent = null;
					this.post = post;
					this.container = container;
					this.inlined_instances = [];
					this.html_events = [];
					this.settings_menu = null;
				};

				Instance.prototype = {

					constructor: Instance,

					destroy: function () {
						// Remove from parent
						var list, i, j;
						if (this.parent != null) {
							for (list = this.parent.inlined_instances, i = 0, j = list.length; i < j; ++i) {
								if (list[i] == this) {
									list.splice(i, 1);
									break;
								}
							}
							/*!debug!*/assert(i < j, "Not deleted from parent");
						}

						// Remove inlined instances
						for (j = this.inlined_instances.length, i = j - 1; i >= 0; --i) {
							this.inlined_instances[i].destroy();
						}

						// Remove html events
						this.post.unprepare(this);

						// Remove from list
						for (list = this.post.instances, i = 0, j = list.length; i < j; ++i) {
							if (this == list[i]) {
								list.splice(i, 1);
								break;
							}
						}
						/*!debug!*/assert(i < j, "Container does not match post");

						// Remove from html
						this.container.remove();
						this.container = null;
					},

					add_inlined_instance: function (instance) {
						this.inlined_instances.push(instance);
					},
					remove_inlines: function () {
						for (var j = this.inlined_instances.length, i = j - 1; i >= 0; --i) {
							this.inlined_instances[i].destroy();
						}
					},

					unbind_html_events: function () {
						for (var i = 0; i < this.html_events.length; ++i) {
							// Turn off event
							$(this.html_events[i].object).off(this.html_events[i].event, this.html_events[i].callback);
						}
						this.html_events = [];
					},
					unbind_html_event: function (obj, event, maintained) {
						for (var i = 0, j; i < obj.length; ++i) {
							for (j = 0; j < this.html_events.length; ++j) {
								if (this.html_events[j].object == obj[i] && this.html_events[j].event == event) {
									// Turn off event
									$(obj[i]).off(event, this.html_events[j].callback);
									// Remove
									this.html_events.splice(j, 1);
									break;
								}
							}
						}
					},
					bind_html_event: function (obj, event, data, callback, data_maintained) {
						obj.on(event, data, callback);

						// Run on each one
						for (var i = 0; i < obj.length; ++i) {
							/*!debug!*/assert(this.get_html_event(obj[i], event) === null, "Duplicate event");
							// Add to list
							var h_e = {
								object: obj[i],
								event: event,
								callback: callback
							};
							if (data_maintained) h_e.data = data;
							this.html_events.push(h_e);
						}
					},
					get_html_event: function (obj, event) {
						for (var i = 0; i < this.html_events.length; ++i) {
							if (this.html_events[i].object == obj && this.html_events[i].event == event) return this.html_events[i];
						}
						return null;
					}

				};

				return Instance;

			})();

			return Post;

		})(),

		// Post image
		Image: (function () {

			var Image = function () {
				this.url = null;
				this.thumbnail = null;
				this.extension = null;
				this.filename_server = null;
				this.filename_original = null;
				this.width = 0;
				this.height = 0;
				this.thumbnail_width = 0;
				this.thumbnail_height = 0;
				this.filesize = 0;
				this.filesize_label = null;
				this.spoiler = false;
				this.deleted = false;
			};

			var this_private = {

				get_point_in_bounds: function (left, top, width, height, px, py) {
					// Update borders
					var lr = Math.min(style.image_preview.zoom_padding.pixels.lr, style.image_preview.zoom_padding.percent.lr * width);
					var tb = Math.min(style.image_preview.zoom_padding.pixels.tb, style.image_preview.zoom_padding.percent.tb * height);
					left += lr;
					top += tb;
					width -= lr * 2;
					height -= tb * 2;

					// Get percents
					var p = {
						x: (px - left) / width,
						y: (py - top) / height
					};
					if (p.x < 0.0) p.x = 0.0;
					else if (p.x > 1.0) p.x = 1.0;
					if (p.y < 0.0) p.y = 0.0;
					else if (p.y > 1.0) p.y = 1.0;

					// Done
					return p;
				},

				bound_image: function (obj, bounding, left, top, width, height, px, py, init) {
					var eb = style.image_preview.zoom_padding.out_of_bounds;

					if ((bounding.flags & 1) != 0) {
						// Extend right
						var r = (px - (left + width)) + eb;
						if (r <= 0) {
							bounding.flags &= ~1;
							r = "";
						}
						else {
							if (init) bounding.right = r;
							else if (r > bounding.right) r = bounding.right;
							r = r.toFixed(2) + "px";
						}
						obj.css("padding-right", r);
					}

					if ((bounding.flags & 2) != 0) {
						// Extend up
						var r = (top - py) + eb;

						if (r <= 0) {
							bounding.flags &= ~2;
							obj.css("padding-top", "").css("top", "");
						}
						else {
							if (init) bounding.top = r;
							else if (r > bounding.top) r = bounding.top;
							r = r.toFixed(2) + "px";
							obj.css("padding-top", r).css("top", "-" + r);
						}
					}
					else if ((bounding.flags & 4) != 0) {
						// Extend up
						var r = (py - (top + height)) + eb;
						if (r <= 0) {
							bounding.flags &= ~4;
							r = "";
						}
						else {
							if (init) bounding.bottom = r;
							else if (r > bounding.bottom) r = bounding.bottom;
							r = r.toFixed(2) + "px";
						}
						obj.css("padding-bottom", r);
					}
				},

				cancel_event: function (event) {
					// Cancel left clicks
					return (event.which != 1);
				},

				on_preview_mousemove: function (event) {
					// Positions
					var event_data = event.data.event_data;
					var me = $(this);
					var inner = me.children(".image_preview_inner_3");
					var pos = inner.offset();

					// Percent
					if (event.pageX !== undefined) {
						event_data.mouse_last.x = event.pageX;
						event_data.mouse_last.y = event.pageY;
					}
					else {
						event.pageX = event_data.mouse_last.x;
						event.pageY = event_data.mouse_last.y;
					}
					var p = this_private.get_point_in_bounds.call(event.data.self, pos.left, pos.top, inner.width(), inner.height(), event.pageX, event.pageY);

					// Size
					var max = (xch.settings.image_preview.zooming.invert ? 100 : -100);
					inner.find(".image_preview_size").css({ // Range: -50% to 50% for the zoomed offset
						left: ((p.x - 0.5) * max).toFixed(2) + "%",
						top: ((p.y - 0.5) * max).toFixed(2) + "%"
					});

					// Bounded movement
					if (event_data.bounding && event_data.bounding.flags) {
						this_private.bound_image.call(event.data.self, me, event_data.bounding, pos.left, pos.top, inner.width(), inner.height(), event.pageX, event.pageY, false);
					}
				},
				on_preview_mouseenter: function (event) {
					event.data.self.close_preview_cancel(event.data.event_data);
				},
				on_preview_mouseleave: function (event) {
					event.data.self.close_preview(event.data.event_data);
				},
				on_preview_mousescroll: function (event) {
					// Zoom in/out
					var delta = Math.max(-1, Math.min(1, (event.originalEvent.wheelDelta || -event.originalEvent.detail || 0)));
					this_private.set_preview_zoom.call(event.data.self, event.data.event_data.zoom + delta, event.data.obj, event.data.event_data, event);

					// Ignore event
					return false;
				},
				on_preview_click: function (event) {
					if (event.which != 1) return true;

					event.data.self.destroy_preview(event.data.event_data);
				},

				on_preview_image_load: function (event) {
					// Hide thumbnail
					event.data.thumbnail.addClass("hidden");
				},
				on_preview_image_error: function (event) {
					// Error message
					$(this).addClass("hidden");
					event.data.thumbnail.removeClass("hidden").addClass("main");
					event.data.image_container.children(".info").prepend(
						style.e("span", "error").text("Error loading image")
					);
				},

				set_preview_zoom: function (zoom, obj, event_data, event) {
					// Check if update is needed
					if (zoom < 1) zoom = 1;
					if (zoom == event_data.zoom || event_data.preview == null) return;
					event_data.zoom = zoom;

					// Change zoom/size
					this.position_preview(obj, event_data.preview, event_data, true);

					// Update zoom position
					var outer = event_data.preview.find(".image_preview_inner_2");
					if (outer.length > 0) {
						this_private.on_preview_mousemove.call(outer[0], event);
					}
				}

			};

			Image.prototype = {

				constructor: Image,

				parse: function (html, img, info) {
					// Has info html
					if (html != null) {
						// URL
						var ia = html.find("a:nth-of-type(1)");
						this.url = ia.attr("href") || "";
						this.extension = this.url.split(".").pop().toLowerCase();
						if (this.extension) this.extension = "." + this.extension;

						// Server filename
						this.filename_server = ia.html() || "";

						// Details
						var d = html.find("span.unimportant");
						var str = $(d.contents()[0]).text();
						var match = /\((Spoiler\s+Image,\s+)?([0-9.]+)\s+([^,]+),\s+([0-9]+)x([0-9]+),\s*((.+?)\))?/i.exec(str);

						// Spoiler
						if (match[1]) this.spoiler = true;

						// File size
						this.filesize_label = [ match[2] , match[3].trim().toUpperCase() ];
						this.filesize = Math.round(parseFloat(this.filesize_label[0]) * (this.filesize_label[1] == "MB" ? 1048576 : (this.filesize_label[1] == "KB" ? 1024 : 1) ));

						// Dimensions
						this.width = parseInt(match[4]);
						this.height = parseInt(match[5]);

						// Original filename
						var ds = d.children("span.postfilename");
						if (ds.length > 0) {
							this.filename_original = ds.attr("title") || ds.text();
						}
						else {
							this.filename_original = (match[7] || "").trim();
						}
					}

					// Has img html
					if (img != null) {
						// Thumbnail
						this.thumbnail = img.attr("src");

						// Size
						var s = img.attr("style");
						if (s) {
							var m = /width:\s*([0-9]+)px/i.exec(s);
							if (m) this.thumbnail_width = parseInt(m[1]);
							m = /height:\s*([0-9]+)px/i.exec(s);
							if (m) this.thumbnail_height = parseInt(m[1]);
						}

						// Deleted
						this.deleted = info.urls_match(info.images.deleted.url, this.thumbnail);

						// Size
						if (this.deleted) {
							this.thumbnail_width = info.images.deleted.size.width;
							this.thumbnail_height = info.images.deleted.size.height;
						}
					}
				},

				stylize_size: function (obj, is_op) {
					var limit = (is_op ? style.post.image.op.thumbnail.size : style.post.image.reply.thumbnail.size);
					var scale = true;
					if (this.url === null) {
						// Deleted
						if (!limit.deleted) scale = false;
					}
					else if (this.spoiler) {
						// Spoilered
						if (!limit.spoiler) scale = false;
					}

					// Resize
					if (scale) {
						var w = this.thumbnail_width;
						var h = this.thumbnail_height;
						scale = Math.max(w / limit.width, h / limit.height);
						if (scale > 1.0) {
							w /= scale;
							h /= scale;
						}
						obj.css({
							width: w.toFixed(2) + "px",
							height: h.toFixed(2) + "px"
						});
					}
				},

				create_preview: function (obj, event_data) {
					var self = this;

					// Settings
					event_data.zoom = 1;
					event_data.bounding = null;

					// Object data
					var obj_pos = obj.offset();
					var obj_width = obj.width();
					var obj_height = obj.height();

					// Create
					var container, image_container, outer, connector, thumbnail, image;
					(container = style.e("div", "image_preview"))
					.append( //{
						(image_container = style.e("div", "image_preview_inner_1"))
						.append(
							(outer = style.e("div", "image_preview_inner_2"))
							.append(
								style.e("div", "image_preview_inner_3")
								.append(
									style.e("div", "image_preview_origin")
									.append(
										style.e("div", "image_preview_size")
										.append(
											style.e("div", "image_preview_image_container")
											.append(
												(thumbnail = style.e("div", "image_preview_thumbnail"))
											)
											.append(
												(image = style.e("img", "image_preview_image"))
												.attr("title", "")
												.attr("alt", "")
											)
											.append(
												style.e("div", "image_preview_overlay")
											)
										)
									)
								)
							)
							.append(
								style.e("div", "image_preview_info")
								.append(
									style.e("span", "image_preview_info_item dimensions")
									.html(this.width + "<i>" + style.symbols.mult + "</i>" + this.height)
								)
								.append(
									style.e("span", "image_preview_info_item zoom")
								)
							)
						)
					) //}
					.append(
						(connector = style.e("div", "image_preview_connector"))
						.css({
							width: style.image_preview.padding.left + "px",
							height: obj_height + "px",
							left: (obj_pos.left + obj_width) + "px",
							top: obj_pos.top + "px"
						})
					);

					// Events
					var data = { self: this, event_data: event_data };
					outer.add(connector)
					.on("mouseenter", data, this_private.on_preview_mouseenter)
					.on("mouseleave", data, this_private.on_preview_mouseleave)
					.on("mousedown", this_private.cancel_event);
					outer.on("mousemove", data, this_private.on_preview_mousemove);
					if (xch.settings.image_preview.close_on_click) {
						outer.on("click", data, this_private.on_preview_click);
					}
					if (xch.settings.image_preview.zooming.enabled) {
						outer.on("mousewheel DOMMouseScroll", { self: this, event_data: event_data, obj: obj }, this_private.on_preview_mousescroll);
					}

					data = { thumbnail: thumbnail, image_container: image_container };
					image
					.on("load", data, this_private.on_preview_image_load)
					.on("error", data, this_private.on_preview_image_error);

					// Thumbnail
					if (this.spoiler) {
						thumbnail.addClass("hidden");
					}
					else {
						thumbnail.css("background-image", 'url("' + style.escape_string(this.thumbnail) + '")');
						if (this.extension == ".gif") {
							thumbnail.addClass("hidden");
						}
					}

					// Image
					image.attr("src", this.url);

					// Position
					this.position_preview(obj, container, event_data, false);

					// Done
					return container;
				},
				position_preview: function (obj, container, event_data, mouse_bounded) {
					// Objects
					var image_container = container.children(".image_preview_inner_1");
					var outer = image_container.children(".image_preview_inner_2");
					var c_origin = outer.find(".image_preview_origin");
					var c_size = c_origin.children(".image_preview_size");
					var preview = c_size.children(".image_preview_image_container");
					var thumbnail = preview.children(".image_preview_thumbnail");
					var image = preview.children(".image_preview_image");

					// Object position
					var win = $(window);
					var win_scroll = {
						top: win.scrollTop(),
						left: win.scrollLeft()
					};
					var obj_pos = obj.offset();
					var obj_height = obj.height();
					var obj_width = obj.width();
					obj_pos.top -= win_scroll.top;
					obj_pos.left -= win_scroll.left;

					// Zoom
					image_container.find(".image_preview_info_item.zoom").text((event_data.zoom * 100) + "%");

					// Paddings
					var l_o = (obj_pos.left + obj_width + style.image_preview.padding.left);
					var bounds = content.header.get_screen_area();
					bounds.top += style.image_preview.padding.top;
					bounds.left += l_o;
					bounds.width -= l_o + style.image_preview.padding.right;
					bounds.height -= style.image_preview.padding.top + style.image_preview.padding.bottom;

					// Sizes
					if (bounds.width <= 0) bounds.width = 1;
					if (bounds.height <= 0) bounds.height = 1;
					var w = this.width;
					var h = this.height;
					var scale = Math.min(bounds.width / w, bounds.height / h);
					if (!xch.settings.image_preview.upscale) scale = Math.min(1, scale);

					// Size CSS
					w = this.width * scale * event_data.zoom;
					h = this.height * scale * event_data.zoom;
					var size_css = {
						width: w.toFixed(2) + "px",
						height: h.toFixed(2) + "px"
					};
					c_size.css(size_css);

					// Outer CSS size
					var w_outer = Math.min(w, bounds.width);
					var h_outer = Math.min(h, bounds.height);
					var size_css_outer = {
						width: w_outer.toFixed(2) + "px",
						height: h_outer.toFixed(2) + "px"
					};
					c_origin.css({
						width: (w - w_outer).toFixed(2) + "px",
						height: (h - h_outer).toFixed(2) + "px"
					});

					// Position
					var left = (bounds.left);
					var top = (obj_pos.top + obj_height / 2) - h_outer / 2;
					var limit;
					if (top > (limit = bounds.top + bounds.height - h_outer)) top = limit;
					else if (top < bounds.top) top = bounds.top;
					image_container.css({
						left: left.toFixed(2) + "px",
						top: top.toFixed(2) + "px"
					});

					// Mouse bounding
					if (mouse_bounded && xch.settings.image_preview.zooming.bounded) {
						var b = 0;
						if (event_data.mouse_last.x > left + w_outer + win_scroll.left) {
							b |= 1;
						}
						if (event_data.mouse_last.y < top + win_scroll.top) {
							b |= 2;
						}
						else if (event_data.mouse_last.y > top + h_outer + win_scroll.top) {
							b |= 4;
						}
						if (b > 0) {
							event_data.bounding = {
								flags: b
							};
							this_private.bound_image(outer, event_data.bounding, left + win_scroll.left, top + win_scroll.top, w, h, event_data.mouse_last.x, event_data.mouse_last.y, true);
						}
					}

					// Apply sizes
					if (!this.spoiler) {
						thumbnail.css("background-size", size_css.width + " " + size_css.height);
					}
					outer.css(size_css_outer);
				},
				close_preview_cancel: function (event_data) {
					if (event_data.close_timer !== null) {
						clearTimeout(event_data.close_timer);
						event_data.close_timer = null;
					}
				},
				close_preview: function (event_data) {
					if (event_data.close_timer === null) {
						var self = this;

						event_data.close_timer = setTimeout(function () {
							event_data.close_timer = null;
							self.destroy_preview(event_data);
						}, 50);
					}
				},
				destroy_preview: function (event_data) {
					if (event_data.preview != null) {
						// Stop events
						event_data.preview.find(".connector").off("mouseenter mouseleave mousedown");
						event_data.preview.find(".outer").off("mouseenter mouseleave mousemove mousedown mousewheel DOMMouseScroll");
						event_data.preview.find("img.image").off("load error");

						// Remove
						event_data.preview.remove();
						event_data.preview = null;
					}
				},

				good: function () {
					return (this.url != null);
				},

				previewable: function () {
					// Spoiler check
					var en = xch.settings.image_preview.enabled;
					if (this.spoiler && !en.spoiler) return false;
					// Extension check
					var ext = this.extension;
					if (!(ext in en)) ext = xch.settings.image_preview["default"];
					return en[ext];
				}

			};

			return Image;

		})(),

		// Styling
		Style: (function () {

			var Style = function (html) {
				this.cls = "xch";
				this.css = new Style.CSS();

				this.top_gradient = {
					0: "#d6daf0",
					100: "#eef2ff",
					direction: "t2b",
					height: "128px"
				};

				this.body = {
					colors: {
						bg: "#eef2ff"
					},
					font: {
						face: "arial,helvetica,sans-serif",
						size: "14px",
						style: "normal",
						weight: "normal"
					},
					content_padding: {
						top: 32,
						bottom: 64
					}
				};

				this.thread = {
					separator: {
						height: 8,
						size: 4,
						style: "dashed",
						color: "#d6daf0"
					},
					padding: {
						left: 20,
						top: 0,
						right: 20,
						bottom: 0
					}
				};

				this.header = {
					background: {
						opacity: 0.75,
						gradient: {
							0: "#d6daf0",
							100: "#b7c5d9",
							direction: "t2b"
						},
						shadow: {
							color: "#34345c",
							offset: {
								left: 0,
								top: 0
							},
							blur: 4,
							size: 2
						}
					},
					font: {
						face: "arial,helvetica,sans-serif",
						size: "14px",
						style: "normal",
						weight: "normal"
					},
					padding: 4,
					spacing: {
						group: 6,
						board: 3,
						options: 6
					},
					separators: {
						group_before: "[",
						group_after: "]",
						group_inner: "/"
					},
					menu: {
						background: {
							color: "#b7c5d9",
							opacity: 0.75
						}
					},
					boards: {
						font: {},
						colors: {
							group: "#5c6f85",
							separator: "#5c6f85",
							link: "#0f0c5c",
							link_hover: "#dd0000"
						},
						current: {
							colors: {
								link: "#f8f8f8",
								link_hover: "#f8f8f8"
							},
							shadow: {
								color: "#0f0c5c",
								offset: {
									left: 0,
									top: 0
								},
								blur: 2,
								factor: 3,
								hover: {
									color: "#dd0000",
									offset: {
										left: 0,
										top: 0
									},
									blur: 2,
									factor: 3
								}
							},
							font: { weight: "bold" }
						}
					},
					options: {
						colors: {
							link: "#0f0c5c",
							link_hover: "#dd0000"
						}
					}
				};

				this.post = {

					separation: 8,

					font: {
						face: "arial,helvetica,sans-serif",
						size: "14px",
						style: "normal",
						weight: "normal"
					},

					border: {
						top: 0,
						right: 1,
						bottom: 1,
						left: 0,
						style: "solid",
						radius: {
							topleft: 0,
							topright: 10,
							bottomright: 10,
							bottomleft: 10
						}
					},

					colors: {
						text: "#080808",
						bg: "#d6daf0",
						bg_hl: "#d6bad0",
						border: "#b7c5d9",
						border_hl: "#b7a0b0",
						link: {
							text: "#34345c",
							text_hover: "#dd0000"
						}
					},

					header: {
						spacing: 6,
						padding: {
							left: 4,
							top: 4,
							right: 4,
							bottom: 4
						},
						colors: {
							bg: "#b7c5d9",
							bg_hl: "#b7a0b0",
							border: "#ffffff",
							border_hl: "#ffffff"
						},
						font: {},
						border: {
							top: 0,
							right: 0,
							bottom: 1,
							left: 0,
							style: "solid"
						},
						options: {
							separator: {
								start: "[",
								end: "]"
							},
							text: {
								reply_to: "Reply"
							},
							colors: {
								text: "#8899aa",
								link: "#34345c",
								link_hover: "#dd0000"
							},
							spacing: {
								inner: 3
							},
							font: {}
						},
						backlinks: {
							label: "",
							spacing: 6,
							spacing_first: 0,
							font: {},
							colors: {
								text: "#dd0000",
								text_hover: "#ff8800",
								text_open: "#ff8800",
								text_open_hover: "#ff8800",
								text_hl: "#ff8800"
							}
						},
						subject: {
							color: "#0f0c5c",
							font: { weight: "bold" }
						},
						time: {
							font: {}
						},
						identity: {
							font: {},
							name: {
								font: { weight: "bold" },
								colors: {
									user: "#117743",
									mod: "#800080",
									admin: "#ff0000"
								}
							},
							tripcode: {
								font: {}
							},
							capcode: {
								indicator: "##",
								font: { weight: "bold" }
							},
							email_colors: {
								text:"#0f0c5c",
								text_hover:"#dd0000"
							},
							spacing: 4
						},
						icons: {
							color: "#34345c"
						},
						number: {
							indicator: "No.",
							font: {},
							colors: {
								text:" #080808",
								text_hover: "#dd0000"
							}
						},
						settings: {
							opacity: {
								normal: 0,
								hover: 1,
								transition: {
									time: 0.125,
									method: "linear",
									delay: 0
								}
							}
						}
					},

					file_info: {
						spacing: 6,
						padding: {
							left: 20,
							top: 12,
							right: 20,
							bottom: 4
						},
						font: { size: "10px" },
						file_name: {
							font: {}
						},
						attributes: {
							font: {},
							prefix: "(",
							suffix: ")"
						},
						file_extras: {
							font: {},
							spacing: 4
						}
					},

					image: {
						op: {
							thumbnail: {
								size: {
									width: 255,
									height: 255,
									spoiler: false,
									deleted: false
								},
								shadow: {
									color: "#d6daf0",
									offset: {
										left: 0,
										top: 0
									},
									blur: 2,
									size: 1
								}
							},
							full: {
								shadow: {
									color: "#d6daf0",
									offset: {
										left: 0,
										top: 0
									},
									blur: 4,
									size: 2
								}
							},
							bg: "#eef2ff"
						},
						reply: {
							thumbnail: {
								size: {
									width: 125,
									height: 125,
									spoiler: true,
									deleted: false
								},
								shadow: {
									color: "#b7c5d9",
									offset: {
										left: 0,
										top: 0
									},
									blur: 1,
									size: 1
								}
							},
							full: {
								shadow: {
									color: "#b7c5d9",
									offset: {
										left: 0,
										top: 0
									},
									blur: 4,
									size: 2
								}
							},
							bg: "#d6daf0"
						},
						padding: {
							left: 20
						}
					},

					comment: {
						font: {},
						padding: {
							left: 20,
							top: 12,
							right: 20,
							bottom: 12
						},
						colors: {
							text: "#080808",
							spoiler: {
								text: "#080808",
								bg: "#080808",
								text_hover: "#f8f8f8",
								bg_hover: "#080808"
							},
							quote: {
								text: "#789922",
								text_hover: "#789922"
							},
							reply_link: {
								text: "#dd0000",
								text_hover: "#ff8800",
								text_open: "#ff8800",
								text_open_hover: "#ff8800",
								text_hl: "#ff8800"
							},
							link: {
								text: "#34345c",
								text_hover: "#dd0000"
							}
						}
					},

					footer: {
						font: { size: "10px" },
						padding: {
							top_outer: 4,
							top_inner: 4,
							left_inner: 10,
							left_outer: 10,
							right_inner: 10,
							right_outer: 10,
							bottom: 4,
						},
						border: {
							size: 1,
							style: "solid",
							colors: {
								op: "#d6daf0",
								op_hl: "#d6bad0",
								reply: "#ffffff",
								reply_hl: "#ffffff"
							}
						},
						backlinks: {
							label: "Replies:",
							spacing: 4,
							spacing_first: 4,
							font: {},
							colors: {
								text: "#dd0000",
								text_hover: "#ff8800",
								text_open: "#ff8800",
								text_open_hover: "#ff8800",
								text_hl: "#ff8800"
							}
						}
					},

					notifications: {
						font: { size: "12px" },
						spacing: {
							outer: 6,
							inner: 2
						},
						padding: {
							top: 4
						},
						separator: {
							start: "[",
							end: "]"
						},
						text: {
							too_long: "Message too long",
							too_long_expand: "Expand message",
							too_long_shrink: "Shrink message",
							omitted_hidden_prefix: "",
							omitted_hidden_suffix: " omitted",
							omitted_visible_prefix: "Hide ",
							omitted_visible_suffix: ""
						},
						colors: {
							text: "#8899aa",
							link: "#34345c",
							link_hover: "#dd0000"
						},
						progress: {
							colors: {
								ajax: "#3191b7",
								parse: "#9131b7"
							},
							opacity: 0.25
						}

					},

					backlink_indicator: {
						same_board: ">>%post_id",
						cross_board: ">>>/%board/%post_id",
						suffix_list: {
							same_board: [
								["you","you"],
								["self","self"],
								["op","op"],
								["past","past"],
								["cross_thread","cross-thread"],
								["dead","dead"]
							],
							cross_board: [
								["you","you"],
								["self","self"],
								["op","op"],
								["past","past"],
								["dead","dead"]
							]
						},
						suffix_first: " (",
						suffix_separator: ", ",
						suffix_last: ")"
					},

					reference_indicator: {
						same_board: ">>%post_id",
						cross_board: ">>>/%board/%post_id",
						suffix_list: {
							same_board: [
								["you","you"],
								["self","self"],
								["op","op"],
								["future","future"],
								["cross_thread","cross-thread"],
								["dead","dead"]
							],
							cross_board: [
								["you","you"],
								["self","self"],
								["op","op"],
								["future","future"],
								["dead","dead"]
							]
						},
						suffix_first: " (",
						suffix_separator: ", ",
						suffix_last: ")"
					},

					deleted_indicator: {
						post_text: "[Post Deleted]",
						image_text: "[Image Deleted]",
						color: "#ff0000",
						font: {
							weight: "bold",
							style: "italic"
						}
					},

					load_bar: {
						height: 4,
						colors: {
							ajax: "#3191b7",
							parse: "#9131b7"
						}
					},

					inline: {
						container_padding: {
							left: 8,
							top: 8,
							right: 8,
							bottom: 0
						},
						floating: {
							offsets: {
								x: 8,
								y: 8
							},
							shadow: {
								color: "#34345c",
								offset: {
									left: 0,
									top: 0
								},
								blur: 5,
								size: 5
							}
						},
						embedded: {
							shadow: {
								color: "#34345c",
								offset: {
									left: 0,
									top: 0
								},
								blur: 2,
								size: 1
							}
						}
					},

					focus: {
						normal: {
							shadow: {
								color: "#dd0000",
								offset: {
									left: 0,
									top: 0
								},
								blur: 3,
								size: 3
							}
						},
						inline: {
							shadow: {
								color: "#dd0000",
								offset: {
									left: 0,
									top: 0
								},
								blur: 2,
								size: 2
							}
						}
					}

				};

				this.image_preview = {
					colors: {
						bg: "rgba(238,242,255,0.625)",
						error: "#ff7777"
					},
					thumbnail: {
						opacity: 0.5
					},
					shadow: {
						color: "#34345c",
						offset: {
							left: 0,
							top: 0
						},
						blur: 10,
						size: 10
					},
					padding: {
						left: 20,
						top: 20,
						bottom: 20,
						right: 20
					},
					zoom_padding: {
						pixels: {
							lr:	20,
							tb: 20
						},
						percent: {
							lr:	0.1,
							tb: 0.1
						},
						out_of_bounds: 10
					},
					header: {
						padding: {
							top: 0,
							left: 0,
							right: 0,
							bottom: 0
						},
						color: "#f8f8f8",
						shadow: {
							color: "#34345c",
							offset: {
								left: 0,
								top: 0
							},
							blur: 2,
							factor: 3
						},
						separator: ", "
					}
				};

				this.checkbox_settings = {
					sizes: {
						tiny: {
							box_size: 10,
							border_width: 1,
							border_radius: 2
						},
						small: {
							box_size: 12,
							border_width: 1,
							border_radius: 2
						},
						normal: {
							box_size: 14,
							border_width: 1,
							border_radius: 3
						}
					},
					colors: {
						bg: "#ffffff",
						bg_hover: "#ffffff",
						border: "#0f0c5d",
						border_hover: "#34345d",
						check: "#080808",
						check_hover: "#0f0c5d"
					}
				};

				this.custom = {
					selection: "#f8f8f8",
					selection_bg: "#34345c"
				};

				this.symbols = {
					mult: "×",
					minus: "-",
					triangles: {
						right: "►",
						down: "▼",
						left: "◄",
						up: "▲"
					}
				};

				this.menu = {
					colors: {
						bg: "rgba(214,218,240,1)",
						bg_hover: "rgba(214,218,240,1)",
						text: "#0f0c5c",
						text_hover: "#dd0000"
					},
					border: {
						size: 1,
						style: "solid",
						color: "rgba(52,52,92,0.75)",
						color_hover: "#34345c"
					},
					shadow: {
						color: "#34345c",
						offset: {
							left: 0,
							top: 0
						},
						blur: 2,
						size: 1,
						opacity: 0.75
					},
					font: {
						face: "arial,helvetica,sans-serif",
						size: "14px",
						style: "normal",
						weight: "normal"
					},
					font_small: {
						face: "arial,helvetica,sans-serif",
						size: "10px",
						style: "normal",
						weight: "normal"
					},
					padding: {
						left: 4,
						top: 2,
						right: 4,
						bottom: 2
					}
				};

				this.popup = {
					colors: {
						text: "#080808"
					},
					font: {
						face: "arial,helvetica,sans-serif",
						size: "14px",
						style: "normal",
						weight: "normal"
					},
					resizers: {
						size: 8
					},
					bg: {
						size: 4,
						radius: 8,
						opacity: 0.75,
						color: "#d6d6f0",
						shadow: {
							color: "#34345c",
							offset: {
								left: 0,
								top: 0
							},
							blur: 2,
							size: 1
						}
					},
					input: {
						padding: 1,
						font: {
							face: "arial,helvetica,sans-serif",
							size: "12px",
							style: "normal",
							weight: "normal"
						},
						colors: {
							bg: "#f8f8f8",
							bg_hover: "#eef2ff",
							bg_selected: "#d6daf0",
							text: "#080808",
							link: "#34345c",
							link_hover: "#dd0000",
							placeholder: "#5c6f85",
							placeholder_opacity: 0.625
						},
						border: {
							size: 1,
							style: "solid",
							color: "#5c6f85",
							color_hover: "#dd0000",
							color_selected: "#34345c",
							radius: 4
						}
					},
					close: {
						color: "#34345c",
						color_hover: "#dd0000",
						padding: 3
					},
					title: {
						font: {
							weight: "bold"
						},
						shadow: {
							offset: {
								left: 0,
								top: 0
							},
							color: "#f8f8f8",
							blur: 2,
							factor: 3
						}
					},
					description: {
						font: {
							size: "12px"
						}
					},
					buttons: {
						spacing: 6,
					},
					separation: 4
				};

				this.qr = {
					label: {
						text: {
							reply: "Reply",
							quick_reply: "Quick Reply"
						},
						color: "#080808",
						color_hover: "#34345c"
					},
					target: {
						text: {
							left: "[",
							right: "]",
							color: "#5c6f85"
						},
						color: "#34345c",
						color_hover: "#dd0000",
						padding: {
							inner: 3,
							outer: 6
						}
					},
					submit: {
						text: "Post",
						text_active: "Posting",
						text_retry: "Retrying"
					},
					status: {
						text_color: "#34345c",
						font: {
							size: "10px"
						},
						spacing: 4,
						padding: {
							top: 4,
							bottom: 0
						},
						bar_height: 4,
						"default": {
							color: "#b7c5d9"
						},
						context_acquire: {
							color: "#117743"
						},
						cooldown: {
							color: "#f8f8f8"
						},
						upload: {
							color: "#dd0000"
						},
						download: {
							color: "#3191b7"
						},
						parse: {
							color: "#9131b7"
						}
					},
					cooldown: {
						opacity: 1,
						colors: {
							bg: "#d6daf0",
							bar: "#f8f8f8"
						},
						transition: {
							time: 0.5,
							method: "linear",
							delay: 0
						}
					}
				};

				this.messages = {
					size: {
						width: 480
					},
					colors: {
						plain: {
							text: "#080808",
							title_shadow: "#c0c0c0",
							bg: "#f8f8f8",
							link: "#080808",
							link_hover: "#dd0000"
						},
						error: {
							text: "#f8f8f8",
							title_shadow: "#080808",
							bg: "#e72d00",
							link: "#f8f8f8",
							link_hover: "#008be7"
						},
						good: {
							text: "#f8f8f8",
							title_shadow: "#080808",
							bg: "#008be7",
							link: "#f8f8f8",
							link_hover: "#e72d00"
						},
						okay: {
							text: "#f8f8f8",
							title_shadow: "#080808",
							bg: "#00ac04",
							link: "#f8f8f8",
							link_hover: "#f6c500"
						},
						info: {
							text: "#080808",
							title_shadow: "#f8f8f8",
							bg: "#f6c500",
							link: "#080808",
							link_hover: "#a900e7"
						},
						parse: {
							text: "#f8f8f8",
							title_shadow: "#080808",
							bg: "#a900e7",
							link: "#f8f8f8",
							link_hover: "#f6c500"
						}
					},
					border: {
						radius: 6
					},
					padding: {
						left: 4,
						top: 4,
						right: 4,
						bottom: 4
					},
					bg: {
						opacity: 0.875,
						shadow: {
							color: "#d6daf0",
							offset: {
								left: 0,
								top: 0
							},
							blur: 4,
							size: 2
						},
						shadow_min: {
							color: "#d6daf0",
							offset: {
								left: 0,
								top: 0
							},
							blur: 2,
							size: 1
						}
					},
					body: {
						font: {}
					},
					title: {
						shadow: {
							offset: {
								left: 0,
								top: 0
							},
							blur: 3
						},
						separation: 2,
						font: {
							weight: "bold"
						}
					},
					timer: {
						font: {
							size: "8px"
						},
						opacity: 0.75
					},
					link: {
						font: { weight: "bold", decoration: "underline" }
					},
					progress_bar: {
						separation: 4,
						height: 4,
						colors: {
							"default": "#f8f8f8",
							active: "#3191b7"
						}
					}
				};

				this.board_info = {
					title: {
						color: "#af0a0f",
						font: {
							family: "tahoma",
							size: "32px",
							weight: "bold",
							spacing: "-2px"
						}
					},
					subtitle: {
						color: "#af0a0f",
						font: {
							family: "tahoma",
							size: "12px"
						}
					},
					banner: {
						size: {
							width: 300,
							height: 100
						},
						padding: {
							bottom: 10
						}
					},
					padding: {
						bottom: 10
					}
				};

				this.updater = {
					symbols: {
						added: "+",
						removed: "-",
						post: "p",
						image: "i",
						separators: {
							post_image: ",",
							added_removed: ";"
						},
						countdown: "s"
					},
					colors: {
						text: "#080808",
						link: "#0f0c5c",
						link_hover: "#dd0000",
						added: "#117743",
						removed: "#ff0000",
						limit: "#dd0000"
					},
					small: {
						endings: {
							start: "[",
							end: "]",
							spacing: 4,
							color: "#5c6f85"
						},
						padding: 2,
						spacing: 8,
						progress: {
							colors: {
								ajax: "#3191b7",
								parse: "#9131b7"
							},
							opacity: 0.25
						}
					},
					bg: {
						color: "#d6daf0",
						opacity: 0.75,
						radius: 4,
						shadow: {
							color: "#34345c",
							offset: {
								left: 0,
								top: 0
							},
							blur: 2,
							size: 1
						}
					}
				};

				// Insert stylesheet
				html.find("head")
				.append( //{ Stylesheet
					$("<style>")
					.attr("id", "xch_style")
					.html(this_private.parse_stylesheet.call(this, this.stylesheet_base =
						/*!stylesheet-pre-parse!*/this_private.parse_stylesheet_pre.call(this,
						/*!stylesheet-start!*/
						//{ Body
						"body${background-color:<<body.colors.bg>>;background-image:none;margin:0px;padding:0px;border:0px hidden;overflow-x:auto;overflow-y:scroll;<<!font:body.font>>}\n" +
						"$.top_gradient{position:fixed;left:0;top:0;right:0;z-index:-100;height:<<top_gradient.height>>;<<!gradient:top_gradient>>}\n" +
						//}

						//{ Threads
						"$.thread+$.thread{margin-top:<<thread.separator.height>>px;padding-top:<<thread.separator.size>>px;border-top:<<thread.separator.size>>px <<thread.separator.style>> <<thread.separator.color>>;}\n" +
						"$.thread{padding:<<thread.padding.top>>px <<thread.padding.right>>px <<thread.padding.bottom>>px <<thread.padding.left>>px;<<css.box-sizing>>:border-box;}\n" +
						//}

						//{ Post
						"$.post_container+$.post_container{margin-top:<<post.separation>>px;}\n" +
						"$.post_container{display:block;max-width:100%;margin:0px;padding:0px;background-color:transparent;border:0px hidden;max-width:none;position:relative;}\n" +
						"$.post_container.op>$.post{display:block;}\n" +
						"$.post_container.reply>$.post{background-color:<<post.colors.bg>>;border-width:<<post.border.top>>px <<post.border.right>>px <<post.border.bottom>>px <<post.border.left>>px;border-style:<<post.border.style>>;border-color:<<post.colors.border>>;<<css.border-radius>>:<<post.border.radius.topleft>>px <<post.border.radius.topright>>px <<post.border.radius.bottomright>>px <<post.border.radius.bottomleft>>px;}\n" +
						"$.post_container.reply.highlighted>$.post{background-color:<<post.colors.bg_hl>>;border-color:<<post.colors.border_hl>>;}\n" +
						"$.post_container.reply.highlighted{background:transparent;}\n" +
						"$.post_container.op.focused>$.post{}\n" +
						"$.post_container.reply.focused:not(.inline)>$.post{box-shadow:<<!shadow:post.focus.normal.shadow>>;z-index:1;}\n" +
						"$.post_container.reply.focused.inline>$.post{box-shadow:<<!shadow:post.focus.inline.shadow>>;z-index:1;}\n" +

						"$.post{max-width:100%;display:inline-block;margin:0px;padding:0px;color:<<post.colors.text>>;<<!font:post.font>>}\n" +
						//}

						//{ Post header progress
						"$.post_header_progress{background-color:transparent;position:absolute;left:0;right:0;bottom:0;height:<<post.load_bar.height>>px;}\n" +
						"$.post_header_progress.ajax{background-color:<<post.load_bar.colors.ajax>>;}\n" +
						"$.post_header_progress.parse{background-color:<<post.load_bar.colors.parse>>;}\n" +
						"$.post_header_progress_inner{position:absolute;left:0;width:0px;bottom:0;top:0;}\n" +
						"$.post_header_progress_inner.ajax{background-color:<<post.load_bar.colors.ajax>>;}\n" +
						"$.post_header_progress_inner.parse{background-color:<<post.load_bar.colors.parse>>;}\n" +
						//}

						//{ Post header
						"$.post_header{position:relative;display:block;<<!font:post.header.font>>}\n" +
						"$.post_container.op>$.post>$.post_header{padding:0px <<post.header.padding.right>>px 0px 0px;}\n" +
						"$.post_container.reply>$.post>$.post_header{padding:<<post.header.padding.top>>px <<post.header.padding.right>>px <<post.header.padding.bottom>>px <<post.header.padding.left>>px;background-color:<<post.header.colors.bg>>;border-width:<<post.header.border.top>>px <<post.header.border.right>>px <<post.header.border.bottom>>px <<post.header.border.left>>px;border-style:<<post.header.border.style>>;border-color:<<post.header.colors.border>>;<<css.border-radius>>:<<post.border.radius.topleft>>px <<post.border.radius.topright>>px 0px 0px;}\n" +
						"$.post_container.reply.highlighted>$.post>$.post_header{background-color:<<post.header.colors.bg_hl>>;border-color:<<post.header.colors.border_hl>>;}\n" +
						"$.post_header>${vertical-align:middle;}" +
						"$.post_header>$+$:not(.no_spacing){margin-left:<<post.header.spacing>>px;}\n" +
						//}

						//{ Post subject
						"$.post_subject{word-wrap:break-word;color:<<post.header.subject.color>>;<<!font:post.header.subject.font>>}\n" +
						//}

						//{ Post header deleted indicators
						"$.post_indicator_deleted_image{color:<<post.deleted_indicator.color>>;<<!font:post.deleted_indicator.font>>}\n" +
						"$.post_indicator_deleted_image:after{content:\"<<!escape_string:post.deleted_indicator.image_text>>\";}\n" +
						"$.post_indicator_deleted_post{color:<<post.deleted_indicator.color>>;<<!font:post.deleted_indicator.font>>}\n" +
						"$.post_indicator_deleted_post:after{content:\"<<!escape_string:post.deleted_indicator.post_text>>\";}\n" +
						//}

						//{ Name
						"$.post_identity{color:<<post.header.identity.name.colors.user>>;text-decoration:none;}\n" +
						"$.post_identity[href]{color:<<post.header.identity.email_colors.text>>;text-decoration:underline;}\n" +
						"$.post_identity[href]:hover{color:<<post.header.identity.email_colors.text_hover>>;}\n" +
						"$.post_identity[href]>$.post_identity_name{color:<<post.header.identity.email_colors.text>>;}\n" +
						"$.post_identity[href]:hover>$.post_identity_name{color:<<post.header.identity.email_colors.text_hover>>;}\n" +
						"$.post_identity_name{word-wrap:break-word;<<!font:post.header.identity.name.font>>;}\n" +
						"$.post_identity_tripcode{margin-left:0px;<<!font:post.header.identity.tripcode.font>>}\n" +
						"$.post_identity_capcode," +
						"$.post_identity_capcode_indicator{<<!font:post.header.identity.capcode.font>>}\n" +
						"$.post_identity_name," +
						"$.post_identity_tripcode," +
						"$.post_identity_capcode{color:<<post.header.identity.name.colors.user>>;}\n" +
						"$.post_identity.mod>$.post_identity_name," +
						"$.post_identity.mod>$.post_identity_tripcode," +
						"$.post_identity.mod>$.post_identity_capcode," +
						"$.post_identity.mod>$.post_identity_capcode_indicator{color:<<post.header.identity.name.colors.mod>>;}\n" +
						"$.post_identity.admin>$.post_identity_name," +
						"$.post_identity.admin>$.post_identity_tripcode," +
						"$.post_identity.admin>$.post_identity_capcode," +
						"$.post_identity.admin>$.post_identity_capcode_indicator{color:<<post.header.identity.name.colors.admin>>;}\n" +
						"$.post_identity_capcode_indicator{padding:0px <<post.header.identity.spacing>>px;}\n" +
						//}

						//{ Time
						"$.post_time{white-space:nowrap;<<!font:post.header.time.font>>}\n" +
						//}

						//{ Post id
						"$.post_no," +
						"$.post_number{text-decoration:none;color:<<post.header.number.colors.text>>;<<!font:post.header.number.font>>}\n" +
						"$.post_no:hover," +
						"$.post_number:hover{color:<<post.header.number.colors.text_hover>>;}\n" +
						"$.post_no:before{content:\" \";width:0px;display:inline-block;overflow:hidden;}\n" +
						//}

						//{ Icons
						"$.post_icon{font-family:FontAwesome;text-decoration:none;display:inline-block;vertical-align:middle;color:<<post.header.icons.color>>;}\n" +
						"$.post_icon.sticky:after{content:\"\\f08d\";}\n" +
						"$.post_icon.locked:after{content:\"\\f023\";}\n" +
						//}

						//{ Post header options
						"$.post_option{color:<<post.header.options.colors.text>>;<<!font:post.header.options.font>>}\n" +
						"$.post_option:before{content:\"<<!escape_string:post.header.options.separator.start>>\";}\n" +
						"$.post_option:after{content:\"<<!escape_string:post.header.options.separator.end>>\";}\n" +
						"$.post_option_text{text-decoration:none;padding:0px <<post.header.options.spacing.inner>>px 0px <<post.header.options.spacing.inner>>px;color:<<post.header.options.colors.link>>;}\n" +
						"$.post_option_text:hover{color:<<post.header.options.colors.link_hover>>;}\n" +
						"$.post_option.reply_to>$.post_option_text:before{content:\"<<!escape_string:post.header.options.text.reply_to>>\";}\n" +
						//}

						//{ Post header backlinks
						"$.post_backlinks{<<!font:post.header.backlinks.font>>}\n" +
						"$.post_footer>$.post_backlinks{<<!font:post.footer.backlinks.font>>}\n" +
						"$.post_backlinks.empty{display:none;}\n" +
						"$.post_backlinks:not(.empty):before{content:\"<<!escape_string:post.header.backlinks.label>>\";}\n" +
						"$.post_header>$.post_backlinks>$.post_backlink:first-child{margin-left:<<post.header.backlinks.spacing_first>>px;}\n" +
						//}

						//{ Backlinks
						"$.post_backlink{color:<<post.header.backlinks.colors.text>>;text-decoration:none;}\n" +
						"$.post_backlink:hover{color:<<post.header.backlinks.colors.text_hover>>;}\n" +
						"$.post_backlink.open{color:<<post.header.backlinks.colors.text_open>>;}\n" +
						"$.post_backlink.open:hover{color:<<post.header.backlinks.colors.text_open_hover>>;}\n" +
						"$.post_backlink.highlighted{border-width:0px 0px 1px 0px;margin-bottom:-1px;border-style:dashed;border-color:<<post.header.backlinks.colors.text_hl>>;color:<<post.header.backlinks.colors.text_hl>>;}\n" +
						"$.post_backlink:before{content:\" \";width:0px;display:inline-block;overflow:hidden;}\n" +
						"$.post_backlink+$.post_backlink{margin-left:<<post.header.backlinks.spacing>>px;}\n" +

						"$.post_footer>$.post_backlink{color:<<post.footer.backlinks.colors.text>>;text-decoration:none;}\n" +
						"$.post_footer>$.post_backlink:hover{color:<<post.footer.backlinks.colors.text_hover>>;}\n" +
						"$.post_footer>$.post_backlink.open{color:<<post.footer.backlinks.colors.text_open>>;}\n" +
						"$.post_footer>$.post_backlink.open:hover{color:<<post.footer.backlinks.colors.text_open_hover>>;}\n" +
						"$.post_footer>$.post_backlink.highlighted{border-width:0px 0px 1px 0px;margin-bottom:-1px;border-style:dashed;border-color:<<post.footer.backlinks.colors.text_hl>>;color:<<post.footer.backlinks.colors.text_hl>>;}\n" +
						"$.post_footer>$.post_backlink:before{content:\" \";width:0px;display:inline-block;overflow:hidden;}\n" +
						"$.post_footer>$.post_backlink+$.post_backlink{margin-left:<<post.footer.backlinks.spacing>>px;}\n" +
						//}

						//{ Post header settings link
						"$.post_settings{color:<<post.header.options.colors.link>>;cursor:pointer;<<css.transition>>:opacity <<post.header.settings.opacity.transition.time>>s <<post.header.settings.opacity.transition.method>> <<post.header.settings.opacity.transition.delay>>s;opacity:<<post.header.settings.opacity.normal>>;}\n" +
						"$.post:hover>$.post_header>$.post_settings{opacity:<<post.header.settings.opacity.hover>>;}\n" +
						"$.post_settings:hover{color:<<post.header.options.colors.link_hover>>;}\n" +
						"$.post_settings:after{content:\"<<!escape_string:symbols.triangles.down>>\";}\n" +
						//}

						//{ Post image
						"$.post_image_container{margin:0px;padding:<<post.comment.padding.top>>px <<post.comment.padding.left>>px <<post.comment.padding.bottom>>px <<post.image.padding.left>>px;display:inline-block;float:left;}\n" +
						"$.post_image_container.embed{margin:0px;padding-bottom:0px;display:block;float:none;}\n" +

						"$.post_image_link{padding:0px;margin:0px;border:0px hidden;display:inline-block;position:relative;background-color:<<post.image.reply.bg>>;}\n" +
						"$.post_image_link>$.post_image{padding:0px;margin:0px;display:block;float:none;box-shadow:<<!shadow:post.image.reply.thumbnail.shadow>>;}\n" +
						"$.post_image_container.embed>$.post_image_link>$.post_image:not(.full){display:none;}\n" +
						"$.post_image_container.embed>$.post_image_link>$.post_image.full{position:relative;box-shadow:<<!shadow:post.image.reply.full.shadow>>;}\n" +
						"$.post_image_container.embed>$.post_image_link>$.post_image_thumbnail{display:block;position:absolute;left:0;top:0;bottom:0;right:0;}\n" +
						"$.post_image_container.embed.loaded>$.post_image_link>$.post_image_thumbnail{display:none;}\n" +

						"$.post_container.op>$.post>$.post_image_container{padding:0px <<post.comment.padding.left>>px 0px 0px;}\n" +
						"$.post_container.op>$.post>$.post_image_container>$.post_image_link{background-color:<<post.image.op.bg>>;}\n" +
						"$.post_container.op>$.post>$.post_image_container>$.post_image_link>$.post_image{box-shadow:<<!shadow:post.image.op.thumbnail.shadow>>;}\n" +
						"$.post_container.op>$.post>$.post_image_container.embed>$.post_image_link>$.post_image.full{box-shadow:<<!shadow:post.image.op.full.shadow>>;}\n" +
						//}

						//{ File info
						"$.post_file_info{padding:<<post.file_info.padding.top>>px <<post.file_info.padding.right>>px <<post.file_info.padding.bottom>>px <<post.file_info.padding.left>>px;margin:0px 0px -<<post.comment.padding.top>>px 0px;<<!font:post.file_info.font>>}\n" +
						"$.post_container.op>$.post>$.post_file_info{padding:0px 0px <<post.file_info.padding.bottom>>px 0px;margin:0px;}\n" +
						"$.post_file_info_file{text-decoration:none;<<!font:post.file_info.file_name.font>>}\n" +
						"$.post_file_info_attributes{<<!font:post.file_info.attributes.font>>}\n" +
						"$.post_file_info_attributes:before{content:\"<<!escape_string:post.file_info.attributes.prefix>>\";}\n" +
						"$.post_file_info_attributes:after{content:\"<<!escape_string:post.file_info.attributes.suffix>>\";}\n" +
						"$.post_file_info>a+a," +
						"$.post_file_info>a+span," +
						"$.post_file_info>span+a," +
						"$.post_file_info>span+span{margin-left:<<post.file_info.spacing>>px;}\n" +

						"$.post_file_info_extra_links{<<!font:post.file_info.file_extras.font>>}\n" +
						"$.post_file_info_extra_link{text-decoration:none;}\n" +
						"$.post_file_info_extra_link+$.post_file_info_extra_link{margin-left:<<post.file_info.file_extras.spacing>>px;}\n" +
						//}

						//{ Comment
						"$.post_body," +
						"$.post_body_full{word-wrap:break-word;color:<<post.comment.colors.text>>;display:block;margin:0px;padding:<<post.comment.padding.top>>px <<post.comment.padding.right>>px <<post.comment.padding.bottom>>px <<post.comment.padding.left>>px;<<!font:post.comment.font>>}\n" +
						"$.post_container.op>$.post>$.post_body," +
						"$.post_container.op>$.post>$.post_body_full{padding:<<post.comment.padding.top>>px <<post.comment.padding.right>>px <<post.comment.padding.bottom>>px 0px;}\n" +
						"$.post_body.full," +
						"$.post_body:not(.full)+$.post_body_full{display:none;}\n" +
						"$.post_body_after{display:block;clear:both;height:0px;margin:0px;padding:0px;}" +
						//}

						//{ Notifications
						"$.post_notifications{text-indent:<<post.notifications.spacing.outer>>px;margin-left:-<<post.notifications.spacing.outer>>px;}\n" +
						"$.post_notifications.empty{display:none;}\n" +
						"$.post_container.reply>$.post>$.post_notifications{padding:<<post.notifications.padding.top>>px <<post.comment.padding.right>>px <<post.comment.padding.bottom>>px <<post.comment.padding.left>>px;margin-top:-<<post.comment.padding.bottom>>px;}\n" +

						"$.post_notification{vertical-align:middle;position:relative;text-indent:0px;display:inline-block;color:<<post.notifications.colors.text>>;<<!font:post.notifications.font>>}\n" +
						"$.post_notification:before{vertical-align:middle;content:\"<<!escape_string:post.notifications.separator.start>>\";}\n" +
						"$.post_notification:after{vertical-align:middle;content:\"<<!escape_string:post.notifications.separator.end>>\";}\n" +
						"$.post_notification_message{vertical-align:middle;position:relative;text-decoration:none;padding:0px <<post.notifications.spacing.inner>>px 0px <<post.notifications.spacing.inner>>px;color:<<post.notifications.colors.link>>;}\n" +
						"$.post_notification_message:hover{color:<<post.notifications.colors.link_hover>>;}\n" +

						"$.post_notification_message>$.post_notification_text{position:relative;vertical-align:baseline;}\n" +
						"$.post_notification.truncated>$.post_notification_message>$.post_notification_text:before{content:\"<<!escape_string:post.notifications.text.too_long>>\"}\n" +
						"$.post_notification.truncated.expand>$.post_notification_message>$.post_notification_text:before{content:\"<<!escape_string:post.notifications.text.too_long_expand>>\"}\n" +
						"$.post_notification.truncated.shrink>$.post_notification_message>$.post_notification_text:before{content:\"<<!escape_string:post.notifications.text.too_long_shrink>>\"}\n" +
						"$.post_notification.omitted>$.post_notification_message>$.post_notification_text:before{content:\"<<!escape_string:post.notifications.text.omitted_hidden_prefix>>\" attr(omitted_value) \"<<!escape_string:post.notifications.text.omitted_hidden_suffix>>\";}\n" +
						"$.post_notification.omitted.shrink>$.post_notification_message>$.post_notification_text:before{content:\"<<!escape_string:post.notifications.text.omitted_visible_prefix>>\" attr(omitted_value) \"<<!escape_string:post.notifications.text.omitted_visible_suffix>>\";}\n" +

						"$.post_notification.loaded>$.post_notification_message>$.post_notification_progress{display:none;}\n" +
						"$.post_notification_progress{position:absolute;left:0px;top:0;right:0px;bottom:0;opacity:<<post.notifications.progress.opacity>>;}\n" +
						"$.post_notification_progress.ajax{background-color:<<post.notifications.progress.colors.ajax>>;}\n" +
						"$.post_notification_progress.parse{background-color:<<post.notifications.progress.colors.parse>>;}\n" +
						"$.post_notification_progress_inner{position:absolute;left:0;top:0;width:0px;bottom:0;}\n" +
						"$.post_notification_progress_inner.ajax{background-color:<<post.notifications.progress.colors.ajax>>;}\n" +
						"$.post_notification_progress_inner.parse{background-color:<<post.notifications.progress.colors.parse>>;}\n" +
						"$.post_notification+$.post_notification{padding-left:<<post.notifications.spacing.outer>>px;}\n" +
						//}

						//{ Footer
						"$.post_footer{clear:both;display:block;margin:0px <<post.footer.padding.right_outer>>px <<post.footer.padding.bottom>>px <<post.footer.padding.left_outer>>px;border-width:<<post.footer.border.size>>px 0px 0px 0px;border-style:<<post.footer.border.style>>;padding:<<post.footer.padding.top_inner>>px <<post.footer.padding.right_inner>>px 0px <<post.footer.padding.left_inner>>px;<<!font:post.footer.font>>}\n" +
						"$.post_container.op>$.post>$.post_footer{margin-left:0px;margin-right:0px;padding-left:0px;padding-right:0px;border-color:<<post.footer.border.colors.op>>;}\n" +
						"$.post_notifications:not(.empty)+$.post_footer{margin-top:<<post.footer.padding.top_outer>>px;}\n" +
						"$.post_container.op.highlighted>$.post>$.post_footer{border-color:<<post.footer.border.colors.reply>>;}\n" +
						"$.post_container.reply>$.post>$.post_footer{border-color:<<post.footer.border.colors.reply_hl>>;}\n" +
						"$.post_container.reply.highlighted>$.post>$.post_footer{border-color:<<post.footer.border.colors.reply_hl>>;}\n" +
						"$.post_footer.empty," +
						"$.post_footer.hidden{display:none;}\n" +
						"$.post_footer>$.post_backlinks:not(.empty):before{content:\"<<!escape_string:post.footer.backlinks.label>>\";}\n" +
						"$.post_footer>$.post_backlinks>$.post_backlink:first-child{margin-left:<<post.footer.backlinks.spacing_first>>px;}\n" +
						//}

						//{ Backlink/reference targets
						"$.post_backlink[to_target]:after{white-space:nowrap;content:\"<<!escape_string:post.backlink_indicator.suffix_first>>\" attr(to_target) \"<<!escape_string:post.backlink_indicator.suffix_last>>\";}\n" +
						"$.post_reference[to_target]:after{white-space:nowrap;content:\"<<!escape_string:post.reference_indicator.suffix_first>>\" attr(to_target) \"<<!escape_string:post.reference_indicator.suffix_last>>\";}\n" +
						//}

						//{ Comment stuff
						"$.spoiler{color:<<post.comment.colors.spoiler.text>>;background-color:<<post.comment.colors.spoiler.bg>>;}\n" +
						"$.spoiler:hover{color:<<post.comment.colors.spoiler.text_hover>>;background-color:<<post.comment.colors.spoiler.bg_hover>>;}\n" +
						"$.quote{color:<<post.comment.colors.quote.text>>;}\n" +
						"$.quote:hover{color:<<post.comment.colors.quote.text_hover>>;}\n" +
						"$.post_link{color:<<post.comment.colors.link.text>>;}\n" +
						"$.post_link:hover{color:<<post.comment.colors.link.text_hover>>;}\n" +
						//}

						//{ Comment references
						"$.post_reference{color:<<post.comment.colors.reply_link.text>>;text-decoration:none;}\n" +
						"$.post_reference:hover{color:<<post.comment.colors.reply_link.text_hover>>;}\n" +
						"$.post_reference.open{color:<<post.comment.colors.reply_link.text_open>>;}\n" +
						"$.post_reference.open:hover{color:<<post.comment.colors.reply_link.text_open_hover>>;}\n" +
						"$.post_reference+$.post_container.inline{display:table;}\n" +
						"$.post_reference+$.post_container.inline+br{display:none;}\n" +
						"$.post_reference.highlighted{border-width:0px 0px 1px 0px;margin-bottom:-1px;border-style:dashed;border-color:<<post.comment.colors.reply_link.text_hl>>;color:<<post.comment.colors.reply_link.text_hl>>;}\n" +
						//}

						//{ Floating inline
						"$.floating_inline_container{position:absolute;left:0;top:0;right:0;margin:0px;padding:0px;}\n" +
						"$.post_container.floating{position:absolute;z-index:120;display:inline-block;}\n" +
						"$.post_container.floating>$.post{box-shadow:<<!shadow:post.inline.floating.shadow>>;}\n" +
						//}

						//{ Inlining
						"$.post_embedded_backlink_container.empty{display:none;}\n" +
						"$.post_embedded_backlink_container{padding:<<post.inline.container_padding.top>>px <<post.inline.container_padding.right>>px <<post.inline.container_padding.bottom>>px <<post.inline.container_padding.left>>px;}\n" +
						"$.post_embedded_backlink_container>$.post_container.inline{display:table;}\n" +
						"$.post_container.inline>$.post{box-shadow:<<!shadow:post.inline.embedded.shadow>>;}\n" +
						//}

						//{ Image preview
						"$.image_preview{}\n" +
						"$.image_preview_inner_1{position:fixed;z-index:200;display:block;}\n" +
						"$.image_preview_inner_2{position:relative;width:100%;height:100%;background-color:<<image_preview.colors.bg>>;box-shadow:<<!shadow:image_preview.shadow>>;}\n" +
						"$.image_preview_inner_3{position:relative;width:100%;height:100%;overflow:hidden;}\n" +
						"$.image_preview_origin{position:absolute;left:50%;top:50%;}\n" +
						"$.image_preview_size{position:absolute;left:0;top:0;}\n" +
						"$.image_preview_image_container{position:absolute;display:block;background-color:transparent;left:-50%;top:-50%;width:100%;height:100%;}\n" +
						"$.image_preview_thumbnail{display:block;background-position:center center;background-repeat:no-repeat;background-color:transparent;opacity:<<image_preview.thumbnail.opacity>>;position:absolute;left:0;top:0;bottom:0;right:0;}\n" +
						"$.image_preview_thumbnail.hidden{display:none;}\n" +
						"$.image_preview_thumbnail.main{display:block;opacity:1;}\n" +
						"$.image_preview_image{display:block;float:none;margin:0px;padding:0px;border:0px;position:absolute;left:0;top:0;width:100%;height:100%;}\n" +
						"$.image_preview_image.hidden{display:none;}\n" +
						"$.image_preview_overlay{display:block;background-color:transparent;position:absolute;left:0;top:0;bottom:0;right:0;}\n" +
						"$.image_preview_info{position:absolute;left:0;right:0;bottom:100%;padding:<<image_preview.header.padding.top>>px <<image_preview.header.padding.right>>px <<image_preview.header.padding.bottom>>px <<image_preview.header.padding.left>>px;color:<<image_preview.header.color>>;text-shadow:<<!shadow:image_preview.header.shadow>>;}\n" +
						"$.image_preview_info_item.error{color:<<image_preview.colors.error>>;}\n" +
						"$.image_preview_info_item+$.image_preview_info_item:before{content:\"<<!escape_string:image_preview.header.separator>>\"}\n" +
						"$.image_preview_connector{position:absolute;z-index:19;display:block;background-color:transparent;}\n" +
						//}

						//{ Checkboxes
						'$.checkbox{display:inline-block;background-color:<<checkbox_settings.colors.bg>>;border-style:solid;border-color:<<checkbox_settings.colors.border>>;overflow:hidden;cursor:pointer;vertical-align:middle;margin:0px;padding:0px;<<css.box-sizing>>:border-box;}\n' +
						'$.checkbox:hover{border-color:<<checkbox_settings.colors.border_hover>>;background-color:<<checkbox_settings.colors.bg_hover>>;}\n' +
						'$.checkbox_svg{fill:<<checkbox_settings.colors.check>>;opacity:1;margin:0px;padding:0px;display:block;}\n' +
						'$.checkbox:hover>$.checkbox_svg{fill:<<checkbox_settings.colors.check_hover>>;}\n' +
						'$.checkbox_input{display:none;}\n' +
						'$.checkbox_input:not(:checked)+$.checkbox_svg{opacity:0;}\n' +

						'$.checkbox.tiny{width:<<checkbox_settings.sizes.tiny.box_size>>px;height:<<checkbox_settings.sizes.tiny.box_size>>px;<<css.border-radius>>:<<checkbox_settings.sizes.tiny.border_radius>>px;border-width:<<checkbox_settings.sizes.tiny.border_width>>px;}\n' +
						'$.checkbox.tiny>$.checkbox_svg{width:<<checkbox_settings.sizes.tiny.box_size>>px;height:<<checkbox_settings.sizes.tiny.box_size>>px;}\n' +
						'$.checkbox.small{width:<<checkbox_settings.sizes.small.box_size>>px;height:<<checkbox_settings.sizes.small.box_size>>px;<<css.border-radius>>:<<checkbox_settings.sizes.small.border_radius>>px;border-width:<<checkbox_settings.sizes.small.border_width>>px;}\n' +
						'$.checkbox.small>$.checkbox_svg{width:<<checkbox_settings.sizes.small.box_size>>px;height:<<checkbox_settings.sizes.small.box_size>>px;}\n' +
						'$.checkbox.normal{width:<<checkbox_settings.sizes.normal.box_size>>px;height:<<checkbox_settings.sizes.normal.box_size>>px;<<css.border-radius>>:<<checkbox_settings.sizes.normal.border_radius>>px;border-width:<<checkbox_settings.sizes.normal.border_width>>px;}\n' +
						'$.checkbox.normal>$.checkbox_svg{width:100%;height:100%;}\n' +
						//}

						//{ Content padding
						"$.content_padding.top{display:block;height:<<body.content_padding.top>>px;}\n" +
						"$.content_padding.bottom{display:block;height:<<body.content_padding.bottom>>px;}\n" +
						//}

						//{ Header
						"$.header{position:absolute;left:0;top:0;right:0;z-index:100;<<!font:header.font>>}\n" +
						"$.header:after{clear:both;}\n" +
						"$.header.fixed{position:fixed;}\n" +
						"$.header_background{position:absolute;left:0;top:0;bottom:0;right:0;opacity:<<header.background.opacity>>;box-shadow:<<!shadow:header.background.shadow>>;<<!gradient:header.background.gradient>>}\n" +
						"$.header_content{display:block;position:relative;padding:<<header.padding>>px;}\n" +

						"$.header_boards{display:inline;text-align:left;color:<<header.boards.colors.group>>;}\n" +
						"$.header_board_group{color:<<header.boards.colors.separator>>;}\n" +
						"$.header_board_group:before{content:\"<<!escape_string:header.separators.group_before>>\";}\n" +
						"$.header_board_group:after{content:\"<<!escape_string:header.separators.group_after>>\";}\n" +
						"$.header_board_group+$.header_board_group{margin-left:<<header.spacing.group>>px;}\n" +
						"$.header_board{display:inline-block;}\n" +
						"$.header_board+$.header_board:before{content:\"<<!escape_string:header.separators.group_inner>>\"}\n" +
						"$.header_board_link{padding:0px <<header.spacing.board>>px 0px <<header.spacing.board>>px;text-decoration:none;color:<<header.boards.colors.link>>;}\n" +
						"$.header_board_link:hover{color:<<header.boards.colors.link_hover>>;}\n" +
						"$.header_board:not(.named)>$.header_board_link>$.header_board_text_name," +
						"$.header_board:not(.current)>$.header_board_link>$.header_board_text_name{display:none;}\n" +
						"$.header_board.current.named>$.header_board_link>$.header_board_text_short{display:none;}\n" +
						"$.header_board.current>$.header_board_link{color:<<header.boards.current.colors.link>>;text-shadow:<<!shadow:header.boards.current.shadow>>;<<!font:header.boards.current.font>>}\n" +
						"$.header_board.current>$.header_board_link:hover{color:<<header.boards.current.colors.link_hover>>;text-shadow:<<!shadow:header.boards.current.shadow.hover>>;}\n" +

						"$.header_custom{display:inline-block;float:right;position:relative;white-space:nowrap;}\n" +
						"$.header_options{display:block;padding-bottom:<<header.padding>>px;}\n" +
						"$.header_option{display:inline-block;cursor:pointer;text-decoration:none;color:<<header.options.colors.link>>;}\n" +
						"$.header_option:not(.no_link):hover{color:<<header.options.colors.link_hover>>;}\n" +
						"$.header_option+$.header_option{margin-left:<<header.spacing.options>>px;}\n" +
						//}

						//{ Menu
						"$.menu{position:absolute;display:inline-block;z-index:150;<<!font:menu.font>>}\n" +
						"$.menu.small{position:absolute;display:inline-block;z-index:150;<<!font:menu.font_small>>}\n" +
						"$.menu.fixed{position:fixed;}\n" +
						"$.menu.hidden{display:none;}\n" +
						"$.menu_background{position:absolute;left:0;top:0;bottom:0;right:0;box-shadow:<<!shadow:menu.shadow>>;opacity:<<menu.shadow.opacity>>;}\n" +
						"$.menu_options{position:relative;}\n" +
						"$.menu_option{white-space:nowrap;position:relative;padding:<<menu.padding.top>>px <<menu.padding.right>>px <<menu.padding.bottom>>px <<menu.padding.left>>px;cursor:pointer;<<css.box-sizing>>:border-box;text-decoration:none;position:relative;display:block;color:<<menu.colors.text>>;}\n" +
						"$.menu_option:hover{position:relative;display:block;color:<<menu.colors.text_hover>>;}\n" +
						"$.menu_option_background{position:absolute;left:0;top:0;bottom:0;right:0;background-color:<<menu.colors.bg>>;border-width:<<menu.border.size>>px <<menu.border.size>>px 0px <<menu.border.size>>px;border-style:<<menu.border.style>>;border-color:<<menu.border.color>> <<menu.border.color>> <<menu.border.color>> <<menu.border.color>>;}\n" +
						"$.menu_option:hover>$.menu_option_background{background-color:<<menu.colors.bg_hover>>;border-color:<<menu.border.color_hover>> <<menu.border.color_hover>> <<menu.border.color_hover>> <<menu.border.color_hover>>;}\n" +
						"$.menu_option:hover+$.menu_option>$.menu_option_background{border-top-color:<<menu.border.color_hover>>;}\n" +
						"$.menu_option:last-child>$.menu_option_background{border-bottom-width:1px;}\n" +
						"$.menu_option>$.menu_option_content{position:relative;}\n" +

						"$.menu:not(.expandable_on_left)>$.menu_options.expandable>$.menu_option>$.menu_option_content:after{content:\"\";display:inline-block;width:1.5em;text-align:right;}\n" +
						"$.menu:not(.expandable_on_left):not(.expandable_point_left)>$.menu_options.expandable>$.menu_option.expandable>$.menu_option_content:after{content:\"<<!escape_string:symbols.triangles.right>>\";}\n" +
						"$.menu:not(.expandable_on_left).expandable_point_left>$.menu_options.expandable>$.menu_option.expandable>$.menu_option_content:after{content:\"<<!escape_string:symbols.triangles.left>>\";}\n" +
						"$.menu.expandable_on_left>$.menu_options.expandable>$.menu_option>$.menu_option_content:before{content:\"\";display:inline-block;width:1.5em;text-align:left;}\n" +
						"$.menu.expandable_on_left:not(.expandable_point_left)>$.menu_options.expandable>$.menu_option.expandable>$.menu_option_content:before{content:\"<<!escape_string:symbols.triangles.right>>\";}\n" +
						"$.menu.expandable_on_left.expandable_point_left>$.menu_options.expandable>$.menu_option.expandable>$.menu_option_content:before{content:\"<<!escape_string:symbols.triangles.left>>\";}\n" +
						//}

						//{ Page selector
						"$.menu_option.page_selection{text-align:center;}\n" +
						//}

						//{ Popups
						"$.popup{position:fixed;z-index:170;<<css.box-sizing>>:border-box;color:<<popup.colors.text>>;<<!font:popup.font>>}\n" +
						"$.popup_content{position:relative;margin:<<popup.bg.size>>px;}\n" +
						"$.popup_title_bar{cursor:move;}\n" +

						"$.popup_title{text-shadow:<<!shadow:popup.title.shadow>>;<<!font:popup.title.font>>}\n" +

						"$.popup_close{cursor:pointer;position:absolute;right:0;top:0;color:<<popup.close.color>>;padding:0px <<popup.close.padding>>px 0px <<popup.close.padding>>px;}\n" +
						"$.popup_close:hover{color:<<popup.close.color_hover>>;}\n" +
						"$.popup_close:after{content:\"<<symbols.mult>>\";}\n" +
						"$.popup_close.hidden{display:none;}\n" +

						"$.popup_description{<<!font:popup.description.font>>}\n" +
						"$.popup_input{display:block;width:100%;<<css.box-sizing>>:border-box;resize:none;<<!font:popup.input.font>>}\n" +
						"$.popup_input," +
						"$.popup_button{margin:0px;padding:<<popup.input.padding>>px;background-color:<<popup.input.colors.bg>>;color:<<popup.input.colors.text>>;border:<<popup.input.border.size>>px <<popup.input.border.style>> <<popup.input.border.color>>;}\n" +
						"$.popup_input:hover," +
						"$.popup_button:hover{background-color:<<popup.input.colors.bg_hover>>;border-color:<<popup.input.border.color_hover>>;}\n" +
						"$.popup_input:focus," +
						"$.popup_button:active{background-color:<<popup.input.colors.bg_selected>>;border-color:<<popup.input.border.color_selected>>;}\n" +

						"$.popup_buttons{text-align:right;}\n" +

						"$.popup_input{color:<<popup.input.colors.text>>;<<!font:popup.input.font>>}\n" +
						"$.popup_input::-webkit-input-placeholder{color:<<popup.input.colors.placeholder>>;opacity:<<popup.input.colors.placeholder_opacity>>;}\n" +
						"$.popup_input:-moz-placeholder{color:<<popup.input.colors.placeholder>>;opacity:<<popup.input.colors.placeholder_opacity>>;}\n" +
						"$.popup_input::-moz-placeholder{color:<<popup.input.colors.placeholder>>;opacity:<<popup.input.colors.placeholder_opacity>>;}\n" +
						"$.popup_input:-ms-input-placeholder{color:<<popup.input.colors.placeholder>>;opacity:<<popup.input.colors.placeholder_opacity>>;}\n" +

						"$.popup_button{cursor:pointer;display:inline-block;<<css.box-sizing>>:border-box;<<!font:popup.input.font>>}\n" +
						"$.popup_button+$.popup_button{margin-left:<<popup.buttons.spacing>>px;}\n" +

						"$.popup_content:not(.packed)>$.popup_content_item+$.popup_content_item{margin-top:<<popup.separation>>px;}\n" +

						"$.popup_background{position:absolute;left:0;top:0;bottom:0;right:0;background:<<popup.bg.color>>;<<css.border-radius>>:<<popup.bg.radius>>px;box-shadow:<<!shadow:popup.bg.shadow>>;opacity:<<popup.bg.opacity>>;}\n" +
						"$.popup_resizers{position:absolute;left:0;top:0;bottom:0;right:0;}\n" +
						"$.popup_resizers.hidden{display:none;}\n" +
						"$.popup_resizer${position:absolute;}\n" +
						"$.popup_resizer.top{height:<<popup.resizers.size>>px;top:0;cursor:n-resize;}" +
						"$.popup_resizer.bottom{height:<<popup.resizers.size>>px;bottom:0;cursor:n-resize;}\n" +
						"$.popup_resizer.left{width:<<popup.resizers.size>>px;left:0;cursor:e-resize;}" +
						"$.popup_resizer.right{width:<<popup.resizers.size>>px;right:0;cursor:e-resize;}\n" +
						"$.popup_resizer.top:not(.left):not(.right)," +
						"$.popup_resizer.bottom:not(.left):not(.right){left:<<popup.resizers.size>>px;right:<<popup.resizers.size>>px;}\n" +
						"$.popup_resizer.left:not(.top):not(.bottom)," +
						"$.popup_resizer.right:not(.top):not(.bottom){top:<<popup.resizers.size>>px;bottom:<<popup.resizers.size>>px;}\n" +
						"$.popup_resizer.top.left{cursor:se-resize;}\n" +
						"$.popup_resizer.top.right{cursor:sw-resize;}\n" +
						"$.popup_resizer.bottom.right{cursor:se-resize;}\n" +
						"$.popup_resizer.bottom.left{cursor:sw-resize;}\n" +
						//}

						//{ Quick reply
						"$.quick_reply{position:fixed;display:inline-block;z-index:115;}\n" +
						"$.quick_reply.closed{display:none;}\n" +

						"$.quick_reply>$.popup_content{margin:<<popup.bg.size>>px;position:relative;z-index:5;}\n" +
						"$.qr_row{display:block;line-height:0px;white-space:nowrap;position:relative;}\n" +
						"$.qr_cell{vertical-align:middle;display:inline-block;<<css.box-sizing>>:border-box;position:relative;line-height:normal;white-space:normal;}\n" +

						"$.qr_cell_inner{border:<<popup.input.border.size>>px solid transparent;<<css.box-sizing>>:border-box;width:100%;height:100%;padding:0px;}\n" +
						"$.qr_cell_inner_b," +
						"$.qr_cell_inner_l," +
						"$.qr_cell_inner_t{position:absolute;z-index:-3;<<css.box-sizing>>:border-box;border:<<popup.input.border.size>>px <<popup.input.border.style>> <<popup.input.border.color>>;}" +
						"$.qr_cell_inner_b{background:<<popup.input.colors.bg>>;left:0;top:0;bottom:0;right:0;}\n" +
						"$.qr_cell_inner_l{right:100%;top:0;bottom:0;border-left-width:0px;}\n" +
						"$.qr_cell_inner_t{left:0;bottom:100%;right:0;border-top-width:0px;}\n" +

						"$.qr_cell:nth-of-type(1)>$.qr_cell_inner>$.qr_cell_inner_l{display:none;}\n" +
						"$.qr_cell:nth-of-type(n+2)>$.qr_cell_inner,\n" +
						"$.qr_cell:nth-of-type(n+2)>$.qr_cell_inner>$.qr_cell_inner_b{border-left-width:0px;}\n" +
						"$.qr_row.top>$.qr_cell>$.qr_cell_inner>$.qr_cell_inner_t," +
						"$.popup_content:not(.packed)>$.qr_row>$.qr_cell>$.qr_cell_inner>$.qr_cell_inner_t{display:none;}\n" +
						"$.popup_content.packed>$.qr_row:not(.top)>$.qr_cell>$.qr_cell_inner," +
						"$.popup_content.packed>$.qr_row:not(.top)>$.qr_cell>$.qr_cell_inner>$.qr_cell_inner_b{border-top-width:0px;}\n" +

						"$.qr_row.top>$.qr_cell:first-child>$.qr_cell_inner>$.qr_cell_inner_b{<<css.border-top-left-radius>>:<<popup.input.border.radius>>px;}\n" +
						"$.qr_row.top>$.qr_cell:last-child>$.qr_cell_inner>$.qr_cell_inner_b{<<css.border-top-right-radius>>:<<popup.input.border.radius>>px;}\n" +
						"$.qr_row.bottom>$.qr_cell:first-child>$.qr_cell_inner>$.qr_cell_inner_b{<<css.border-bottom-left-radius>>:<<popup.input.border.radius>>px;}\n" +
						"$.qr_row.bottom>$.qr_cell:last-child>$.qr_cell_inner>$.qr_cell_inner_b{<<css.border-bottom-right-radius>>:<<popup.input.border.radius>>px;}\n" +

						"$.qr_cell:hover>$.qr_cell_inner>$.qr_cell_inner_b," +
						"$.qr_cell:hover>$.qr_cell_inner>$.qr_cell_inner_l," +
						"$.qr_cell:hover>$.qr_cell_inner>$.qr_cell_inner_t{z-index:-2;border-color:<<popup.input.border.color_hover>>;}" +
						"$.qr_cell:hover>$.qr_cell_inner>$.qr_cell_inner_b{background:<<popup.input.colors.bg_hover>>;}\n" +

						"$.qr_input:focus+$.qr_cell_inner_b," +
						"$.qr_input:focus+$.qr_cell_inner_b+$.qr_cell_inner_l," +
						"$.qr_input:focus+$.qr_cell_inner_b+$.qr_cell_inner_l+$.qr_cell_inner_t," +
						"$.qr_button:active+$.qr_cell_inner_b," +
						"$.qr_button:active+$.qr_cell_inner_b+$.qr_cell_inner_l," +
						"$.qr_button:active+$.qr_cell_inner_b+$.qr_cell_inner_l+$.qr_cell_inner_t{z-index:-1;border-color:<<popup.input.border.color_selected>>;}" +
						"$.qr_input:focus+$.qr_cell_inner_b," +
						"$.qr_button:active+$.qr_cell_inner_b{background:<<popup.input.colors.bg_selected>>;}\n" +

						"$.qr_cell.no_bg>$.qr_cell_inner{border-width:0px;}\n" +
						"$.qr_cell.no_bg>$.qr_cell_inner>$.qr_cell_inner_l," +
						"$.qr_cell.no_bg>$.qr_cell_inner>$.qr_cell_inner_t{display:none;}" +
						"$.qr_cell.no_bg>$.qr_cell_inner>$.qr_cell_inner_b{border-width:0px;background:transparent;}\n" +

						"$.popup_input.qr_input," +
						"$.popup_input.qr_input:hover," +
						"$.popup_input.qr_input:focus{width:100%;margin:0px;padding:<<popup.input.padding>>px;resize:none;border:0px hidden;background:transparent;<<css.box-sizing>>:border-box;}\n" +

						"$.popup_content:not(.packed)>$.qr_row+$.qr_row{margin-top:<<popup.separation>>px;}\n" +
						//}

						//{ Quick reply items
						"$.qr_row.grab{cursor:move;}\n" +

						"$.qr_submit{cursor:pointer;width:100%;display:block;text-align:center;}\n" +
						"$.popup_button.qr_submit{background:transparent;border:0px hidden;<<css.box-sizing>>:border-box;padding:0px;margin:0px;}\n" +
						"$.qr_submit:active{}\n" +
						"$.qr_submit_text:before{content:\"<<!escape_string:qr.submit.text>>\";}\n" +
						"$.qr_submit.active>$.qr_submit_text:before{content:\"<<!escape_string:qr.submit.text_active>>\";}\n" +
						"$.qr_submit.retry>$.qr_submit_text:before{content:\"<<!escape_string:qr.submit.text_retry>>\";}\n" +

						"$.qr_main_label{white-space:nowrap;display:inline-block;}\n" +
						"$.qr_main_label_prefix{cursor:default;color:<<qr.label.color>>;cursor:pointer;}\n" +
						"$.qr_main_label_prefix:hover{color:<<qr.label.color_hover>>;}\n" +
						"$.qr_main_label_prefix:before{content:\"<<!escape_string:qr.label.text.quick_reply>>\";}\n" +
						"$.qr_main_label_target{cursor:default;}\n" +
						"$.qr_main_label_target:before{content:\"<<!escape_string:qr.target.text.left>>\";padding-right:<<qr.target.padding.inner>>px;color:<<!escape_string:qr.target.text.color>>;}\n" +
						"$.qr_main_label_target:after{content:\"<<!escape_string:qr.target.text.right>>\";padding-left:<<qr.target.padding.inner>>px;color:<<!escape_string:qr.target.text.color>>;}\n" +
						"$.qr_main_label_target_text{color:<<qr.target.color>>;cursor:pointer;text-decoration:none;}\n" +
						"$.qr_main_label_target_text:hover{color:<<qr.target.color_hover>>;}\n" +
						"$.qr_main_label_target_text:after{content:attr(target_thread);}\n" +

						"$.quick_reply.persistent>$.popup_content>$.qr_row>$.qr_cell>$.qr_cell_inner>$.qr_main_label>$.qr_main_label_prefix:before{content:\"<<!escape_string:qr.label.text.reply>>\";}\n" +
						"$.quick_reply[target_thread=\"new\"]>$.popup_content>$.qr_row>$.qr_cell>$.qr_cell_inner>$.qr_main_label>$.qr_main_label_prefix{display:none;}\n" +
						"$.quick_reply[target_thread=\"current\"]>$.popup_content>$.qr_row>$.qr_cell>$.qr_cell_inner>$.qr_main_label>$.qr_main_label_target{display:none;}\n" +
						"$.quick_reply:not([target_thread=\"new\"])>$.popup_content>$.qr_row>$.qr_cell>$.qr_cell_inner>$.qr_main_label>$.qr_main_label_prefix+$.qr_main_label_target{padding-left:<<qr.target.padding.outer>>px;}\n" +

						"$.qr_close{cursor:pointer;color:<<popup.close.color>>;padding:0px <<popup.close.padding>>px 0px <<popup.close.padding>>px;}\n" +
						"$.qr_close:hover{color:<<popup.close.color_hover>>;}\n" +
						"$.qr_close:after{content:\"<<!escape_string:symbols.mult>>\";}\n" +

						"$.qr_file_settings{position:absolute;right:0;top:0;bottom:0;white-space:nowrap;line-height:0;padding:0px;margin:0px;z-index:1;}\n" +
						"$.qr_file_settings.hidden{display:none;}\n" +
						"$.qr_file_settings_inner," +
						"$.qr_file_settings_v_aligner{vertical-align:middle;white-space:normal;line-height:normal;}\n" +
						"$.qr_file_settings_v_aligner{width:0px;height:100%;display:inline-block;}\n" +
						"$.qr_file_settings_inner{line-height:0;display:inline-block;<<css.box-sizing>>:border-box;border-right:<<popup.input.border.size>>px solid transparent;padding-right:<<popup.input.padding>>px;}\n" +
						"$.qr_file_settings_item{vertical-align:middle;display:inline-block;line-height:normal;}\n" +
						"$.qr_file_spoiler.hidden{display:none;}\n" +
						"$.qr_file_remove{color:<<popup.input.colors.link>>;text-decoration:none;padding-left:<<qr.target.padding.inner>>px;cursor:pointer;}\n" +
						"$.qr_file_remove:hover{color:<<popup.input.colors.link_hover>>;}\n" +
						"$.qr_file_remove:after{content:\"<<!escape_string:symbols.mult>>\";}\n" +
						"$.qr_file{display:none;}\n" +

						"$.qr_saved_settings{position:absolute;right:0;top:0;bottom:0;white-space:nowrap;line-height:0;padding:0px;margin:0px;z-index:1;}\n" +
						"$.qr_saved_settings.hidden{display:none;}\n" +
						"$.qr_saved_settings_inner," +
						"$.qr_saved_settings_v_aligner{vertical-align:middle;white-space:normal;line-height:normal;}\n" +
						"$.qr_saved_settings_v_aligner{width:0px;height:100%;display:inline-block;}\n" +
						"$.qr_saved_settings_inner{line-height:0;display:inline-block;<<css.box-sizing>>:border-box;border-right:<<popup.input.border.size>>px solid transparent;padding-right:<<popup.input.padding>>px;}\n" +
						"$.qr_saved_settings_unsave{vertical-align:middle;display:inline-block;line-height:normal;}\n" +
						"$.qr_saved_settings_unsave{color:<<popup.input.colors.placeholder>>;text-decoration:none;padding-left:<<qr.target.padding.inner>>px;cursor:pointer;}\n" +
						"$.qr_saved_settings_unsave:hover{color:<<popup.input.colors.link_hover>>;}\n" +
						"$.qr_saved_settings_unsave:after{content:\"<<!escape_string:symbols.mult>>\";}\n" +
						"$.qr_row.top>$.qr_cell>$.qr_cell_inner>$.qr_saved_settings>$.qr_saved_settings_inner{border-top:<<popup.input.border.size>>px solid transparent;}\n" +

						"$.qr_status{display:block;}\n" +
						"$.qr_status.hidden{display:none;}\n" +
						"$.qr_status_inner{padding:<<qr.status.padding.top>>px 0px <<qr.status.padding.bottom>>px 0px;}\n" +
						"$.qr_status_text{white-space:nowrap;color:<<qr.status.text_color>>;<<!font:qr.status.font>>}\n" +
						"$.qr_status_attempt{padding-left:<<qr.status.spacing>>px;}\n" +
						"$.qr_status_attempt.hidden{display:none;}\n" +
						"$.qr_progress{height:<<qr.status.bar_height>>px;width:100%;display:block;position:relative;}\n" +
						"$.qr_progress.default{background-color:<<qr.status.default.color>>;}\n" +
						"$.qr_progress.parse{background-color:<<qr.status.parse.color>>;}\n" +
						"$.qr_progress.upload{background-color:<<qr.status.upload.color>>;}\n" +
						"$.qr_progress.cooldown{background-color:<<qr.status.cooldown.color>>;}\n" +
						"$.qr_progress.download{background-color:<<qr.status.download.color>>;}\n" +
						"$.qr_progress.context_acquire{background-color:<<qr.status.context_acquire.color>>;}\n" +
						"$.qr_progress_inner{position:absolute;left:0;width:0px;bottom:0;top:0;}\n" +
						"$.qr_progress_inner.parse{background-color:<<qr.status.parse.color>>;}\n" +
						"$.qr_progress_inner.upload{background-color:<<qr.status.upload.color>>;}\n" +
						"$.qr_progress_inner.cooldown{background-color:<<qr.status.cooldown.color>>;}\n" +
						"$.qr_progress_inner.download{background-color:<<qr.status.download.color>>;}\n" +
						"$.qr_progress_inner.context_acquire{background-color:<<qr.status.context_acquire.color>>;}\n" +

						"$.qr_cooldown_container{overflow:hidden;}\n" +
						"$.qr_cooldown{position:absolute;left:0;top:0;bottom:0;right:0;opacity:<<qr.cooldown.opacity>>;<<css.transition>>:opacity 0s;background-color:<<qr.cooldown.colors.bg>>;}\n" +
						"$.qr_cooldown.ready{opacity:0;<<css.transition>>:opacity <<qr.cooldown.transition.time>>s <<qr.cooldown.transition.method>> <<qr.cooldown.transition.delay>>s;}\n" +
						"$.qr_cooldown_inner{position:absolute;left:0;top:0;bottom:0;width:0%;background-color:<<qr.cooldown.colors.bar>>;}\n" +
						//}

						//{ Messenger
						"$.message_container{position:fixed;left:50%;top:0;width:<<messages.size.width>>px;}\n" +
						"$.message{position:absolute;z-index:160;left:-50%;width:100%;padding:<<messages.padding.top>>px <<messages.padding.right>>px <<messages.padding.bottom>>px <<messages.padding.left>>px;<<css.box-sizing>>:border-box;}\n" +

						"$.message>$.message_background{position:absolute;left:0;top:0;bottom:0;right:0;opacity:<<messages.bg.opacity>>;box-shadow:<<!shadow:messages.bg.shadow>>;<<css.border-radius>>:<<messages.border.radius>>px;}\n" +
						"$.message.plain>$.message_background{background-color:<<messages.colors.plain.bg>>;}\n" +
						"$.message.error>$.message_background{background-color:<<messages.colors.error.bg>>;}\n" +
						"$.message.parse>$.message_background{background-color:<<messages.colors.parse.bg>>;}\n" +
						"$.message.okay>$.message_background{background-color:<<messages.colors.okay.bg>>;}\n" +
						"$.message.good>$.message_background{background-color:<<messages.colors.good.bg>>;}\n" +
						"$.message.info>$.message_background{background-color:<<messages.colors.info.bg>>;}\n" +

						"$.message.minimized>$.message_background{opacity:<<messages.bg.opacity>>;box-shadow:<<!shadow:messages.bg.shadow_min>>;}\n" +
						"$.message.minimized{left:50%;margin-left:8px;width:auto;}\n" +
						"$.message.minimized>$.message_inner>$:not(.message_buttons){display:none;}\n" +
						"$.message.minimized>$.message_inner>$.message_buttons{position:relative;}\n" +

						"$.message.plain{color:<<messages.colors.plain.text>>;}\n" +
						"$.message.error{color:<<messages.colors.error.text>>;}\n" +
						"$.message.parse{color:<<messages.colors.parse.text>>;}\n" +
						"$.message.okay{color:<<messages.colors.okay.text>>;}\n" +
						"$.message.good{color:<<messages.colors.good.text>>;}\n" +
						"$.message.info{color:<<messages.colors.info.text>>;}\n" +
						"$.message_inner{position:relative;width:100%;}\n" +
						"$.message_title{padding-bottom:<<messages.title.separation>>px;<<!font:messages.title.font>>}\n" +

						"$.message_buttons{position:absolute;right:0;top:0;text-align:right;line-height:100%;}\n" +
						"$.message_button{display:block;text-decoration:none;cursor:pointer;z-index:1;position:relative;}\n" +
						"$.message_button.close:after{content:\"<<!escape_string:symbols.mult>>\";}\n" +
						"$.message_button.minimize:after{content:\"<<!escape_string:symbols.minus>>\";}\n" +
						"$.message_timer{display:block;opacity:<<messages.timer.opacity>>;position:relative;top:-0.5em;cursor:default;<<!font:messages.timer.font>>}\n" +

						"$.message_body{<<!font:messages.body.font>>}\n" +

						"$.message.plain>$.message_inner $.message_shadow," +
						"$.message.plain>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.plain.title_shadow>>;}\n" +
						"$.message.error>$.message_inner $.message_shadow," +
						"$.message.error>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.error.title_shadow>>;}\n" +
						"$.message.parse>$.message_inner $.message_shadow," +
						"$.message.parse>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.parse.title_shadow>>;}\n" +
						"$.message.okay>$.message_inner $.message_shadow," +
						"$.message.okay>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.okay.title_shadow>>;}\n" +
						"$.message.good>$.message_inner $.message_shadow," +
						"$.message.good>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.good.title_shadow>>;}\n" +
						"$.message.info>$.message_inner $.message_shadow," +
						"$.message.info>$.message_inner $.message_hover_shadow:hover{text-shadow:<<messages.title.shadow.offset.left>>px <<messages.title.shadow.offset.top>>px <<messages.title.shadow.blur>>px <<messages.colors.info.title_shadow>>;}\n" +

						"$.message_link{cursor:pointer;<<!font:messages.link.font>>}\n" +
						"$.message.plain $.message_link{color:<<messages.colors.plain.link>>;}\n" +
						"$.message.plain $.message_link:hover{color:<<messages.colors.plain.link_hover>>;}\n" +
						"$.message.error $.message_link{color:<<messages.colors.error.link>>;}\n" +
						"$.message.error $.message_link:hover{color:<<messages.colors.error.link_hover>>;}\n" +
						"$.message.parse $.message_link{color:<<messages.colors.parse.link>>;}\n" +
						"$.message.parse $.message_link:hover{color:<<messages.colors.parse.link_hover>>;}\n" +
						"$.message.okay $.message_link{color:<<messages.colors.okay.link>>;}\n" +
						"$.message.okay $.message_link:hover{color:<<messages.colors.okay.link_hover>>;}\n" +
						"$.message.good $.message_link{color:<<messages.colors.good.link>>;}\n" +
						"$.message.good $.message_link:hover{color:<<messages.colors.good.link_hover>>;}\n" +
						"$.message.info $.message_link{color:<<messages.colors.info.link>>;}\n" +
						"$.message.info $.message_link:hover{color:<<messages.colors.info.link_hover>>;}\n" +

						"$.message_changes{max-height:200px;overflow-y:auto;margin-top:8px;}\n" +
						"$.message_changes.hidden{display:none;}\n" +
						"$.message_list{padding:0px;margin:0px 0px 0px 20px;list-style-type:disc;}\n" +
						"$.message_list_item{padding:0px;margin:0px;}\n" +
						"$.message_list_item+$.message_list_item{margin-top:2px;}\n" +
						"$.message_list_item+$.message_list_item.message_list_item_big_spacing{margin-top:10px;}\n" +
						//}

						//{ Messenger custom
						"$.message_progress{height:<<messages.progress_bar.height>>px;margin-top:<<messages.progress_bar.separation>>px;position:relative;display:block;width:100%;}\n" +
						"$.message_progress.hidden{display:none;}\n" +
						"$.message_progress.default{background-color:<<messages.progress_bar.colors.default>>;}\n" +
						"$.message_progress.active{background-color:<<messages.progress_bar.colors.active>>;}\n" +
						"$.message_progress_inner{position:absolute;left:0;top:0;bottom:0;width:0%;}\n" +
						"$.message_progress_inner.active{background-color:<<messages.progress_bar.colors.active>>;}\n" +
						//}

						//{ Banner
						"$.board_info{text-align:center;padding-bottom:<<board_info.padding.bottom>>px;}\n" +
						"$.board_banner_container{background:transparent;padding-bottom:<<board_info.banner.padding.bottom>>px;}\n" +
						"$.board_banner_container.error{display:none;}\n" +
						"$.board_banner{width:<<board_info.banner.size.width>>px;<<board_info.banner.size.height>>:100px;}\n" +
						"$.board_info_title{color:<<board_info.title.color>>;<<!font:board_info.title.font>>}\n" +
						"$.board_info_subtitle{color:<<board_info.subtitle.color>>;<<!font:board_info.subtitle.font>>}\n" +
						//}

						//{ Updater
						"$.updater{position:fixed;color:<<updater.colors.text>>;z-index:110;}\n" +
						"$.updater_small{position:relative;padding:<<updater.small.padding>>px;}\n" +
						"$.updater_small:before{content:\"<<!escape_string:updater.small.endings.start>>\";color:<<updater.small.endings.color>>;padding-right:<<updater.small.endings.spacing>>px;}\n" +
						"$.updater_small:after{content:\"<<!escape_string:updater.small.endings.end>>\";color:<<updater.small.endings.color>>;padding-left:<<updater.small.endings.spacing>>px;}\n" +
						"$.updater_small_item{vertical-align:middle;}\n" +

						"$.updater_counts.hidden," +
						"$.updater_counts_posts.hidden," +
						"$.updater_counts_images.hidden," +
						"$.updater_difference.hidden," +
						"$.updater_small>$.checkbox.hidden," +
						"$.updater_difference_removed.hidden{display:none;}\n" +

						"$.updater_counts_posts:not(.hidden)+$.updater_counts_images:not(.hidden):before{content:\"<<!escape_string:updater.symbols.separators.post_image>>\";}\n" +
						"$.updater_counts_posts:after{content:\"<<!escape_string:updater.symbols.post>>\";}\n" +
						"$.updater_counts_images:after{content:\"<<!escape_string:updater.symbols.image>>\";}\n" +
						"$.updater_counts_posts.limit," +
						"$.updater_counts_images.limit{color:<<updater.colors.limit>>;}\n" +
						"$.updater_counts.updater_totals>$.updater_counts_inner>$.posts+$.images:not(.hidden):before{color:<<updater.colors.text>>;}\n" +

						"$.updater_small>$.checkbox.enabled:not(.hidden)+$.updater_difference:not(.right)," +
						"$.updater_small>$.updater_difference:not(.right):not(.hidden)+$.updater_countdown," +
						"$.updater_small>$.checkbox.enabled:not(.hidden)+$.updater_difference:not(.right).hidden+$.updater_countdown," +
						"$.updater_small>$.checkbox.enabled:not(.hidden)+$.updater_difference.right+$.updater_countdown," +
						"$.updater_small>$.updater_difference.right," +
						"$.updater_small>$.updater_totals{margin-left:<<updater.small.spacing>>px;}\n" +

						"$.updater_small>$.updater_totals{cursor:move;}\n" +

						"$.updater_difference.right{float:right;}\n" +

						"$.updater_difference_added>$.updater_counts_inner:before{content:\"<<!escape_string:updater.symbols.added>>\";}\n" +
						"$.updater_difference_removed>$.updater_counts_inner:before{content:\"<<!escape_string:updater.symbols.removed>>\";}\n" +
						"$.updater_difference_added{color:<<updater.colors.added>>;}\n" +
						"$.updater_difference_removed{color:<<updater.colors.removed>>;}\n" +
						"$.updater_difference_added:not(.hidden)+$.updater_difference_removed:not(.hidden):before{content:\"<<!escape_string:updater.symbols.separators.added_removed>>\";color:<<updater.colors.text>>;}\n" +

						"$.updater_countdown{color:<<updater.colors.link>>;cursor:pointer;text-decoration:none;display:inline-block;position:relative;}\n" +
						"$.updater_countdown:hover{color:<<updater.colors.link_hover>>;}\n" +
						"$.updater_countdown.counting>$.updater_countdown_suffix:after{content:\"<<!escape_string:updater.symbols.countdown>>\";}\n" +

						"$.updater_countdown:not(.loading)>$.updater_progress{display:none;}\n" +
						"$.updater_progress{position:absolute;left:0px;top:0;right:0px;bottom:0;opacity:<<updater.small.progress.opacity>>;}\n" +
						"$.updater_progress.ajax{background-color:<<updater.small.progress.colors.ajax>>;}\n" +
						"$.updater_progress.parse{background-color:<<updater.small.progress.colors.parse>>;}\n" +
						"$.updater_progress_inner{position:absolute;left:0;top:0;width:0px;bottom:0;}\n" +
						"$.updater_progress_inner.ajax{background-color:<<updater.small.progress.colors.ajax>>;}\n" +
						"$.updater_progress_inner.parse{background-color:<<updater.small.progress.colors.parse>>;}\n" +

						"$.updater_background{position:absolute;left:0;top:0;bottom:0;right:0;background-color:<<updater.bg.color>>;opacity:<<updater.bg.opacity>>;box-shadow:<<!shadow:updater.bg.shadow>>;<<css.border-radius>>:<<updater.bg.radius>>px;}\n" +

						"$.updater.embedded{position:relative;z-index:auto;}\n" +
						"$.updater.embedded>$.updater_background{display:none;}\n" +
						"$.updater.embedded>$.updater_small{padding:0px;}\n" +
						"$.updater.embedded>$.updater_small>$.updater_small_item{vertical-align:baseline;}\n" +
						"$.updater.embedded>$.updater_small>$.updater_small_item.checkbox{vertical-align:middle;}\n" +
						//}

						//{ Overwrite styles
						"body>hr:nth-of-type(1){display:none;}\n" +
						"body>div.styles{display:none !important;position:absolute;}\n" +
						"body>div.pages{display:none;}\n" +
						"body>div.boardlist.bottom{display:none;}\n" +
						"body>p.unimportant{display:none;}\n" +
						"body>a:nth-of-type(1){display:none;}\n" +

						// Board list header
						"body>.boardlist:not(.bottom){margin:0px;padding:<<header.padding>>px;position:relative;left:0;top:0;right:0;z-index:100;<<!font:header.font>>}\n" +
						"body>.boardlist:not(.bottom):after{content:\"\";position:absolute;background:red;left:0;top:0;width:100%;height:100%;z-index:-1;opacity:<<header.background.opacity>>;box-shadow:<<!shadow:header.background.shadow>>;<<!gradient:header.background.gradient>>}\n" +
						"body>.boardlist:not(.bottom)>:not(a){display:none;}\n" +

						// Thread
						"body>form[name=\"postcontrols\"]{margin:0px;padding:<<thread.padding.top>>px <<thread.padding.right>>px <<thread.padding.bottom>>px <<thread.padding.left>>px;}\n" +
						"body>form[name=\"postcontrols\"]>div.delete{display:none;}\n" +
						"body>form[name=\"postcontrols\"]>div[id^=\"thread_\"]{margin:0px -<<thread.padding.left>>px 0px -<<thread.padding.right>>px;padding:<<thread.padding.top>>px <<thread.padding.right>>px <<thread.padding.bottom>>px <<thread.padding.left>>px;}\n" +
						"body>form[name=\"postcontrols\"]>hr," +
						"body>form[name=\"postcontrols\"]>div[id^=\"thread_\"]>hr{display:none;}\n" +
						"body>form[name=\"postcontrols\"]>br," +
						"body>form[name=\"postcontrols\"]>div[id^=\"thread_\"]>br," +
						"$.thread>br{display:none;}\n" +
						"body>form[name=\"postcontrols\"]>div+br," +
						"body>form[name=\"postcontrols\"]>div[id^=\"thread_\"]>div+br," +
						"$.thread>div+br{display:block;width:0px;height:0px;clear:both;}\n" +

						// Thread separator
						"body>form[name=\"postcontrols\"]>div[id^=\"thread_\"]+div[id^=\"thread_\"]{margin-top:<<thread.separator.height>>px;padding-top:<<thread.separator.size>>px;border-top:<<thread.separator.size>>px <<thread.separator.style>> <<thread.separator.color>>;}\n" +

						// Post
						"div.post:not($){margin:0px;padding:0px;margin:0px;padding:0px;max-width:none;color:<<post.colors.text>>;<<!font:post.font>>}\n" +
						"div.post.op:not($):after{clear:both;content:\"\";display:block;}\n" +
						"div.post.op:not($)+.post.reply:not($){margin-top:<<post.separation>>px;}\n" +
						"div.post.reply:not($){margin-top:<<post.separation>>px;background-color:<<post.colors.bg>>;border-width:<<post.border.top>>px <<post.border.right>>px <<post.border.bottom>>px <<post.border.left>>px;border-style:<<post.border.style>>;border-color:<<post.colors.border>>;<<css.border-radius>>:<<post.border.radius.topleft>>px <<post.border.radius.topright>>px <<post.border.radius.bottomright>>px <<post.border.radius.bottomleft>>px;}\n" +
						"div.post.reply.highlighted:not($){background-color:<<post.colors.bg_hl>>;border-color:<<post.colors.border_hl>>;}\n" +

						// File info
						"body>form[name=\"postcontrols\"] .fileinfo," +
						"$.content .fileinfo," +
						".post.reply:not($)>.fileinfo{padding:0px 0px <<post.file_info.padding.bottom>>px 0px;margin:0px;padding:0px 0px <<post.file_info.padding.bottom>>px 0px;visibility:hidden;<<!font:post.file_info.font>>}\n" +
						".post.reply:not($)>.fileinfo{padding:<<post.file_info.padding.top>>px <<post.file_info.padding.right>>px <<post.file_info.padding.bottom>>px <<post.file_info.padding.left>>px;margin-bottom:-<<post.comment.padding.top>>px;}\n" +
						"$.content .fileinfo>*," +
						"body>form[name=\"postcontrols\"] .fileinfo>*," +
						".post.reply:not($)>.fileinfo>*{visibility:visible;margin:0px;padding:0px;<<!font:post.file_info.file_extras.font>>}\n" +
						"$.content .fileinfo>.unimportant," +
						"body>form[name=\"postcontrols\"] .fileinfo>.unimportant," +
						".post.reply:not($)>.fileinfo>.unimportant{<<!font:post.file_info.attributes.font>>}\n" +
						"$.content .fileinfo>a:nth-of-type(1)," +
						"body>form[name=\"postcontrols\"] .fileinfo>a:nth-of-type(1)," +
						".post.reply:not($)>.fileinfo>a:nth-of-type(1){text-decoration:none;<<!font:post.file_info.file_name.font>>}\n" +

						// Header
						"div.post:not($)>.intro>*{vertical-align:middle;}\n" +
						"div.post:not($)>.intro>input{display:none;}\n" +
						"div.post.op:not($)>.intro{margin:0px;padding:0px <<post.header.padding.right>>px 0px 0px;display:inline-block;}\n" +
						"div.post.reply:not($)>.intro{margin:0px;padding:<<post.header.padding.top>>px <<post.header.padding.right>>px <<post.header.padding.bottom>>px <<post.header.padding.left>>px;background-color:<<post.header.colors.bg>>;border-width:<<post.header.border.top>>px <<post.header.border.right>>px <<post.header.border.bottom>>px <<post.header.border.left>>px;border-style:<<post.header.border.style>>;border-color:<<post.header.colors.border>>;<<css.border-radius>>:<<post.border.radius.topleft>>px <<post.border.radius.topright>>px 0px 0px;}\n" +
						"div.post.op:not($)>.intro>a:nth-of-type(3){margin-left:<<post.header.spacing>>px;text-decoration:none;color:<<post.header.options.colors.link>>;<<!font:post.header.options.font>>}\n" +
						"div.post.op:not($)>.intro>a:nth-of-type(3):hover{color:<<post.header.options.colors.link_hover>>;}\n" +
						"div.post.op:not($)>.intro>.icon{margin:0px 0px 0px <<post.header.spacing>>px;}\n" +

						// Comment
						"div.post:not($)>div.body{color:<<post.comment.colors.text>>;display:block;margin:0px;<<!font:post.comment.font>>}\n" +
						"div.post.op:not($)>div.body{padding:<<post.comment.padding.top>>px <<post.comment.padding.right>>px <<post.comment.padding.bottom>>px 0px;}\n" +
						"div.post.reply:not($)>div.body{padding:<<post.comment.padding.top>>px <<post.comment.padding.right>>px <<post.comment.padding.bottom>>px <<post.comment.padding.left>>px;}\n" +

						// Image
						"body>form[name=\"postcontrols\"] img:not(.icon):not($)," +
						"$.content img:not(.icon):not($){display:inline-block;float:left;padding:0px;background-color:<<post.image.op.bg>>;margin:0px <<post.comment.padding.left>>px 0px 0px;box-shadow:<<!shadow:post.image.op.thumbnail.shadow>>;}\n" +
						".post.reply img:not(.icon):not($){margin:<<post.comment.padding.top>>px <<post.comment.padding.left>>px <<post.comment.padding.bottom>>px <<post.image.padding.left>>px;background-color:<<post.image.reply.bg>>;box-shadow:<<!shadow:post.image.reply.thumbnail.shadow>>;}\n" +

						// Omitted replies / too long
						".post.op:not($)>.omitted," +
						".post:not($)>.body>.toolong{display:block;clear:both;text-decoration:none;color:<<post.notifications.colors.link>>;<<!font:post.notifications.font>>}\n" +
						".post.op:not($)>.omitted *," +
						".post:not($)>.body>.toolong *{text-decoration:none;color:<<post.notifications.colors.link>>;}\n" +
						".post.op:not($)>.omitted:before," +
						".post:not($)>.body>.toolong:before{content:\"<<!escape_string:post.notifications.separator.start>>\";color:<<post.notifications.colors.text>>;padding-right:<<post.notifications.spacing.inner>>px;}\n" +
						".post.op:not($)>.omitted:after," +
						".post:not($)>.body>.toolong:after{content:\"<<!escape_string:post.notifications.separator.end>>\";color:<<post.notifications.colors.text>>;padding-left:<<post.notifications.spacing.inner>>px;}\n" +


						//}

						//{ Special
						"*::selection{color:<<custom.selection>>;background:<<custom.selection_bg>>;}\n" +
						"*::-moz-selection{color:<<custom.selection>>;background:<<custom.selection_bg>>;}\n" +
						//}

						""
						/*!stylesheet-end!*/
						/*!stylesheet-pre-parse!*/)
					))
				); //}

				// Stylize
				this.stylize(html);
			};

			var this_private = {

				parse_stylesheet_pre: function (ss) {
					return ss.replace(/\$/g, "." + this.cls);
				},
				parse_stylesheet: function (ss) {
					var self = this, i, val, fmt, p;

					return ss.replace(/<<([\s\S]+?)>>/gm, function (match, v) {
						fmt = null;
						// Check for formatter
						if (v[0] == '!') {
							p = v.indexOf(":");
							fmt = v.substr(1, p - 1);
							v = v.substr(p + 1);
						}
						// Function call
						if (fmt == "function") {
							p = v.indexOf(":");
							var fcn = v.substr(0, p);
							v = v.substr(p + 1);

							val = self[fcn].call(self, v);
						}
						else {
							// Variable get
							v = v.split(".");
							val = self;
							for (i = 0; i < v.length; ++i) {
								/*!debug!*/assert(val !== undefined, match);
								val = val[v[i]];
							}
							/*!debug!*/assert(val !== undefined, match);
							// Process variable
							if (fmt !== null) {
								if (fmt == "font") {
									p = "";
									if ("face" in val) p += "font-family:" + val.face + ";";
									if ("size" in val) p += "font-size:" + val.size + ";";
									if ("style" in val) p += "font-style:" + val.style + ";";
									if ("weight" in val) p += "font-weight:" + val.weight + ";";
									if ("decoration" in val) p += "text-decoration:" + val.decoration + ";";
									if ("spacing" in val) p += "letter-spacing:" + val.spacing + ";";
									val = p;
								}
								else if (fmt == "gradient") {
									var perc = [], css;
									for (v in val) {
										if (/^[0-9]+$/.test(v)) perc.push(v);
									}
									if (perc.length == 1) {
										// Single
										val = "background:" + val[perc[0]] + ";";
									}
									else {
										perc.sort(function (x, y) { return x - y; });
										if (val.direction == "t2b") {
											css = [
												val[perc[0]],
												"-moz-linear-gradient(top",
												"-webkit-gradient(linear,left top,left bottom",
												"-webkit-linear-gradient(top",
												"-o-linear-gradient(top",
												"-ms-linear-gradient(top",
												"linear-gradient(to bottom",
											];
										}
										else { // if (val.direction == "l2r") {
											css = [
												val[perc[0]],
												"-moz-linear-gradient(left",
												"-webkit-gradient(linear,left top,right top",
												"-webkit-linear-gradient(left",
												"-o-linear-gradient(left",
												"-ms-linear-gradient(left",
												"linear-gradient(to right",
											];
										}
										for (i = 0; i < perc.length; ++i) {
											v = "," + val[perc[i]] + " " + perc[i] + "%";
											css[1] += v;
											css[2] += ",color-stop(" + perc[i] + "%," + val[perc[i]] + ")";
											css[3] += v;
											css[4] += v;
											css[5] += v;
											css[6] += v;
										}
										val = "background:" + css[0] + ";";
										for (i = 1; i < css.length; ++i) val += "background:" + css[i] + ");"
									}
								}
								else if (fmt == "escape_string") {
									val = self.escape_string(val);
								}
								else if (fmt == "shadow") {
									var n = "";
									if (val.offset) {
										n += (val.offset.left || 0) + "px " + (val.offset.top || 0) + "px ";
									}
									else {
										n = "0px 0px ";
									}
									n += (val.blur || 0) + "px ";
									if ("size" in val) n += (val.size || 0) + "px ";
									n += val.color;
									if (val.inset) n += " inset";

									var f = 1;
									if ("factor" in val) f = val.factor;
									if (f <= 0) {
										val = "none";
									}
									else {
										val = n;
										for (i = 1; i < f; ++i) {
											val += ",";
											val += n;
										}
									}
								}
							}
						}
						return val;
					});
				}

			};

			Style.prototype = {

				constructor: Style,

				e: function (tag) {
					var e = document.createElement(tag);
					if (arguments.length <= 1) {
						e.className = this.cls;
					}
					else {
						tag = this.cls;
						for (var i = 1; i < arguments.length; ++i) {
							tag += " ";
							tag += arguments[i];
						}
						e.className = tag;
					}
					return $(e);
				},
				t: function (text) {
					return $(document.createTextNode(text));
				},

				add_class: function (obj) {
					obj.addClass(this.cls);
					return obj;
				},
				set_class: function (obj) {
					if (obj.length == 1) {
						if (arguments.length <= 1) {
							obj[0].className = this.cls;
						}
						else {
							var new_class = this.cls;
							for (var i = 1; i < arguments.length; ++i) {
								new_class += " ";
								new_class += arguments[i];
							}
							obj[0].className = new_class;
						}
					}
					else {
						var new_class = this.cls;
						if (arguments.length > 1) {
							for (var i = 1; i < arguments.length; ++i) {
								new_class += " ";
								new_class += arguments[i];
							}
						}
						for (var i = 0; i < obj.length; ++i) {
							obj[i].className = new_class;
						}
					}

					return obj;
				},

				stylize: function (html) {
					// Add style
					var body = html.find("body");
					body.addClass(this.cls);

					// Add gradient
					body.prepend(this.e("div").addClass("top_gradient"));
				},

				format_backlink_style: function (obj, reference) {
					var indicator = this.post.backlink_indicator;

					// Classing
					var to = {
						you: (content.posted_by_me(reference.origin.thread.board, reference.origin.thread.id, reference.origin.id)),
						self: (reference.origin.thread.board == reference.target_board && reference.origin.thread.id == reference.target_thread_id && reference.origin.id == reference.target_post_id),
						op: reference.origin.op,
						cross_thread: (reference.target_thread_id !== null && reference.origin.thread.id != reference.target_thread_id) || (reference.target_board != reference.origin.thread.board),
						dead: reference.origin.deleted,
						cross_board: reference.origin.thread.board != reference.target_board,
						past: false
					};
					to.past = !to.cross_thread && (reference.origin.id < reference.target_post_id);

					// Text
					var base = (to.cross_board ? indicator.cross_board : indicator.same_board);
					obj.text(
						xch.format_string(base, function (fmt, reference) {
							if (fmt == "post_id") fmt = reference.origin.id;
							else if (fmt == "board") fmt = reference.origin.thread.board;
							else if (fmt == "thread_id") fmt = reference.origin.thread.id;

							return fmt;
						}, reference)
					);

					// To-target
					var to_target = "";
					var suffix_list = (to.cross_board ? indicator.suffix_list.cross_board : indicator.suffix_list.same_board);
					for (var i = 0; i < suffix_list.length; ++i) {
						if (to[suffix_list[i][0]]) {
							if (to_target.length > 0) to_target += indicator.suffix_separator;
							to_target += suffix_list[i][1];
						}
					}
					if (to_target.length == 0) obj.removeAttr("to_target");
					else obj.attr("to_target", to_target);
				},
				format_reference_style: function (obj, reference) {
					var indicator = this.post.reference_indicator;

					// Classes
					var to = {
						you: (reference.target_thread_id !== null && content.posted_by_me(reference.target_board, reference.target_thread_id, reference.target_post_id)),
						self: (reference.origin.thread.board == reference.target_board && reference.origin.thread.id == reference.target_thread_id && reference.origin.id == reference.target_post_id),
						op: (reference.target != null && reference.target.op),
						cross_thread: (reference.target_thread_id !== null && reference.origin.thread.id != reference.target_thread_id) || (reference.target_board != reference.origin.thread.board),
						dead: (reference.target != null && reference.target.deleted) || reference.target_dead,
						cross_board: reference.origin.thread.board != reference.target_board,
						future: false
					};
					to.future = !to.cross_board && (reference.origin.id < reference.target_post_id);

					// Text
					var base = (to.cross_board ? indicator.cross_board : indicator.same_board);
					obj.text(
						xch.format_string(base, function (fmt, reference) {
							if (fmt == "post_id") fmt = reference.target_post_id;
							else if (fmt == "board") fmt = reference.target_board;
							else if (fmt == "thread_id") fmt = reference.target_thread_id || "";

							return fmt;
						}, reference)
					);

					// To-target
					var to_target = "";
					var suffix_list = (to.cross_board ? indicator.suffix_list.cross_board : indicator.suffix_list.same_board);
					for (var i = 0; i < suffix_list.length; ++i) {
						if (to[suffix_list[i][0]]) {
							if (to_target.length > 0) to_target += indicator.suffix_separator;
							to_target += suffix_list[i][1];
						}
					}
					if (to_target.length == 0) obj.removeAttr("to_target");
					else obj.attr("to_target", to_target);
				},

				checkbox: function (checked, size) {
					var s;
					if (!(size in this.checkbox_settings.sizes)) {
						size = "normal";
					}
					s = this.checkbox_settings.sizes[size];

					var sz = s.box_size - s.border_width * 2;

					return $(
						'<label class="' + this.cls + ' ' + size + ' checkbox">' +
						'<input class="' + this.cls + ' checkbox_input" type="checkbox"' + (checked ? ' checked="checked"' : '') + ' />' +
						'<svg class="' + this.cls + ' checkbox_svg" xmlns="http://www.w3.org/2000/svg" version="1.1">' +
						'<g transform="scale(' + sz + ',' + sz + ')">' +
						'<polygon points="0.75,0.0625 0.9375,0.1875 0.5,0.9375 0.3125,0.9375 0.0625,0.6875 0.1875,0.5 0.375,0.6875"></polygon>' +
						'</g>' +
						'</svg>' +
						'</label>'
					);
				},
				escape_string: function (str) {
					return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
				}

			};

			Style.CSS = (function () {

				var CSS = function () {
					this.j = {
						transform: "transform",
						transformOrigin: "transformOrigin",
						transformStyle: "transformStyle",
						transition: "transition",
						perspective: "perspective",
						perspectiveOrigin: "perspectiveOrigin",
						backfaceVisibility: "backfaceVisibility",
						borderRadius: "borderRadius",
						borderTopLeftRadius: "borderTopLeftRadius",
						borderTopRightRadius: "borderTopRightRadius",
						borderBottomRightRadius: "borderBottomRightRadius",
						borderBottomLeftRadius: "borderBottomLeftRadius",
						boxSizing: "boxSizing"
					};
					this.events = {
						transitionend: "transitionend"
					};

					var e = document.createElement("div");
					var prefixes = [ "" , "webkit" , "Moz" , "O" , "ms" ];
					var prefixes2 = [ "" , "-webkit-" , "-moz-" , "-o-" , "-ms-" ];

					for (var key in this.j) {
						var key2 = key;
						for (var i = 0; i < prefixes.length; ++i) {
							if (typeof(e.style[prefixes[i] + key2]) == typeof("")) {
								this.j[key] = prefixes[i] + key2;

								var k2 = key.replace(/([A-Z])/g, function (a, b, c) {
									return "-" + a.toLowerCase();
								});
								this[k2] = prefixes2[i] + k2;

								break;
							}
							if (i == 0) key2 = key.substr(0, 1).toUpperCase() + key.substr(1);
						}
					}

					if (this.j.transition != "transition") {
						this.events.transitionend = this.j.transition + "End";
					}
				};

				return CSS;

			})();

			return Style;

		})()

	};

	// Done
	return xch;

})();



// Run
xch.script.startup();
