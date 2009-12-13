/* JetPlurk 0.0008
 * cc:by-sa 
 * Author: Irvin 
 * With the help from littlebtc & MozTW community
 * Some code adapted from BobChao's JetWave http://go.bobchao.net/jetwave
 */

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

var plurk_ApiKey = "LGMTGe6MKqjPnplwd4xHkUFTXjKOy6lJ";
var loginStr = {};  
loginStr.username = set.jetplurk.username;  
loginStr.password = set.jetplurk.password;  
loginStr.api_key = plurk_ApiKey;  

var NewOffset = new Date( );	// To remember latest loaded plurk timestamp
var OldOffset = new Date( );	// Oldest loaded plurk timestamp
console.log('Begin: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset);


jetpack.future.import('slideBar') 
jetpack.slideBar.append( {
    icon: "http://www.plurk.com/favicon.ico",
    width: 250,
    html: "<style>body {margin: 0; background-color: white; border-bottom:solid lightgray 1px; font-size: 12px;} #banner {display:block;} #banner img {border:0px; } msgs {display: block; max-width: 245px; overflow: hidden; } msg {display: block; border-bottom:solid lightgray 1px; position: relative; padding: 4px; min-height: 2.5em;} msg:hover {background-color: lightgreen;}  msgs .unread {font-weight: bold;} msgs .meta { margin-top:2px; display:block; color: DarkGray; text-align: right; font-size: 0.9em;}</style><body><div id='banner'><a href='http://www.plurk.com' target='_blank'><img src='http://www.plurk.com/static/logo.png'></a></div><div id='container'><msgs></msgs></div></body>",

    onReady: function(slider){	
    	// When sidebar ready, preform login and get newest plurk
		$.ajax({
			url: "http://www.plurk.com/API/Users/login",
			data: loginStr,

			success: function(json){
				// When login success, throw the newest plurk come with login
				var jsObject = JSON.parse(json);
				//console.log(json)

				$(jsObject.plurks).each(
					function(i){
						var owner_id = jsObject.plurks[i].owner_id;
						var owner_display_name = jsObject.plurks_users[owner_id].display_name;
						var premalink = jsObject.plurks[i].plurk_id.toString(36);
						var read = jsObject.plurks[i].is_unread;
						var response_count = jsObject.plurks[i].response_count
						var content = '<msg id=\"' + jsObject.plurks[i].plurk_id + '\"><span class=\"responseNum\">' + response_count + ' </span>' + owner_display_name + ' [' + jsObject.plurks[i].qualifier_translated + '] <content';
						if (read == 0){ //read
							content += '>';
						}
						if (read == 1 || jsObject.plurks[i].responses_seen < response_count){	//unread
							content += ' class=\"unread\">';
						}
						content += jsObject.plurks[i].content + '</content><br><span class=\"meta\">' + jsObject.plurks[i].posted + ' <a class=\"permalink\" href=\"http://www.plurk.com/m/p/' + premalink + '\" target=\"_blank\">link</a></span></msg>';
						console.log(content);				
						$(slider.contentDocument).find("msgs").append(content);
						OldOffset = jsObject.plurks[i].posted;
					}
				);
				
				NewOffset = (new Date( )).toUTCString();
				console.log('End login: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset);
				
				$(slider.contentDocument).find("msgs").find('a').click(function(e){
					// Force all link open in new tabs, From littlebtc. 
					if (this.href) { jetpack.tabs.open(this.href); }
						e.preventDefault();
						e.stopPropagation();
					}
				);
										
			},
			error:function (xhr, textStatus, errorThrown){
				// Login error
				console.log(xhr.status + textStatus + errorThrown);				
			} 

		});
    },


    
    onClick: function(slider){
	    	var getPlurk = {};
	    	getPlurk.api_key = plurk_ApiKey;  
	    	getPlurk.offset = '2009-6-20T21:55:34';  
	    	
			//jetpack.notifications.show("Slider onClick");
	 
		$.ajax({
			url: "http://www.plurk.com/API/Polling/getPlurks",
			data: getPlurk,

			success: function(json){
				// When login success, throw the newest plurk come with login
				console.log('Polling success')

				$(slider.contentDocument).find("msg").remove();

				var jsObject = JSON.parse(json);
				//console.log(json)

				$(jsObject.plurks).each(
					function(i){
						var owner_id = jsObject.plurks[i].owner_id;
						var owner_display_name = jsObject.plurks_users[owner_id].display_name;
						var premalink = jsObject.plurks[i].plurk_id.toString(36);
						var read = jsObject.plurks[i].is_unread;
						var response_count = jsObject.plurks[i].response_count
						var content = '<msg id=\"' + jsObject.plurks[i].plurk_id + '\"><span class=\"responseNum\">' + response_count + ' </span>' + owner_display_name + ' [' + jsObject.plurks[i].qualifier_translated + '] <content';
						if (read == 0){ //read
							content += '>';
						}
						if (read == 1 || jsObject.plurks[i].responses_seen < response_count){	//unread
							content += ' class=\"unread\">';
						}
						content += jsObject.plurks[i].content + '</content><br><span class=\"meta\">' + jsObject.plurks[i].posted + ' <a class=\"permalink\" href=\"http://www.plurk.com/m/p/' + premalink + '\" target=\"_blank\">link</a></span></msg>';
						console.log(content);				
						$(slider.contentDocument).find("msgs").append(content);
						OldOffset = jsObject.plurks[i].posted;
					}
				);
				
				NewOffset = (new Date( )).toUTCString();
				console.log('End login: NewOffset ' + NewOffset + ' OldOffset ' + OldOffset);
				
				$(slider.contentDocument).find("msgs").find('a').click(function(e){
					// Force all link open in new tabs, From littlebtc. 
					if (this.href) { jetpack.tabs.open(this.href); }
						e.preventDefault();
						e.stopPropagation();
					}
				);
										
			},
			error:function (xhr, textStatus, errorThrown){
				// Login error
				console.log(xhr.status + textStatus + errorThrown);				
			} 

		});
	},
    
    onSelect: function(slider){
  
		$(slider.contentDocument).find("msg").hover(
			function () {
				var selectPlurkID = parseInt($(this).attr("id"));
				var selectPlurkRead = $(this).find("content").attr("class");

				console.log("HOVER! " + selectPlurkID + " Read: " + selectPlurkRead);
								
				if (selectPlurkRead == 'unread'){
					//var readPlurk="[" + selectPlurkID + "]";
					var readPlurk = [ selectPlurkID ];

					$.ajax({
						url: "http://www.plurk.com/API/Timeline/markAsRead",
						data: ({
							'api_key': loginStr.api_key,
							//"ids": readPlurk,
							'ids': JSON.stringify(readPlurk),
						}),
						success: function(json){
							console.log(json);
      						$(slider.contentDocument).find("#"+selectPlurkID).find("content").removeClass("unread");
      						//$(slider.contentDocument).find("#"+selectPlurkID).find("content").css({'font-size' : 'large'});

      						//$(this).find("content").removeClass("unread");					
						},
						error:function (xhr, textStatus, errorThrown){
							console.log(xhr.status +" "+textStatus + " " + errorThrown);				
						} 
					});


				}
			},
			function () {
				//$(this).removeClass("hover");
				console.log("unHOVER!");
			}
		);

    },

});