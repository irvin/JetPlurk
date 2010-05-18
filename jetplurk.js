/*
 * JetPlurk α
 * 
 * http://go.sto.tw/jetplurk
 * Author: Irvin (irvinfly@gmail.com)
 * CC: by-sa 2.5 TW, http://creativecommons.org/licenses/by-sa/2.5/tw/
 * With the help from littlebtc, BobChao, Timdream & MozTW community.
 * Some codes adapted from JetWave http://go.bobchao.net/jetwave
 * 
 */

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
var JetPlurkVer = '025';
var ReadOffset = myStorage.ReadOffset; // Latest read plurk post time
var OldOffset = Date.parse(new Date()); // Oldest loaded plurk timestamp
console.log('JetPlurk ' + JetPlurkVer + ' Start: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);


var basehtml = 
<>
<html>
<head>
<style><![CDATA[
	body {margin: 0; background: -moz-linear-gradient(top, #EBF4F7, #B3B3B3); font-size: 12px; line-height: 1.4em;}
	.avatar {height: 45px; width: 45px; background: yellow; -moz-border-radius: 5px; border: 1px solid; border-color: #EEE #CCC #CCC #EEE;}
	.txtarea {height: 25px; -moz-border-radius: 10px; border: 1px solid #88280A; font-size: 1.3em; padding: 3px; overflow: hidden;}
	.button {height: 25px; font-family: Sans-serif; color: white; font-size: 1.2em; text-align: center; text-decoration: none; background: -moz-linear-gradient(top, #E6713B, #C6431A); border: 1px solid #88280A; -moz-border-radius: 10px; cursor: pointer;}
	#container { margin: 5px;}
	#banner {display:block; margin-bottom: 5px;}
	#banner #jetplurkmeta {position: absolute; font-size:0.8em; right:5px; top: 5px;}
	#banner #usermeta {height: 45px; padding: 3px 0;}
	#usermeta .avatar {float: left; margin: 0 6px 0 0;}
	#usermeta span {display:block; margin-top: 3px; margin-left: 3px;}
	#usermeta span.displayname {font-size: 2em; margin-top: 10px;}
	#sendform {padding: 0; margin: 5px 0;}
	#sendform textarea {width: 79%; margin: 0; vertical-align:middle;}
	#sendform input.button {width: 20%; float:right;}
	msgs {display: block; clear:both;}
	msg {display: block; margin-bottom: 4px; padding: 5px; background: -moz-linear-gradient(top, #FFFFFF, #F8F8F8); -moz-border-radius: 5px; min-height: 2.5em; overflow: hidden; 	border-right: 1px solid #B3B3B3; border-bottom: 1px solid #B3B3B3;}
	msg:hover {background: #FFFFFF;}
	msg.unread content {font-weight: bold;}
	msg.unreadresponse content {color: DarkGreen;}
	msg span.meta {display:block; color: DarkGray; text-align: right; font-size: 0.9em;}
	msg responseNum {color: Chocolate; font-size: 2em; margin-left: 3px;}
	responses {display: block; line-height: 1.2em; overflow: hidden; margin:2px; border: solid lightgray thin; -moz-border-radius: 5px; padding: 5px;}
	response {display: block;}
	#responseform {margin: 0 0 3px 0;}
	#responseform textarea {width: 100%; margin: 5px auto;}
	#responseform input.button {width: 100%;}
	#loadmore a {display: block; text-decoration:none; margin: 5px 0px; font-size: 1.4em; line-height: 1.4em;}
]]></style>
	<base target="_blank" />
</head>
<body>
	<div id='container'>
		<div id='banner'>
			<div id='jetplurkmeta'>JetPlurkVer</div>
			<div id='usermeta'> </div>
			<div id='sendPlurk'>
				<form id='sendform'>
					<textarea name='content' class='txtarea' rows='1'> </textarea>
					<input id='send_button' class='button' type='button' value='Plurk' />
				</form>
			</div>
		</div>
		<msgs>
			<msg>
			</msg>
		</msgs>
		<div id='loadmore'>
			<a href='#' class='button'>Load more</a>
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
		$(sliderObj.contentDocument).find("input.button").click(function(event) {
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
				$(sliderObj.contentDocument).find('#loadmore').before(content);
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
			
			var content = "<div id='usermeta'><a href='http://www.plurk.com'><img class='avatar' src='" + avatarurl + "' /></a><span class='displayname'>" + user_displayname + "</span> <span class='karma'>Karma:" + jsObject.user_info.karma + "</span></div>";
			$(sliderObj.contentDocument).find("#usermeta").replaceWith(content);
			
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
	var response_txt = $(sendFormObj).find("textarea").val();
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
				$(sendFormObj).find("textarea").attr('value', null);
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
		var content = "<form id='responseform' class='" + selectPlurkID + "'><textarea name='content' class='txtarea' rows='1'></textarea>" + "<input id='response_button' class='button' type='submit' value='Reponse' /></form>";
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
