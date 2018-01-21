// Model for this application
var fullAttractionList = [
    {title: "University of Tokyo", location: {lat: 35.712678, lng: 139.761989}, type: ["school/college"]},
    {title: "Tokyo Skytree", location: {lat: 35.710063, lng: 139.8107}, type: ["observation-tower", "landmark"]},
    {title: "Tokyo Tower", location: {lat: 35.65857, lng: 139.745484}, type: ["observation-tower", "landmark", "dating"]},
    {title: "Pokemon Center", location: {lat: 35.728798, lng: 139.719247}, type: ["shopping", "fun", "souvenir"]},
    {title: "Ueno Zoo", location: {lat: 35.716454, lng: 139.771318}, type: ["zoo", "park", "fun"]},
    {title: "Akihabara", location: {lat: 35.698353, lng: 139.773114}, type: ["shopping", "fun", "souvenir"]},
    {title: "Shinjuku Gyoen National Garden", location: {lat: 35.6851763, lng: 139.707863}, type: ["park", "garden"]},
    {title: "Sensō-ji", location: {lat: 35.714765, lng: 139.796655}, type: ["temple"]}, 
    {title: "Meiji Jingu", location: {lat: 35.676398, lng: 139.699326}, type: ["shrine", "garden"]},
    {title: "Tokyo Disneyland", location: {lat: 35.632896, lng: 139.880394}, type: ["fun", "park", "souvenir"]},
    {title: "Ghibli Museum", location: {lat: 35.696238, lng: 139.570432}, type: ["fun", "museum", "souvenir"]}
    //{title:, location: {lat:, lng:}, type:}
];

// function to open the side nav bar
function openNav() {
    document.getElementById("side-nav").style.width = "350px";
    document.getElementById("map-canvas").style.left = "350px";
}

// function to close the side nav bar
function closeNav() {
    document.getElementById("side-nav").style.width = "0";
    document.getElementById("map-canvas").style.left = "0";
}

var map, // to hold a Map object 
    infowindow, // to hold a Infowindow object
    markers = []; // an array of markers on map

function initMap() {
    // the center of the map: Tokyo, Japan
    var mapCenter = {
        lat: 35.681788,
        lng: 139.766761
    };

    // create a new instance of Map class
    map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: 13
    });

    // create an infowindow for markers
    infowindow = new google.maps.InfoWindow();

    for (var i = 0; i < fullAttractionList.length; i++) {
        // get the title & position
        var title = fullAttractionList[i].title;
        var location = fullAttractionList[i].location;

        // create a marker for this attraction
        var marker = new google.maps.Marker({
            position: location,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });

        // push it into markers array
        markers.push(marker);

        // a 'click event' to open the infowindow
        marker.addListener('click', function () {
            // one marker animation a time
            markers.forEach((m) => {m.setAnimation(null);});
            // show users the marker clicked is active
            this.setAnimation(google.maps.Animation.BOUNCE);
            // display the detailed info about the place selected
            displayInfoWindow(this, infowindow);
        });
    } // for loop

    displayMarkers(markers);
} // initMap()


// display all markers
function displayMarkers(markers) {
    var bounds = new google.maps.LatLngBounds();

    markers.forEach( (marker) => {
        marker.setMap(map);
        bounds.extend(marker.position);
    });

    map.fitBounds(bounds);
} // displayMarkers()


// display the infowindow, one at a time
function displayInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        var contentString = `<h3>${marker.title}</h3><hr><p>Link you may find useful</p><div id="wiki-link"><ul>`;

        // load Wikipedia Articles
        var wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${marker.getTitle()}&format=json&callback=wikiCallback`;

        $.ajax({
            url: wikiUrl,
            dataType: 'jsonp'
        }).done( (response) => {
            // get the results from wikipedia
            var articleList = response[1];
            // set the max number of wikipedia links to 3
            var numArticle = articleList.length > 3 ? 3 : articleList.length;
            
            // go through the list and generate urls
            for (var i = 0; i < numArticle; i++) {
                articleStr = articleList[i];
                var url = `http://en.wikipedia.org/wiki/${articleStr}`;
                // put the articles in an unordered list 
                contentString += `<li><a href="${url}">${articleStr}</a></li>`;
            }

            // close up contentString, now ready to use
            contentString += '</ul></div>';
            // set the content and open the infowindow
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        }).fail( () => {
            // set the content and open the infowindow
            // tell the users that requesting failed
            infowindow.setContent("failed to get wikipedia resources");
            infowindow.open(map, marker);
        });

        // clear the infowindow if it is closed
        infowindow.addListener('closeclick', () => {
            infowindow.marker = null;
        });
    } // if statement
} // displayInfoWindow()


