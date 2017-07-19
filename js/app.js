/*jshint loopfunc: true */

// Model for this application
var fullAttractionList = [
    {title: "University of Tokyo", location: {lat: 35.712678, lng: 139.761989}, type: ["school/college"]},
    {title: "Tokyo Skytree", location: {lat: 35.710063, lng: 139.8107}, type: ["observation-tower", "landmark"]},
    {title: "Tokyo Tower", location: {lat: 35.65857, lng: 139.745484}, type: ["observation-tower", "landmark", "dating"]},
    {title: "Pokemon Center", location: {lat: 35.728798, lng: 139.719247}, type: ["shopping", "fun", "souvenir"]},
    {title: "Ueno Zoo", location: {lat: 35.716454, lng: 139.771318}, type: ["zoo", "park", "fun"]},
    {title: "Akihabara", location: {lat: 35.6984949, lng: 139.7719771}, type: ["shopping", "fun", "souvenir"]},
    {title: "Shinjuku Gyoen National Garden", location: {lat: 35.6851763, lng: 139.707863}, type: ["park", "garden"]},
    {title: "Sensō-ji", location: {lat: 35.7147651, lng: 139.7944666}, type: ["temple"]}, 
    {title: "Meiji Jingu", location: {lat: 35.675512, lng: 139.7007245}, type: ["shrine", "garden"]},
    {title: "Tokyo Disneyland", location: {lat: 35.6328964, lng: 139.8782056}, type: ["fun", "park", "souvenir"]},
    {title: "Ghibli Museum", location: {lat: 35.696238, lng: 139.568243}, type: ["fun", "museum", "souvenir"]}
    //{title:, location: {lat:, lng:}, type:}
];

// function to open the side nav bar
function openNav() {
    document.getElementById("side-nav").style.width = "340px";
    document.getElementById("map-canvas").style.left = "340px";
}

// function to close the side nav bar
function closeNav() {
    document.getElementById("side-nav").style.width = "0";
    document.getElementById("map-canvas").style.left = "0";
}


// use Google Map API
var map;
var infowindow;
var markers = [];
var apiKey = "AIzaSyCdiFxVS_WVLaYdnPtGhBWIeoeHLOOyT6s";

function initMap() {
    // the center of the map: Tokyo, Japan
    var mapCenter = {lat: 35.681788, lng: 139.766761};

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
        marker.addListener('click', function() {
            // one marker animation a time
            for (var i = 0; i < markers.length; i++) {
                markers[i].setAnimation(null);
            }
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
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    } // for loop
    
    map.fitBounds(bounds);
} // displayMarkers()


// display the infowindow, one at a time
function displayInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        var contentString = '<h3>' + marker.title + '</h3>'+ '<hr>' + '<p>Link you may find useful</p>'+'<div id="wiki-link"><ul>';
      
        // load Wikipedia Articles
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.getTitle() + '&format=json&callback=wikiCallback';

        $.ajax({
            url : wikiUrl,
            dataType : 'jsonp'
        }).done(function(response){
            // get the results from wikipedia
            var articleList = response[1];
            // set the max number of wikipedia links to be 3
            var numArticle = articleList.length > 3? 3 : articleList.length;
            // go through the list and generate urls
            for (var i = 0; i < numArticle; i++){
                articleStr = articleList[i];
                var url = 'http://en.wikipedia.org/wiki/' + articleStr;   
                // put the articles in an unordered list 
                contentString += '<li><a href="' + url + '">' + articleStr + '</a></li>';
            }
            // close up contentString, now ready to use
            contentString += '</ul>' + '</div>';
            // set the content and open the infowindow
            infowindow.setContent(contentString);
            infowindow.open(map, marker);
        }).fail(function () {
            // set the content and open the infowindow
            // tell the users that requesting failed
            infowindow.setContent("failed to get wikipedia resources");
            infowindow.open(map, marker);
        });
       
        // clear the infowindow if it is closed
        infowindow.addListener('closeclick',function(){
            infowindow.marker = null;
        });
    } // if statement
} // displayInfoWindow()


// use KnockoutJS to manage the project
var Attraction = function(data) {
    this.title = ko.observable(data.title);
    this.location = ko.observable(data.location);
    this.type = ko.observableArray(data.type);
}; // Attraction class


var ViewModel = function() {  
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
    
    this.selectedOptionValue.subscribe(function() {
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

    this.userClickItem = function(clickedItem) {
        // if clickedItem is a ko observable
        if ((typeof clickedItem.title) == "function"){
           showClickedItem(clickedItem.title());
       }

       // if clickedItem is a normal object
       if ((typeof clickedItem.title) == "string") {
           showClickedItem(clickedItem.title);
       }
    };

}; // ViewModel class


// error handing method
var errorLoadingMap = function() {
    alert("Failed to load the Map. Please try again later.");
};


// generate a full list
var generateFullList = function() {
    var list = [];
    for(var i = 0; i < fullAttractionList.length; i++) {
        //var attraction = new Attraction(fullAttractionList[i]);
        //attraction.qualified = true; 
        list.push(fullAttractionList[i]);
    }
    return list;
}; // generateFullList()


// use the keyword to find attractions that have the type users want
function refreshList(keyword) {  
    // if user choose all, return the full list
    if (keyword == "all") {
        var list = generateFullList();
      	return list;
    }

    var qualifiedList = [];
    if (keyword != "all") {
        for (var i = 0; i < fullAttractionList.length; i++) {
            // if the type of the attraction matches keyword
            if (fullAttractionList[i].type.includes(keyword)) {
                // console.log(fullAttractionList[i]);
                qualifiedList.push(fullAttractionList[i]);
            }
        }
    } 

    return qualifiedList;
} // refreshList()


// show qualified places and hide others
function showFilteredListing(keyword, qualifiedList) {
    var titles = [];

    // grab the titles from qualified list
    for (var i = 0; i < qualifiedList.length; i++) {
        titles.push(qualifiedList[i].title);
    }

    if (keyword == "all") {
        // set all markers visible
        for (var k = 0; k < markers.length; k++) {
            if (markers[k].getVisible() == false){
                markers[k].setVisible(true);
            }
        } 
    } else {
        // if a keyword is specified, show only filtered
        for (var j = 0; j < markers.length; j++) {
            // if the title of the marker matches keyword
            if (titles.includes(markers[j].title)) {
                markers[j].setVisible(true);
                markers[j].setAnimation(google.maps.Animation.DROP);
            } else {
                markers[j].setVisible(false);
            }
        } // for loop
    }
} // showFilteredListing


// invoked when user click an entry
function showClickedItem(title) {
    for (var i = 0; i < markers.length; i++) {
        // one marker animation a time
        if (markers[i].title == title) {
            markers[i].setAnimation(google.maps.Animation.BOUNCE);
            displayInfoWindow(markers[i], infowindow);
        } else {
             markers[i].setAnimation(null);
        }
    } // for loop
} // showClickedItem()

ko.applyBindings(new ViewModel());
