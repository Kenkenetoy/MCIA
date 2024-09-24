var krpanoplugin = function() {
    var local = this;

    var krpano = null;
    var plugin = null;
    var inputelement = null;

    local.registerplugin = function(krpanointerface, pluginpath, pluginobject) {
        krpano = krpanointerface;
        plugin = pluginobject;

        inputelement = document.createElement("input");
        inputelement.type = "text";
        inputelement.style.width = "100%";
        inputelement.style.height = "100%";
        
        plugin.registerattribute("text", "", text_set, text_get);
        plugin.registerattribute("onchanged", null);
        
        inputelement.addEventListener("input", text_input, true);
        inputelement.addEventListener("touchstart", text_click, true);
        inputelement.addEventListener("blur", e => {e.target.focus();});

        plugin.sprite.appendChild(inputelement);

        // Inject custom CSS styles for autocomplete
        injectCustomStyles();

        // Initialize jQuery UI autocomplete with dynamic tags
        $(inputelement).autocomplete({
			source: function(request, response) {
				var tags = fetchAvailableTags();
				var filteredTags = $.grep(tags, function(tag) {
					return tag.label.toLowerCase().indexOf(request.term.toLowerCase()) === 0;
				});
				response(filteredTags);
			},
			select: function(event, ui) {
				inputelement.value = ui.item.label;
				loadScene(ui.item.sceneName, ui.item.barangay, ui.item.place); // Pass both parameters
				return false; // Prevent default behavior
			},
			create: function() {
				$(this).data('ui-autocomplete')._renderItem = function(ul, item) {
					return $("<li>")
						.append("<div><img src='" + item.thumbnail + "' class='autocomplete-thumbnail' /> " + item.label + "</div>")
						.appendTo(ul);
				};
			}
		});
    }

    local.unloadplugin = function() {
        plugin = null;
        krpano = null;
    }

    function text_click() {
        inputelement.focus();
    }
    
    function text_set(newtext) {
        inputelement.value = newtext;
    }
    
    function text_get() {
        return inputelement.value;
    }
    
    function text_input() {
        krpano.call(plugin.onchanged, plugin);
    }

    function fetchAvailableTags() {
		var tags = [];
		var scenes = krpano.get("scene");
	
		if (scenes) {
			for (var i = 0; i < scenes.count; i++) {
				var scene = scenes.getItem(i);
				var place = scene.place;
				var barangay = scene.barangay; // Get the barangay attribute
				var head = scene.head;
				var thumburl = scene.thumburl;
				var name = scene.name;
	
				if (place && head === "true" && !tags.find(tag => tag.label === place)) {
					tags.push({
						label: place,
						thumbnail: thumburl,
						sceneName: name,
						barangay: barangay, // Store the barangay
						place: place // Store the place
					});
				}
			}
		} else {
			console.error("No scenes found.");
		}
	
		return tags;
	}	

    function injectCustomStyles() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            /* Style the autocomplete container */
            .ui-autocomplete {
                max-height: 200px;
                overflow-y: auto;
                overflow-x: hidden;
                background-color: #d4b86a;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-family: 'Atma', sans-serif;
                font-size: 18px;
				width:10px;
            }

            /* Style each menu item */
            .ui-menu-item {
                padding: 8px;
                cursor: pointer;
				color: #ffff;
            }

            /* Style the thumbnail image */
            .autocomplete-thumbnail {
                width: 50px;
                height: 50px;
                float: left;
                margin-right: 10px;
                border-radius: 4px;
            }

            /* Style the focused menu item */
            .ui-state-focus {
                background-color: #f0f0f0;
                color: #000;
            }
        `;
        document.head.appendChild(style);
    }

    function loadScene(sceneName, barangay, place) {
		// Load the scene with the name
		krpano.call("loadscene('" + sceneName + "', null, MERGE, BLEND(1));");
		
		// Force UI to refresh if needed
		krpano.call("force_UI_2");
	
		// Select barangay with the specific parameters
		krpano.call("select_barangay('" + barangay + "', '" + place + "');");
	}
};

// credits to chatgpt fuck this shit