// use KnockoutJS to manage the project
var Attraction = (data) => {
    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
    this.type = ko.observableArray(data.type);
}; // Attraction class


function ViewModel() {
    // inner this != outer this
    var self = this;

    // gerateFullList() is used to generate an array 
    // consisting all the elements in the list of attractions
    var fullList = generateFullList();
    this.attractionList = ko.observableArray(fullList);

    // options for drop down menu
    this.optionValues = [
        "all", "school/college", "observation-tower", "landmark",
        "dating", "shopping", "fun", "souvenir", "zoo", "park",
        "temple", "shrine", "garden", "museum"
    ];

    // default option is "all"
    this.selectedOptionValue = ko.observable("all");

    this.selectedOptionValue.subscribe( () => {
        // close opened infowindow
        infowindow.close();

        // refreshList() returns an array of all qualified attractions
        var qualified = refreshList(self.selectedOptionValue());

        // attractionList now contains qualified places only
        // entries on the left of the page will be updated automatically
        self.attractionList(qualified);

        // show filtered markers
        showFilteredListing(self.selectedOptionValue(), self.attractionList());
    });

    this.userClickItem = (clickedItem) => {
        // if clickedItem is a ko observable
        if ((typeof clickedItem.title) == "function")
            showClickedItem(clickedItem.title());

        // if clickedItem is a normal object
        if ((typeof clickedItem.title) == "string")
            showClickedItem(clickedItem.title);
    };

}; // ViewModel class


// error handing method
var errorLoadingMap = () => {
    alert("Failed to load the Map. Please try again later.");
};


// generate a full list
var generateFullList = () => {
    var list = [];

    fullAttractionList.forEach((attraction) => {
        list.push(attraction);
    });

    return list;
}; // generateFullList()


// use the keyword to find attractions that have the type users want
function refreshList(keyword) {
    // if user choose all, return the full list
    if (keyword == "all") {
        var list = generateFullList();
        return list;
    } // if

    var qualifiedList = [];
    if (keyword != "all") {
        // filter the attractions
        fullAttractionList.forEach((attraction) => {
            if (attraction.type.includes(keyword))
                qualifiedList.push(attraction);
        });
    } // if

    return qualifiedList;
} // refreshList()


// show qualified places and hide others
function showFilteredListing(keyword, qualifiedList) {
    var titles = [];

    // grab the titles from qualified list
    qualifiedList.forEach((element) => {
        titles.push(element.title);
    });

    if (keyword == "all") {        
        // set all markers visible    
        // for (var k = 0; k < markers.length; k++) {
        //     if (markers[k].getVisible() == false)
        //         markers[k].setVisible(true);
        // }

        markers.forEach((marker) => {
            if (marker.getVisible() == false)
                marker.setVisible(true);
        });
    } else {
        // if a keyword is specified, show only filtered
        // for (var j = 0; j < markers.length; j++) {
        //     // if the title of the marker matches keyword
        //     if (titles.includes(markers[j].title)) {
        //         markers[j].setVisible(true);
        //         markers[j].setAnimation(google.maps.Animation.DROP);
        //     } else {
        //         markers[j].setVisible(false);
        //     }
        // } // for loop

        markers.forEach((marker) => {
            // if the title of the marker matches keyword
            if (titles.includes(marker.title)) {
                marker.setVisible(true);
                marker.setAnimation(google.maps.Animation.DROP);
            } else {
                marker.setVisible(false);
            }
        });
    } // else
} // showFilteredListing


// invoked when user click an entry
function showClickedItem(title) {
    // for (var i = 0; i < markers.length; i++) {
    //     // one marker animation a time
    //     if (markers[i].title == title) {
    //         markers[i].setAnimation(google.maps.Animation.BOUNCE);
    //         displayInfoWindow(markers[i], infowindow);
    //     } else {
    //         markers[i].setAnimation(null);
    //     }
    // } // for loop

    markers.forEach((marker) => {
        if (marker.title == title) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            displayInfoWindow(marker, infowindow);
        } else {
            marker.setAnimation(null);
        }
    });
} // showClickedItem()

ko.applyBindings(new ViewModel());
