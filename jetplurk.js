/* JetPlurk 0.0007
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

var loginStr = {};  
loginStr.username = set.jetplurk.username;  
loginStr.password = set.jetplurk.password;  
loginStr.api_key = "LGMTGe6MKqjPnplwd4xHkUFTXjKOy6lJ";  


jetpack.future.import('slideBar') 
jetpack.slideBar.append( {
    icon: "http://www.plurk.com/favicon.ico",
    width: 250,
    html: "<style>body {margin: 0; padding-top: 55px; background: url(http://www.plurk.com/static/logo.png) top left no-repeat; background-color: white; border-bottom:solid lightgray 1px; font-size: 12px;} msgs {display: block; max-width: 245px; overflow: hidden; } msg {display: block; border-bottom:solid lightgray 1px; position: relative; padding: 2px; min-height: 2.5em;} msg:hover {background-color: lightgreen;} msgs .meta { margin-top:2px; display:block; color: DarkGray; text-align: right; font-size: 0.9em;}</style><body><div id='container'><msgs></msgs></div></body>",
    onClick: function(slider){

		$.ajax({
			url: "http://www.plurk.com/API/Users/login",
			data: loginStr,

			success: function(json){
				var jsObject = JSON.parse(json);
				//console.log(json)
				
				$(jsObject.plurks).each(
					function(i){
						var owner_id = jsObject.plurks[i].owner_id;
						var owner_display_name = jsObject.plurks_users[owner_id].display_name;
						var premalink = jsObject.plurks[i].plurk_id.toString(36)
						var content = '<msg id=\"' + jsObject.plurks[i].plurk_id + '\">' + owner_display_name + ' [' + jsObject.plurks[i].qualifier_translated + '] ' + jsObject.plurks[i].content + '<br><span class=\"meta\">' + jsObject.plurks[i].posted + ' <a class=\"permalink\" href=\"http://www.plurk.com/m/p/' + premalink + '\" target=\"_blank\">link</a></span></msg>';
						//console.log(content);				
						$(slider.contentDocument).find("msgs").append(content);
					}
				);
				
				$(slider.contentDocument).find("msgs").find('a').click(function(e){		// Force all link open in new tabs, From littlebtc. 
					if (this.href) { jetpack.tabs.open(this.href); }
						e.preventDefault();
						e.stopPropagation();
					}
				);
											
			},
			error:function (xhr, textStatus, errorThrown){
				console.log(xhr.status + textStatus + errorThrown);				
			} 

		});

    },
})