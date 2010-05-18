/*
 * JetPlurk Alpha
 * 
 * http://go.sto.tw/jetplurk
 * Author: Irvin (irvinfly@gmail.com)
 * CC: by-sa 2.5 TW, http://creativecommons.org/licenses/by-sa/2.5/tw/
 * With the help from littlebtc, BobChao, Timdream & MozTW community.
 * Some codes adapted from JetWave http://go.bobchao.net/jetwave
 * 
 */



/*
 * jQuery Templating Plugin
 *   NOTE: Created for demonstration purposes.
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(jQuery){
	// Override the DOM manipulation function
	var oldManip = jQuery.fn.domManip;
	
	jQuery.fn.extend({
		render: function( data ) {
			return this.map(function(i, tmpl){
				return jQuery.render( tmpl, data );
			});
		},
		
		// This will allow us to do: .append( "template", dataObject )
		domManip: function( args ) {
			// This appears to be a bug in the appendTo, etc. implementation
			// it should be doing .call() instead of .apply(). See #6227
			if ( args.length > 1 && args[0].nodeType ) {
				arguments[0] = [ jQuery.makeArray(args) ];
			}

			if ( args.length === 2 && typeof args[0] === "string" && typeof args[1] !== "string" ) {
				arguments[0] = [ jQuery.render( args[0], args[1] ) ];
			}
			
			return oldManip.apply( this, arguments );
		}
	});
	
	jQuery.extend({
		render: function( tmpl, data ) {
			var fn;
			
			// Use a pre-defined template, if available
			if ( jQuery.templates[ tmpl ] ) {
				fn = jQuery.templates[ tmpl ];
				
			// We're pulling from a script node
			} else if ( tmpl.nodeType ) {
				var node = tmpl, elemData = jQuery.data( node );
				fn = elemData.tmpl || jQuery.tmpl( node.innerHTML );
			}

			fn = fn || jQuery.tmpl( tmpl );
			
			// We assume that if the template string is being passed directly
			// in the user doesn't want it cached. They can stick it in
			// jQuery.templates to cache it.

			if ( jQuery.isArray( data ) ) {
				return jQuery.map( data, function( data, i ) {
					return fn.call( data, jQuery, data, i );
				});

			} else {
				return fn.call( data, jQuery, data, 0 );
			}
		},
		
		// You can stick pre-built template functions here
		templates: {},

		/*
		 * For example, someone could do:
		 *   jQuery.templates.foo = jQuery.tmpl("some long templating string");
		 *   $("#test").append("foo", data);
		 */

		tmplcmd: {
			each: {
				_default: [ null, "$i" ],
				prefix: "jQuery.each($1,function($2){with(this){",
				suffix: "}});"
			},
			if: {
				prefix: "if($1){",
				suffix: "}"
			},
			else: {
				prefix: "}else{"
			},
			html: {
				prefix: "_.push(typeof $1==='function'?$1.call(this):$1);"
			},
			"=": {
				_default: [ "this" ],
				prefix: "_.push($.encode(typeof $1==='function'?$1.call(this):$1));"
			}
		},

		encode: function( text ) {
			return text != null ? document.createTextNode( text.toString() ).nodeValue : "";
		},

		tmpl: function(str, data, i) {
			// Generate a reusable function that will serve as a template
			// generator (and which will be cached).
			var fn = new Function("jQuery","$data","$i",
				"var $=jQuery,_=[];_.data=$data;_.index=$i;" +

				// Introduce the data as local variables using with(){}
				"with($data){_.push('" +

				// Convert the template into pure JavaScript
				str
					.replace(/[\r\t\n]/g, " ")
					.replace(/\${([^}]*)}/g, "{{= $1}}")
					.replace(/{{(\/?)(\w+|.)(?:\((.*?)\))?(?: (.*?))?}}/g, function(all, slash, type, fnargs, args) {
						var tmpl = jQuery.tmplcmd[ type ];

						if ( !tmpl ) {
							throw "Template not found: " + type;
						}

						var def = tmpl._default;

						return "');" + tmpl[slash ? "suffix" : "prefix"]
							.split("$1").join(args || def[0])
							.split("$2").join(fnargs || def[1]) + "_.push('";
					})
				+ "');}return $(_.join('')).get();");

			// Provide some basic currying to the user
			return data ? fn.call( this, jQuery, data, i ) : fn;
		}
	});
})(jQuery);




