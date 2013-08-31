// Strict
"use strict";


// Document ready event
var document_ready = (function () {

	var callback = null;
	var callback_data = null;

	var trigger = function () {
		if (callback) {
			callback.call(window, callback_data);
			callback = null;
			callback_data = null;
		}
	};

	var ready = function () {
		document.removeEventListener("DOMContentLoaded", ready, false);
		window.removeEventListener("load", ready, false);
		trigger();
	};

	var check = function (cb, cb_data) {
		callback = cb;
		callback_data = cb;
		if (document.readyState === "complete") { // || document.readyState === "interactive") {
			setTimeout(trigger, 0);
		}
		else {
			document.addEventListener("DOMContentLoaded", ready, false);
			window.addEventListener("load", ready, false);
		}
	};

	return check;

})();


// CSS validation
var CSS = (function () {

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
var elem = function (tag) {
	var e = document.createElement(tag);
	if (arguments.length > 1) e.className = arguments[1];
	return $(e);
};


// Location management
var Location = (function () {

	var Location = function () {
		var self = this;

		// Vars
		this.hash = {
			full: "",
			path: "",
			tree: [],
			vars: {},
			sep: "#!"
		};
		this.path = "/";
		this.tree = [];
		this.search = "";
		this.search_vars = {};

		// Events
		this.events = {
			"change": []
		};

		// Event
		$(window)
		.on("popstate", function (event) {
			this_private.on_change.call(self, false, "browser");
		});
	};

	var this_private = {

		on_change: function (first, source) {
			// Path
			var path = window.location.pathname;
			if (path[0] != "/") path = "/" + path;
			var path_change = (path != this.path);
			if (path_change) {
				this.path = path;
				this.tree = (this.path.length == 0 ? [] : this.path.split("/"));
				this.tree.shift();
			}

			// Search
			var search = window.location.search;
			var i = 0;
			if (search.length > i && search[i] == "?") ++i;
			search = search.substr(i, search.length - i);
			var search_change = (search != this.search);
			if (search_change) {
				this.search = search;
				this.search_vars = this.parse_vars(this.search);
			}

			// Hash
			var hash_change = this_private.hash_update.call(this, window.location.hash);

			// Update content
			this_private.trigger.call(this, "change", {
				first: first,
				changed: (first || path_change || search_change || hash_change),
				path_changed: path_change,
				search_changed: search_change,
				hash_changed: hash_change,
				source: source
			});
		},

		hash_update: function (h) {
			// Get the hash
			var i = 0;
			if (h.length > i && h[i] == "#") ++i;
			if (h.length > i && h[i] == "!") ++i;
			h = h.substr(i, h.length - i);

			// No change
			if (this.hash.full == h) return false;

			// Parse
			this.hash.full = h;
			this.hash.path = h.split("?")[0];
			this.hash.tree = (this.hash.path.length == 0 ? [] : this.hash.path.split("/"));
			if (this.hash.path.length + 1 < h.length) {
				this.hash.vars = this.parse_vars.call(this.hash, h.substr(this.hash.path.length + 1, h.length - (this.hash.path.length + 1)));
			}
			else {
				this.hash.vars = {};
			}

			// Done
			return true;
		},

		trigger: function (event_name, data) {
			// Call
			var e = this.events[event_name];
			for (var i = 0; i < e.length; ++i) {
				e[i].callback.call(this, data);
			}
		}

	};

	Location.prototype = {

		constructor: Location,

		init: function () {
			this_private.on_change.call(this, true, "load");
		},

		on: function (event_name, callback) {
			// Add
			if (event_name in this.events) {
				this.events[event_name].push({
					page_state: location.page_state,
					callback: callback
				});
			}

			return this;
		},
		off: function (event_name, callback) {
			// Remove
			if (event_name in this.events) {
				var e = this.events[event_name];
				for (var i = 0; i < e.length; ++i) {
					if (e[i].callback == callback) {
						e.splice(i, 1);
						break;
					}
				}
			}

			return this;
		},

		join_vars: function (vars) {
			var var_str = "";
			for (var v in vars) {
				var_str += (var_str.length == 0 ? "" : "&") + v + "=" + vars[v];
			}
			return var_str;
		},
		parse_vars: function (var_str) {
			var vars = {};
			if (var_str.length == 0) return vars;

			var h = var_str.split(/&(?!amp;)/);

			for (var i = 0; i < h.length; ++i) {
				if (h[i].length == 0) continue;

				var p = h[i].split("=");
				vars[p[0]] = (p.length == 1 ? null : Location.prototype.unescape(p.splice(1, p.length - 1).join("=")));
			}

			return vars;
		},

		go_to: function (href, overwrite_current, no_state_change) {
			if (overwrite_current) {
				history.replaceState(null, "go_to", href);
			}
			else {
				history.pushState(null, "go_to", href);
			}

			// Trigger change
			if (!no_state_change) {
				this_private.on_change.call(this, false, "go_to");
			}
		},

		escape: function (str) {
			return str.replace(/&/g, "&amp;");
		},
		unescape: function (str) {
			return str.replace(/&amp;/g, "&");
		}

	};

	return Location;

})();
var location_remove_hash = function () {
	var url = document.location.pathname + document.location.search;

	loc.go_to(url);
};
var location_set_hash = function (hash) {
	var url = loc.hash.sep + hash;

	loc.go_to(url);
};


// Show content
var display_content = function (target, target_nav, instant) {
	var content_container_outer = $(".content_container_outer");

	if (target == null) {
		// Align to top
		$(".aligner").removeClass("align_top");

		// Navigation change
		$(".navigation_link.active").removeClass("active");

		// Fade out
		if (display_content_timer === null) {
			content_container_outer.removeClass("visible_content");
		}
		else {
			// Transition won't be triggered because it never started
			display_content_done.call(content_container_outer[0], null);
		}
	}
	else {
		// Bind events
		if (!content_container_outer.hasClass("displaying_content")) {
			content_container_outer[0].addEventListener(css.events.transitionend, display_content_done, false);
			content_container_outer.addClass("displaying_content");
		}

		// Navigation change
		$(".navigation_link.active").removeClass("active");
		$('.navigation_link[navigate="' + target_nav + '"]').addClass("active")

		// Change display
		$(".content:not(.hidden)").addClass("hidden");
		target.removeClass("hidden");

		// Animate
		if (display_content_timer === null) {
			var aligner = $(".aligner");
			if (!aligner.hasClass("align_top")) {
				aligner.addClass("align_top");
				var fcn = function () {
					display_content_timer = null;
					content_container_outer.addClass("visible_content");
				};
				if (instant) {
					fcn();
					// Make the aligner have no transition
					aligner.addClass("no_transition");
					setTimeout(function () {
						aligner.removeClass("no_transition");
					}, 100);
				}
				else {
					display_content_timer = setTimeout(fcn, 100);
				}
			}
		}
	}
};
var display_content_done = function (event) {
	if (event == null || (event.propertyName == "opacity" && parseFloat($(this).css("opacity")) <= 0)) {
		// Done
		$(this).removeClass("displaying_content");
		$(".content:not(.hidden)").addClass("hidden");

		// Remove event
		this.removeEventListener(css.events.transitionend, display_content_done, false);
	}
};
var display_content_timer = null;


// Navigation links
var on_nav_link_click = function (event) {
	if (event.which != 1) return true;

	var href = $(this).attr("href");
	if (href[0] != "#") return true;
	href = href.substr(href[1] == "!" ? 2 : 1);

	var target = $("#content_" + href);
	if (target.length > 0) {
		if (target.hasClass("hidden")) {
			location_set_hash(href);
		}
		else {
			location_remove_hash();
		}
		return false;
	}
};


// Acquire changelog
var acquire_changelog = (function () {

	var checked = false;

	return function () {
		if (checked) return;

		$.ajax({
			type: "GET",
			url: "https://api.github.com/repos/dnsev/xch/commits",
			dataType: "json",
			cache: "true",
			success: function (data, status, jq_xhr) {
				checked = true;

				var changelog = parse_changelog(data);
				display_changelog(changelog);
			},
			error: function (jq_xhr, status) {
				checked = true;

				$(".changelog")
				.addClass("error")
					.find(".changelog_status")
					.attr("error_message", "Status: " + jq_xhr.status + " / " + status);
			}
		});
	};

})();
var title_is_relevant = function (title) {
	return /[0-9\.]/.test(title);
};
var parse_changelog = function (gcl) {
	var changelog = [];

	for (var i = 0; i < gcl.length; ++i) {
		var title = gcl[i].commit.message.replace(/\s*\n\s*(0|[^0])*$/, "");

		if (title_is_relevant(title)) {
			var entry = {
				sha: gcl[i].sha,
				title: title,
				comment: gcl[i].commit.message.replace(/^[^\r\n]*\r?\n?\r?\n?/, ""),
				timestamp: 0,
			};

			var date = /^([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)Z$/.exec(gcl[i].commit.committer.date);
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
};
var display_changelog = function (changelog) {
	var timezone_offset = -(new Date()).getTimezoneOffset() * 60 * 1000;

	var container = $(".changelog");
	container.html("").addClass("loaded");

	for (var i = 0; i < changelog.length; ++i) {
		var item = elem("div", "changelog_item");
		var title = elem("div", "changelog_item_title");
		var content = elem("ul", "changelog_item_content");

		// Title
		title.html(
			elem("a", "changelog_item_title_link")
			.text(changelog[i].title)
			.attr("target", "_blank")
			.attr("href", "https://github.com/dnsev/xch/commit/" + changelog[i].sha)
		);

		// Changes list
		var changes = changelog[i].comment.split("\n");
		// Fix back into a single line if necessary
		for (var j = 0; j < changes.length; ++j) {
			if (/^[a-z]/.test(changes[j]) && j > 0) {
				changes[j - 1] = changes[j - 1].trim() + " " + changes[j].trim();
				changes.splice(j, 1);
				--j;
			}
		}
		// Add change
		for (var j = 0; j < changes.length; ++j) {
			content.append(
				elem("li", "changelog_item_change")
				.text(changes[j].trim())
			);
		}

		// Add
		container.append(item.append(title).append(content));
	}
};


// Objects
var css = null;
var loc = null;


// Start
document_ready(function () {
	// CSS object
	css = new CSS();
	loc = new Location();

	// Setup
	if (navigator.userAgent.toString().indexOf(" Chrome/") >= 0) {
		$(".title").attr("download", "");
	}

	// Events
	$(".navigation_link").on("click", on_nav_link_click);

	// Location events
	loc.on("change", function (event) {
		if (event.hash_changed) {
			var content_target = this.hash.tree.join("_"), target;
			if (content_target.length > 0 && (target = $("#content_" + content_target)).length > 0 && target.hasClass("hidden")) {
				display_content(target, content_target, event.source == "load");

				if (content_target == "changes") {
					acquire_changelog();
				}
			}
			else {
				display_content(null, null, false);
			}
		}
	});

	// Start
	loc.init();
});

