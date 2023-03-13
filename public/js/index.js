function getWeatherOnCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      requestWeather(latitude, longitude);
    });
  } else {
    console.log("A geolocalização não está disponível!");
  }
}

function requestWeather(latitude, longitude) {
  var url = `/api/weather/latitude/${latitude}/longitude/${longitude}`;
  var xhr = new XMLHttpRequest();

  xhr.open("GET", url);
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      var response = JSON.parse(this.responseText);
      if (this.status === 200) {
        console.log(response);
        renderResults(response);
      }
    }
  };
  xhr.send();
}

function renderResults(currentWeather) {
  //TODO: Put values in each span
}
