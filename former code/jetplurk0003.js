jetpack.future.import('slideBar') 
jetpack.slideBar.append( {
    icon: "http://www.plurk.com/favicon.ico",
    width: 250,
    html: "<style>body {margin: 0; padding: 0; padding-top: 45px; background: url(https://wave.google.com/wave/static/images/logo_preview.png) top left no-repeat; border-right: 1px solid lightgray; background-color: white; font-size: 11px;}msgs {display: block;}msg {display: block; border-bottom:solid lightgray 1px; position: relative; padding: 4px 4px; min-height: 3em;}msg:hover {background-color: lightgreen;}msg subject {display: block; margin-right: 10px; font-size: 12px;}msg subject.unread {font-weight: bolder;}msg unread-count {display: block; position: absolute; top: 2px; right: 0; background-color: darkgreen; color: white; font-size: 11px; padding: 0 5px; -moz-border-radius: 10px;}msg preview {color: gray;}#container {position: absolute; top:50px; bottom:0; overflow: auto; border: 1px solid lightgray;} #jetwavehome {display:block; position: absolute; top:2px; right:2px;}</style><body><img id='jetwavehome' src='https://jetpackgallery.mozillalabs.com/favicon.ico'/><div id='container'><msgs></msgs></div></body>",
} ); 


$.ajax({
  url: "http://www.plurk.com/API/Users/login",
  data: {username: "XXXXXXXXXXXXXXXX", password: "XXXXXXXXXXXXXXXXX", api_key:"LGMTGe6MKqjPnplwd4xHkUFTXjKOy6lJ" },
  success: function(json){
        var jsObject = JSON.parse(json);
        //console.log(json)

        $(jsObject.plurks).each(
            function(i){
                var owner_id = jsObject.plurks[i].owner_id;
                var owner_nickname = jsObject.plurks_users[owner_id].nick_name;
                var content = owner_nickname + ": " + jsObject.plurks[i].content_raw + " content: " + jsObject.plurks[i].content +" response: " + jsObject.plurks[i].response_count + " " + jsObject.plurks[i].posted + " posted. ";
                console.log(content);
                //$(slider.contentDocument).find("msgs").append("<msg title=\""+content+">"+"</subject><unread-count>"+jsObject.plurks[i].response_count+"</unread-count><preview>"+jjsObject.plurks[i].content_raw+"</preview></msg>");
            }
        );
    

        //jetpack.notifications.show(jsObject.plurks[0].content)
        //jetpack.notifications.show(jsObject.plurks_users)

    }
});
