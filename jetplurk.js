/* JetPlurk 0.010
 * cc:by-sa 
 * Author: Irvin (irvinfly@gmail.com)
 * With the help from littlebtc, BobChao, Timdream & MozTW community.
 * Some codes adapted from JetWave http://go.bobchao.net/jetwave
 */

// Save username & password
var manifest = {
	settings: [
	{
		name: "jetplurk",
		type: "group",
		label: "Plurk Account",
		settings: [
			{ name: "username", type: "text", label: "Username" },
			{ name: "password", type: "password", label: "password" }
		]
	},
	]
};

jetpack.future.import("storage.settings");
set = jetpack.storage.settings;

var loginStr = {};  
loginStr.username = set.jetplurk.username;  
loginStr.password = set.jetplurk.password;  
loginStr.api_key = "LGMTGe6MKqjPnplwd4xHkUFTXjKOy6lJ";

jetpack.future.import("storage.simple");
var myStorage = jetpack.storage.simple;

var sliderObj = null;			// Save slide object
var NewOffset = Date.parse(new Date());	// To remember latest refresh time
//var ReadOffset = Date.parse("January 1, 1975 00:00:00");
if (myStorage.ReadOffset == null){	
	myStorage.ReadOffset = Date.parse("January 1, 1975 00:00:00");;
	console.log('Init. myStorage.ReadOffset: ' + myStorage.ReadOffset);
}
var ReadOffset = myStorage.ReadOffset;	// Latest read plurk post time
var OldOffset = Date.parse(new Date());	// Oldest loaded plurk timestamp
console.log('Begin: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);


jetpack.future.import('slideBar') 
jetpack.slideBar.append( {
    icon: "http://www.plurk.com/favicon.ico",
    width: 250,
    html: "<style>body {margin: 0; background-color: white; border-bottom:solid lightgray 1px; font-size: 12px;} #banner {display:block;} #banner img {border:0px; } msgs {display: block; max-width: 245px; overflow: hidden; } msg {display: block; border-bottom:solid lightgray 1px; position: relative; padding: 4px; min-height: 2.5em;} msg:hover {background-color: lightgreen;}  msgs .unread {font-weight: bold;} msgs .unreadresponse {color: darkslategray;} msgs .meta { margin-top:2px; display:block; color: DarkGray; text-align: right; font-size: 0.9em;}</style><body><div id='banner'><a href='http://www.plurk.com' target='_blank'><img src='http://www.plurk.com/static/logo.png'></a></div><div id='container'><msgs><msg></msg></msgs></div></body>",

	onReady: function(slider){	
		// When sidebar ready, preform reFreshPlurk()
		sliderObj = slider;
		reFreshPlurk();	
	},

    
	onClick: function(slider){
		// preform reFreshPlurk() when click at plurk icon on slide
		reFreshPlurk();
	},


});


function reFreshPlurk() {
	// When reFreshPlurk, preform login and get newest plurk
	console.log("reFreshPlurk")

	$.ajax({
		url: "http://www.plurk.com/API/Users/login",
		data: loginStr,
	
		success: function(json){
			// When login success, throw the newest plurk come with login
			var jsObject = JSON.parse(json);
			// console.log(json)
			$(sliderObj.contentDocument).find("msg").fadeOut('slow');	//Wipe out old msg
			
			// Display each plurk
			$(jsObject.plurks).each(
				function(i){
					var owner_id = jsObject.plurks[i].owner_id;
					var owner_display_name = jsObject.plurks_users[owner_id].display_name;
					var premalink = jsObject.plurks[i].plurk_id.toString(36);
					var read = jsObject.plurks[i].is_unread;
					var response_count = jsObject.plurks[i].response_count;
					var response_seen = jsObject.plurks[i].responses_seen;
					var postedtime = jsObject.plurks[i].posted;
					var content = '<msg id=\"' + jsObject.plurks[i].plurk_id + '\"><span class=\"responseNum\">' + response_seen + ' ' + response_count + ' ' + read + ' </span>' + owner_display_name + ' [' + jsObject.plurks[i].qualifier_translated + '] <content';
					if ((read == 1) || ((ReadOffset < Date.parse(postedtime)) && (response_count == 0))){	// If message is unread
						content += ' class=\"unread\">';
					}else if (response_seen < response_count) {	// If message response num. higher than seen-responses number
						content += ' class=\"unreadresponse\" >';
					}else { //Message is read
						content += '>';
					}
					content += jsObject.plurks[i].content + '</content><br><span class=\"meta\"><timestamp>' + postedtime + ' </timestamp><a class=\"permalink\" href=\"http://www.plurk.com/m/p/' + premalink + '\" target=\"_blank\">link</a></span></msg>';
					// console.log(content);
					$(sliderObj.contentDocument).find("msgs").append(content);
					OldOffset = Date.parse(postedtime);	// Remember oldest loaded plurk time
				}
			);
			
			
			// Add hover event listener on each msg
			$(sliderObj.contentDocument).find("msg").hover(
				function () {
					var hoverMsg = $(this);
					var selectPlurkID = parseInt(hoverMsg.attr("id"));
					var selectPlurkRead = hoverMsg.find("content").attr("class");
					var selectPlurkTimestamp = hoverMsg.find("timestamp").text();
					console.log('Hover: ' + selectPlurkID + ' Read [' + selectPlurkRead + '] Plurk time: ' + selectPlurkTimestamp + Date.parse(selectPlurkTimestamp) + ' ReadOffset ' + ReadOffset);
					
					if ((selectPlurkRead == 'unread')||(selectPlurkRead == 'unreadresponse')){
						//if unread or unreadresponse, set to read when hover
						$.ajax({
							url: "http://www.plurk.com/API/Timeline/markAsRead",
							data: ({
								'api_key': loginStr.api_key,
								'ids': JSON.stringify([ selectPlurkID ]),
								'note_position': true,
							}),
							success: function(json){
								console.log('Set read: ' + json);
								$(hoverMsg).find("content").removeClass("unread").removeClass("unreadresponse");
								if (Date.parse(selectPlurkTimestamp) > ReadOffset){
									ReadOffset = Date.parse(selectPlurkTimestamp);
									myStorage.ReadOffset = ReadOffset;
									console.log('myStorage.ReadOffset update: ' + myStorage.ReadOffset);
								}
							},
							error: function(xhr, textStatus, errorThrown){
								console.log('Set read error: ' + xhr.status + ' ' + textStatus + ' ' + errorThrown);				
							} 
						});
	
					}
				},
				function () {
					//console.log("unHOVER!");
				}
			);
			
			NewOffset = Date.parse(new Date());	// Rememver refresh time
			console.log('End refresh: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
			
			$(sliderObj.contentDocument).find("msgs").find('a').click(function(e){
				// Force all link open in new tabs, From littlebtc. 
				if (this.href) { jetpack.tabs.open(this.href); }
					e.preventDefault();
					e.stopPropagation();
				}
			);
									
		},
		error: function(xhr, textStatus, errorThrown){
			// Login error
			console.log('Login error: ' + xhr.status + ' ' + textStatus + ' ' + errorThrown);				
		} 

	});

};