// Save username & password
var manifest = {
	settings: [{
		name: "jetplurk",
		type: "group",
		label: "Plurk Account",
		settings: [{
			name: "username",
			type: "text",
			label: "Username"
		}, {
			name: "password",
			type: "password",
			label: "password"
		}]
	}, 
	{
		name: "fontsize",
		type: "range", 
		label: "Font size",
		min: 8, max: 20, default: 12
	}]
};

jetpack.future.import("storage.settings");
set = jetpack.storage.settings;

var loginStr = {
	username: set.jetplurk.username,
	password: set.jetplurk.password,
	api_key: '8Sq7fQo7HA9MfGDiowDkMcRUYcsMk86t'
};

jetpack.future.import("storage.simple");
var myStorage = jetpack.storage.simple;
var sliderObj = null; // Save slide object
var NewOffset = Date.parse(new Date()); // To remember latest refresh time
if (myStorage.ReadOffset == null) {
	myStorage.ReadOffset = Date.parse("January 1, 1975 00:00:00");
}
var JetPlurkVer = '024';
var ReadOffset = myStorage.ReadOffset; // Latest read plurk post time
var OldOffset = Date.parse(new Date()); // Oldest loaded plurk timestamp
console.log('JetPlurk ' + JetPlurkVer + ' Start: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);

var basehtml = 
<>
<html>
<head>
	<style><![CDATA[
		body {margin: 0; background-image: -moz-linear-gradient(top, Ivory, silver); font-size: 12px; line-height: 1.4em;}
		#container { margin: 5px;}
		#banner {display:block; margin-bottom: 5px;}
		#banner img.jetplurk {border: 0px; float: left;}
		#banner #jetplurkmeta {position: absolute; font-size:0.8em; right:5px; top: 5px;}
		#banner #usermeta {height: 45px; margin-left: 3px; padding-top:4px;}
		#usermeta img.useravatar {float: left; margin: 0 6px;}
		#usermeta span {display:block; margin-top: 3px; margin-left: 3px;}
		#usermeta span.displayname {font-size: 2em; margin-top: 10px;}
		form#sendform {padding: 0; margin: 5px 0;}
		form#sendform input#text_area {width: 79%; height: 25px; margin: 0; padding: 3px; font-size: 1.3em; border: 1px solid lightgray; vertical-align:middle;}
		form#sendform input#send_button {width: 20%; height: 25px; color: white; text-align: center; vertical-align: middle; font-size: 1.2em; float:right; background: #B65217; border: 1px solid; border-color: #9E5227 #853F18 #853F18 #9E5227; -moz-border-radius: 5px; cursor: pointer;}
		msgs {display: block; clear:both;}
		msg {display: block; margin-bottom: 4px; padding: 4px; background-color: Snow; -moz-border-radius: 5px; min-height: 2.5em; overflow: hidden;}
		msg:hover {background-color: White;}
		msg.unread content {font-weight: bold;}
		msg.unreadresponse content {color: DarkGreen;}
		msg span.meta {display:block; color: DarkGray; text-align: right; font-size: 0.9em;}
		msg responseNum {color: Chocolate; font-size: 2em; margin-left: 3px;}
		responses {display: block; line-height: 1.2em; overflow: hidden; margin:2px; border: solid lightgray thin; -moz-border-radius: 5px; padding: 5px;}
		response {display: block;}
		form#responseform {margin: 0 0 3px 0;}
		form#responseform textarea {width: 100%; height: 1.8em; margin: 5px auto; padding: 4px; font-size: 1.1em; border: 1px solid lightgray;}
		form#responseform input {width: 100%; color: white; text-align:center; margin: 0 auto; padding: 3px; background: #B65217; border: 1px solid; border-color: #9E5227 #853F18 #853F18 #9E5227; -moz-border-radius: 5px; cursor: pointer;}
		div#loadmore a {display: block; color: white; font-weight: bold; font-size: 1.8em; text-decoration:none; text-align:center; vertical-align:middle; margin: 3px 0px 5px 0px; padding: 5px; background: #B65217; border: 1px solid; border-color: #9E5227 #853F18 #853F18 #9E5227; -moz-border-radius: 5px; cursor: pointer;}
	]]></style>
	<base target="_blank" />
</head>
<body>
	<div id='container'>
		<div id='banner'>
			<a href='http://www.plurk.com'>
			<img class='jetplurk' src='data:image/png;base64,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' width='50' height='50' />
			</a>
			<div id='jetplurkmeta'>JetPlurkVer</div>
			<div id='usermeta'></div>
		</div>
		<div id='sendPlurk'>
			<form id='sendform'>
				<input id='text_area' type='text' name='content' /><input id='send_button' type='button' value='Plurk' />
			</form>
		</div>
		<msgs>
		<msg>
		</msg>
		</msgs>
		<div id='loadmore'>
			<a href='#'>Load more</a>
		</div>
	</div>
</body>
</html>
</>

jetpack.future.import('slideBar');
jetpack.slideBar.append({
	icon: "http://www.plurk.com/favicon.ico",
	width: 300,
	persist: true,
	html: basehtml,
	
	onReady: function(slider) {
		// When sidebar ready, preform reFreshPlurk()
		sliderObj = slider;

		// Show version of JetPlurk
		var content = "<div id='jetplurkmeta'>" + JetPlurkVer + "</div>";
		$(sliderObj.contentDocument).find('div#jetplurkmeta').replaceWith(content);
		
		reFreshPlurk();
		
		// Add click event listener on loadmore button
		$(sliderObj.contentDocument).find('#loadmore').click(function(event) {
			loadMorePlurk();
			event.preventDefault();
			event.stopPropagation(); // Stop event bubble
		})

		// Add click event listener on "Plurk" button for send plurk
		$(sliderObj.contentDocument).find("input#send_button").click(function(event) {
			sendPlurk();
			event.preventDefault();
			event.stopPropagation(); // Stop event bubble
		})
	},
	onClick: function(slider) {
		// preform reFreshPlurk() when click at plurk icon on slide
		reFreshPlurk();
	}
	
});

function reFreshPlurk() {
	// When reFreshPlurk, preform login and get newest plurk
	console.log("reFreshPlurk");
	
	$.ajax({
		url: "http://www.plurk.com/API/Users/login",
		data: loginStr,
		
		// When login success, throw the newest plurk come with login
		success: function(json) {
			var jsObject = JSON.parse(json);
			// console.log(json)
			
			// Wipe out old msg
			$(sliderObj.contentDocument).find("msgs").fadeOut('medium', function() {
				$(sliderObj.contentDocument).find("msgs").remove();
				var content = "<msgs></msgs>";
				$(sliderObj.contentDocument).find('div#sendPlurk').after(content);
				ShowNewPlurk(jsObject);
			});
			NewOffset = Date.parse(new Date()); // Remember refresh time
			console.log('JetPlurk refresh: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
			
			// Show user meta
			var avatarurl = '';
			user_displayname = jsObject.user_info.display_name;
			if ((jsObject.user_info.has_profile_image == 1) && (jsObject.user_info.avatar == null)) {
				avatarurl = 'http://avatars.plurk.com/' + jsObject.user_info.uid + '-medium.gif';
			}
			else if ((jsObject.user_info.has_profile_image == 1) &&
			(jsObject.user_info.avatar != null)) {
				avatarurl = 'http://avatars.plurk.com/' + jsObject.user_info.uid + '-medium' + jsObject.user_info.avatar + '.gif';
			}
			else if (jsObject.user_info.has_profile_image == 0) {
				avatarurl = 'http://www.plurk.com/static/default_medium.gif';
			}
			
			var content = "<div id='usermeta'><img class='useravatar' src='" + avatarurl + "' /><span class='displayname'>" + user_displayname + "</span> <span class='karma'>Karma:" + jsObject.user_info.karma + "</span></div>";
			$(sliderObj.contentDocument).find("#usermeta").replaceWith(content);
			console.log("showusermeta");
		},
		error: function(xhr, textStatus, errorThrown) {
			// Login error
			console.log('Login error: ' + xhr.status + ' ' + xhr.responseText);				
		}	
	});
};

function sendPlurk() {
	var sendFormObj = $(sliderObj.contentDocument).find('form#sendform');

	// when click sendplurk form submit button, check textarea, and submit plurk	
	var response_txt = $(sendFormObj).find("#text_area").val();
	if (response_txt != "") {
		$.ajax({
			url: "http://www.plurk.com/API/Timeline/plurkAdd",
			data: ({
				'api_key': loginStr.api_key,
				'content': response_txt,
				'qualifier': ':'
			}),
			success: function(json) {
				// Display new response
				reFreshPlurk();					
				$(sendFormObj).find("#text_area").attr('value', null);
			},
			error: function(xhr, textStatus, errorThrown) {
				console.log('Plurk error: ' + xhr.status + ' ' + xhr.responseText);	
			}
		})
	}
}

function ISODateString(d) {
	// ISO 8601 formatted dates example
	// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Date
	function pad(n) {
		return n < 10 ? '0' + n : n
	}
	return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
}

function postTime(d) {
	// Return str post time until now ()
	var timediff = ((Date.parse(new Date()) - Date.parse(d)) / 1000 / 60); // 1min
	if (timediff < 1) {
		return 'just posted';
	}
	else if (timediff < 60) {
		return (parseInt(timediff) + ' mins ago');
	}
	else if (timediff < 120) {
		return '1 hour ago';
	}
	else if (timediff < 1440) {
		return (parseInt(timediff / 60) + ' hours ago');
	}
	else if (timediff < 2880) {
		return '1 day ago';
	}
	else if (timediff < 10080) {
		return (parseInt(timediff / 1440) + ' days ago');
	}
	else if (timediff < 20160) {
		return '1 week ago';
	}
	else {
		return (parseInt(timediff / 10080) + ' weeks ago');
	}
	
}

function loadMorePlurk() {
	// When loadMorePlurk, get old plurks from OldOffset
	$.ajax({
		url: "http://www.plurk.com/API/Timeline/getPlurks",
		data: ({
			'api_key': loginStr.api_key,
			// offset in ISO 8601 format	
			'offset': ISODateString(new Date(OldOffset))
		}),
		success: function(json) {
			// Throw the loaded plurk to show plurk function
			var jsObject = JSON.parse(json);
			// correct plurk api bugs
			jsObject.plurks_users = jsObject.plurk_users;
			// console.log(json)
			ShowNewPlurk(jsObject);
			console.log('JetPlurk Load More: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
		},
		error: function(xhr, textStatus, errorThrown) {
			// Login error
			console.log('Load More error: ' + xhr.status + ' ' + xhr.responseText);			
		}
	});
};

function ShowNewPlurk(jsObject) {
	// Display each plurk
	
	$(jsObject.plurks).each(function(i) {

		var owner_id = jsObject.plurks[i].owner_id;
		var read = jsObject.plurks[i].is_unread;
		var response_count = jsObject.plurks[i].response_count;
		var responses_seen = jsObject.plurks[i].responses_seen;
		var postedtime = jsObject.plurks[i].posted;
		
		var msgObject = {
			plurk_id: jsObject.plurks[i].plurk_id,
			postedtime: postedtime,
			readstatus: function (){
				if ((read == 1) || ((ReadOffset < Date.parse(postedtime)) && (response_count == 0))) {
				// If message is unread
					return 'unread';
				}
				else if (responses_seen < response_count) {
				// If message response num. higher than seen-responses number
					return 'unreadresponse';
				}
				else {
				// Message is read
					return '';
				}
			},
			owner_display_name: function() {
				if (jsObject.plurks_users[owner_id].display_name != null) {
					return jsObject.plurks_users[owner_id].display_name;
				}
				else {
					return jsObject.plurks_users[owner_id].nick_name;
				}
			},
			qualifier: function() {
				if (jsObject.plurks[i].qualifier_translated != null) {
					// English qualifier
					return jsObject.plurks[i].qualifier_translated;
				}
				else {
					return jsObject.plurks[i].qualifier;
				}
			},
			content: jsObject.plurks[i].content,
			timestr: postTime(jsObject.plurks[i].posted),
			premalink: jsObject.plurks[i].plurk_id.toString(36),
			response_count: response_count
		};
		
		var msgTemplate = 
		<>
			<msg id='${plurk_id}' postime='${postedtime}' class='${readstatus}'>
				<content>${owner_display_name} [${qualifier}] $content</content>
				<span class='meta'>
					<timestr>${timestr}</timestr>
					<a class='permalink' href='http://www.plurk.com/m/p/${premalink}'>link</a>
					<responseNum>${response_count}</responseNum>
				</span>
			</msg>
		</>		

//		$(sliderObj.contentDocument).find("msgs").append(content);
		$(sliderObj.contentDocument).find("msgs").append(msgTemplate, msgObject);
		console.log("debug!");
		
/*
		if (jsObject.plurks_users[owner_id].display_name != null) {
			var owner_display_name = jsObject.plurks_users[owner_id].display_name;
		}
		else {
			var owner_display_name = jsObject.plurks_users[owner_id].nick_name
		}
		if (jsObject.plurks[i].qualifier_translated != null) {
			// English qualifier
			var qualifier = jsObject.plurks[i].qualifier_translated;
		}
		else {
			var qualifier = jsObject.plurks[i].qualifier;
		}
		var premalink = jsObject.plurks[i].plurk_id.toString(36);
		var read = jsObject.plurks[i].is_unread;
		var response_count = jsObject.plurks[i].response_count;
		var responses_seen = jsObject.plurks[i].responses_seen;
		var postedtime = jsObject.plurks[i].posted;
		var timestr = postTime(jsObject.plurks[i].posted);
		var content = "<msg id='" + jsObject.plurks[i].plurk_id + "' postime='" + postedtime + "'";
		
		if ((read == 1) || ((ReadOffset < Date.parse(postedtime)) && (response_count == 0))) {
			// If message is unread
			content += " class='unread'>";
		}
		else if (responses_seen < response_count) {
			// If message response num. higher than seen-responses number
			content += " class='unreadresponse'>";
		}
		else {
			// Message is read
			content += ">";
		}
		
		content += "<content>" + owner_display_name + " ";
		
		if (qualifier != '') {
			content += "[" + qualifier + "] ";
		}
		
		content += jsObject.plurks[i].content + "</content><span class='meta'><timestr>" + timestr + "</timestr> <a class='permalink' href='http://www.plurk.com/m/p/" + premalink + "'>link</a>";
		if (response_count > 0) { // If has response
			content += "<responseNum>" + response_count + "</responseNum>";
		}
		content += "</span></msg>";
		// console.log('read ' + read + ' response_count ' + response_count + ' responses_seen ' + responses_seen + ' ' + content);
		$(sliderObj.contentDocument).find("msgs").append(content);
*/		

		OldOffset = Date.parse(postedtime); // Remember oldest loaded plurk time
	});
	
	//Set font size of display content
	$(sliderObj.contentDocument).find('msg content').css("font-size",set.fontsize);	
	
	// Add hover event listener on each msg
	$(sliderObj.contentDocument).find("msg").hover(function() {
		MsgHover($(this));
	}, function() {
		// console.log("unHOVER!");
	});
	
	// Add click event listener on each msg
	// Click msg to show response form & responses
	$(sliderObj.contentDocument).find("msg").click(function() {
		MsgClick($(this));
	})	
}

function MsgHover(hoverMsg) {
	// Called from ShowNewPlurk(jsObject)
	var selectPlurkID = parseInt(hoverMsg.attr("id"));
	var selectPlurkRead = hoverMsg.attr("class");
	var selectPlurkTimestamp = hoverMsg.attr("postime");
	// console.log('Hover: ' + selectPlurkID + ' Read [' + selectPlurkRead + '] Plurk time: ' + selectPlurkTimestamp + Date.parse(selectPlurkTimestamp) + ' ReadOffset ' + ReadOffset);
	
	if ((selectPlurkRead == 'unread') || (selectPlurkRead == 'unreadresponse')) {
		// if unread or unreadresponse, set to read when hover
		var boTrue = new Boolean(true);
		$.ajax({
			url: "http://www.plurk.com/API/Timeline/markAsRead",
			data: ({
				'api_key': loginStr.api_key,
				'ids': JSON.stringify([selectPlurkID]),
				'note_position': JSON.stringify(boTrue)
			}),
			success: function(json) {
				// console.log('Set read: ' + json);
				$(hoverMsg).removeClass("unread").removeClass("unreadresponse");
				if (Date.parse(selectPlurkTimestamp) > ReadOffset) {
					ReadOffset = Date.parse(selectPlurkTimestamp);
					myStorage.ReadOffset = ReadOffset;
					// console.log('myStorage.ReadOffset update: ' + myStorage.ReadOffset);
				}
			},
			error: function(xhr, textStatus, errorThrown) {
				console.log('Set read error: ' + xhr.status + ' ' + xhr.responseText);
			}
		});
	}
}

function MsgClick(clickMsg){
	// Called from ShowNewPlurk(jsObject)
	var selectPlurkID = parseInt(clickMsg.attr("id"));
	var selectPlurkResponseNum = clickMsg.find("responseNum").text();
	// console.log('Click: ' + selectPlurkID + ' responseNum ' + selectPlurkResponseNum);
	
	// If click msg has not showing response form, showing now
	if ($(clickMsg).find("responses").html() == null) {
	
		$(clickMsg).append('<responses></responses>');
		// Show response form
		var content = "<form id='responseform' class='" + selectPlurkID + "'><textarea name='content' rows='1'></textarea>" + "<input id='response_button' type='submit' value='Reponse' /></form>";
		$(clickMsg).find("responses").append(content);
		
		if (selectPlurkResponseNum != "") {
			// If click msg has response, get response
			MsgShowResponse(clickMsg, selectPlurkID);
		}
		
		// Add click event to response form, stop click to hide responses event
		$(clickMsg).find("form#responseform").click(function(event) {
			event.preventDefault();
			event.stopPropagation(); // Stop event bubble
		});
		$(clickMsg).find(":submit").click(function(event) {
			// when click response form submit button, check textarea, and submit response
			var response_txt = $(clickMsg).find("textarea").val();
			if (response_txt != "") {
				SubmitResponse(clickMsg, selectPlurkID, response_txt)
			}
			event.preventDefault();
			event.stopPropagation(); // Stop event bubble
		});		
		
	}
	else {
		// If showing <responses> now, remove it
		$(clickMsg).find("responses").fadeOut('fast', function() {
			$(clickMsg).find("responses").remove();
		});
	}
}

function MsgShowResponse(clickMsg, selectPlurkID) {
	// Called from MsgClick(clickMsg)
	$.ajax({
		url: "http://www.plurk.com/API/Responses/get",
		data: ({
			'api_key': loginStr.api_key,
			'plurk_id': selectPlurkID,
			'from_response': 0
		}),
		success: function(json) {
			// console.log('Get response: ' + json);
			var jsObject = JSON.parse(json);
			
			// Display each response
			$(jsObject.responses).each(function(i) {
				var responser_id = jsObject.responses[i].user_id;
				if (jsObject.friends[responser_id].display_name != '') {
					var responser_display_name = jsObject.friends[responser_id].display_name;
				}
				else {
					var responser_display_name = jsObject.friends[responser_id].nick_name;
				}
				var postedtime = jsObject.responses[i].posted;
				var timestr = postTime(jsObject.responses[i].posted);
				if (jsObject.responses[i].qualifier_translated != null) {
					// English qualifier
					var qualifier = jsObject.responses[i].qualifier_translated;
				}
				else {
					var qualifier = jsObject.responses[i].qualifier;
				}
				var content = "<response>" + responser_display_name + " ";
				if (qualifier != '') {
					content += "[" + qualifier + "] ";
				}
				content += jsObject.responses[i].content + " <span class='meta'><timestr>" + timestr + "</timestr></span></response>";
				// console.log(content);
				$(clickMsg).find("form#responseform").before(content);
			});
			// console.log($(clickMsg).html());		
		},
		error: function(xhr, textStatus, errorThrown) {
			console.log('Get response error: ' + xhr.status + ' ' + xhr.responseText);
		}
	});
}

function SubmitResponse(clickMsg, selectPlurkID, response_txt) {
	// Called from MsgClick(clickMsg)
	$.ajax({
		url: "http://www.plurk.com/API/Responses/responseAdd",
		data: ({
			'api_key': loginStr.api_key,
			'plurk_id': selectPlurkID,
			'content': response_txt,
			'qualifier': ':'
		}),
		success: function(json) {
			// console.log('Responsed: ' + json);
			// Display new response
			
			var reObject = JSON.parse(json);
			var responser_id = reObject.user_id;
			responser_display_name = user_displayname;
			
			var postedtime = reObject.posted;
			var timestr = postTime(reObject.posted);
			if (reObject.qualifier_translated != null) {
				// English qualifier
				var qualifier = reObject.qualifier_translated;
			}
			else {
				var qualifier = reObject.qualifier;
			}
			var content = "<response>" + responser_display_name + " ";
			if (qualifier != '') {
				content += "[" + qualifier + "] ";
			}
			content += reObject.content + " <span class='meta'><timestr>" + timestr + "</timestr></span></response>";
			// console.log(content);
			$(clickMsg).find("form#responseform").before(content);
			$(clickMsg).find("form#responseform").get(0).reset();
		}
	})
}
