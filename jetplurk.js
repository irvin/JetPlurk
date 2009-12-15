/* JetPlurk 0.011
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
console.log('JetPlurk Start: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);

jetpack.future.import('slideBar') 
jetpack.slideBar.append( {
    icon: "http://www.plurk.com/favicon.ico",
    width: 250,
    html: "<style>body {margin: 0; background-color: BurlyWood; border-bottom:solid lightgray 1px; font-size: 12px; line-height: 1.3em;} #banner {display:block;} #banner img {border:0px; } msgs {display: block; max-width: 245px; overflow: hidden; } msg {display: block; background-color: Snow; -moz-border-radius: 5px; padding: 2px; margin: 2px; min-height: 2.5em; position: relative;} msg:hover {background-color: White;} msgs .unread {font-weight: bold;} msgs .unreadresponse {color: DarkGreen; font-weight: bold;} msgs .meta {display:block; color: DarkGray; text-align: right; font-size: 0.9em;} msg responseNum {color: Chocolate; font-size: 2em; margin-left: 3px;} responses {display: block; line-height: 1.1em; overflow: hidden; margin:2px; border: solid lightgray thin; -moz-border-radius: 5px; padding: 2px;} response {display: block; margin:0;} </style><body><div id='banner'><a href='http://www.plurk.com' target='_blank'><img src='http://www.plurk.com/static/logo.png'></a></div><div id='container'><msgs><msg></msg></msgs></div></body>",

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
					var content = '<msg id=\"' + jsObject.plurks[i].plurk_id + '\"> ' + owner_display_name + ' [' + jsObject.plurks[i].qualifier_translated + '] <content';
					if ((read == 1) || ((ReadOffset < Date.parse(postedtime)) && (response_count == 0))){	// If message is unread
						content += ' class=\"unread\">';
					}else if (response_seen < response_count) {	// If message response num. higher than seen-responses number
						content += ' class=\"unreadresponse\" >';
					}else { //Message is read
						content += '>';
					}
					content += jsObject.plurks[i].content + '</content><br><span class=\"meta\"><timestamp>' + postedtime + ' </timestamp><a class=\"permalink\" href=\"http://www.plurk.com/m/p/' + premalink + '\" target=\"_blank\">link</a>';
					if (response_count > 0){	// If has response
							content += '<responseNum>' + response_count  + '</responseNum>';
					}
					content += '</span></msg>';
					// console.log(content);
					$(sliderObj.contentDocument).find("msgs").append(content);
					OldOffset = Date.parse(postedtime);	// Remember oldest loaded plurk time
				}
			);
			
			NewOffset = Date.parse(new Date());	// Rememver refresh time
			console.log('JetPlurk refresh: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset + ' ReadOffset ' + ReadOffset);
			
			// Add hover event listener on each msg
			$(sliderObj.contentDocument).find("msg").hover(
				function () {
					var hoverMsg = $(this);
					var selectPlurkID = parseInt(hoverMsg.attr("id"));
					var selectPlurkRead = hoverMsg.find("content").attr("class");
					var selectPlurkTimestamp = hoverMsg.find("timestamp").text();
					//console.log('Hover: ' + selectPlurkID + ' Read [' + selectPlurkRead + '] Plurk time: ' + selectPlurkTimestamp + Date.parse(selectPlurkTimestamp) + ' ReadOffset ' + ReadOffset);
					
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
								//console.log('Set read: ' + json);
								$(hoverMsg).find("content").removeClass("unread").removeClass("unreadresponse");
								if (Date.parse(selectPlurkTimestamp) > ReadOffset){
									ReadOffset = Date.parse(selectPlurkTimestamp);
									myStorage.ReadOffset = ReadOffset;
									//console.log('myStorage.ReadOffset update: ' + myStorage.ReadOffset);
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

			// Add click event listener on each msg
			$(sliderObj.contentDocument).find("msg").click(
				function () {
					var clickMsg = $(this);
					var selectPlurkID = parseInt(clickMsg.attr("id"));
					var selectPlurkResponseNum = clickMsg.find("responseNum").text();
					//console.log('Click: ' + selectPlurkID + ' responseNum ' + selectPlurkResponseNum);

					if ((selectPlurkResponseNum != "") && ($(clickMsg).find("responses").text() == "")){
						// If click msg has response & not showing now, get response
						$.ajax({
							url: "http://www.plurk.com/API/Responses/get",
							data: ({
								'api_key': loginStr.api_key,
								'plurk_id': selectPlurkID,
								'from_response': 0,
							}),
							success: function(json){
								//console.log('Get response: ' + json);
								var jsObject = JSON.parse(json);

								// Display each response
								$(clickMsg).append('<responses></responses>');
								$(jsObject.responses).each(
									function(i){
										var responser_id = jsObject.responses[i].user_id;
										var responser_display_name = jsObject.friends[responser_id].display_name;
										var postedtime = jsObject.responses[i].posted;
										var content = '<response>' + responser_display_name + ' [' + jsObject.responses[i].qualifier_translated + '] ' + jsObject.responses[i].content + ' <span class=\"meta\"><timestamp>' + postedtime + '</timestamp></span></response>';
										//console.log(content);
										$(clickMsg).find("responses").append(content);
									}
								);
								//console.log($(clickMsg).html());
							},
							error: function(xhr, textStatus, errorThrown){
								console.log('Get response error: ' + xhr.status + ' ' + textStatus + ' ' + errorThrown);				
							} 
						});
					}else if ($(clickMsg).find("responses").text() != ""){
							// If showing response now, remove it
							$(clickMsg).find("responses").fadeOut('fast',function (){
								$(clickMsg).find("responses").remove();
							});
					}

				}
			);

						
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
