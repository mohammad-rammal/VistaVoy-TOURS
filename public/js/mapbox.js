const locations = JSON.parse(document.getElementById('map').dataset.locations);

// console.log(locations);

/* eslint-disable */
document.addEventListener('DOMContentLoaded', function () {
    const mapElement = document.getElementById('map');

    if (!mapElement) return;

    // Parse locations data
    const locations = JSON.parse(mapElement.dataset.locations);

    const map = L.map('map', {
        scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const bounds = L.latLngBounds(locations.map((loc) => [loc.coordinates[1], loc.coordinates[0]]));

    // Add markers and popups
    locations.forEach((loc) => {
        L.marker([loc.coordinates[1], loc.coordinates[0]])
            .addTo(map)
            .bindPopup(
                `<b class="popup-content">Day: ${loc.day}</b><br><b class="popup-content2">${loc.description}</b>`
            );
    });

    map.fitBounds(bounds);
    const zoomLevel = map.getZoom() - 1;  
    map.setZoom(zoomLevel);
    map.fitBounds(bounds, {padding: [50, 50]});
});
