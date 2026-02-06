// =====================================================
// GeoVision - Main JavaScript
// Professional Spatial Analysis Platform
// =====================================================

// Global Variables
let map;
let markers = [];
let hazardLayer;
let is3DMode = false;
let osmb;
let currentLocation = null;
let chatMessages = [];

// Configuration
const config = {
    defaultCenter: [12.8797, 121.7740], // Philippines center
    defaultZoom: 6,
    apiEndpoint: 'https://api.anthropic.com/v1/messages'
};

// =====================================================
// Initialize Application
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeEventListeners();
    loadActiveHazards();
    showWelcomeMessage();
});

// =====================================================
// Map Initialization
// =====================================================
function initializeMap() {
    // Initialize Leaflet map
    map = L.map('map').setView(config.defaultCenter, config.defaultZoom);

    // Add base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize hazard layer
    hazardLayer = L.layerGroup().addTo(map);

    // Add click event to map
    map.on('click', handleMapClick);

    // Load hazard zones
    loadHazardZones();
}

// =====================================================
// Event Listeners
// =====================================================
function initializeEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Map controls
    document.getElementById('toggle3D').addEventListener('click', toggle3DView);
    document.getElementById('toggleSatellite').addEventListener('click', toggleSatellite);
    document.getElementById('toggleHazards').addEventListener('click', toggleHazards);

    // Panel controls
    document.getElementById('closeInfo').addEventListener('click', () => {
        document.getElementById('infoPanel').style.display = 'none';
    });
    
    document.getElementById('closeChat').addEventListener('click', () => {
        document.getElementById('aiChatPanel').style.display = 'none';
    });

    document.getElementById('refreshHazards').addEventListener('click', loadActiveHazards);

    // Chat functionality
    document.getElementById('sendChat').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Image attachment
    document.getElementById('attachImage').addEventListener('click', () => {
        document.getElementById('imageInput').click();
    });
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);

    // Expand chat
    document.getElementById('expandChat').addEventListener('click', openFullScreenChat);

    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeFullScreenChat);
    document.getElementById('modalSendChat').addEventListener('click', () => sendChatMessage(true));
    document.getElementById('modalChatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage(true);
    });
    document.getElementById('modalAttachImage').addEventListener('click', () => {
        document.getElementById('modalImageInput').click();
    });
    document.getElementById('modalImageInput').addEventListener('change', (e) => handleImageUpload(e, true));
}

// =====================================================
// Search Functionality
// =====================================================
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    showLoading(true);

    try {
        // Use Nominatim API for geocoding
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const results = await response.json();

        if (results.length > 0) {
            const location = results[0];
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);

            map.setView([lat, lon], 13);
            
            // Add marker
            const marker = L.marker([lat, lon]).addTo(map);
            marker.bindPopup(location.display_name).openPopup();
            markers.push(marker);

            // Load location info
            loadLocationInfo(lat, lon, location.display_name);
        } else {
            alert('Location not found. Please try a different search term.');
        }
    } catch (error) {
        console.error('Search error:', error);
        alert('Error performing search. Please try again.');
    } finally {
        showLoading(false);
    }
}

// =====================================================
// Map Click Handler
// =====================================================
async function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Add marker
    clearMarkers();
    const marker = L.marker([lat, lon]).addTo(map);
    markers.push(marker);

    // Load location info
    await loadLocationInfo(lat, lon);
}

// =====================================================
// Load Location Information
// =====================================================
async function loadLocationInfo(lat, lon, placeName = null) {
    currentLocation = { lat, lon, placeName };
    
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelContent = document.getElementById('infoPanelContent');
    
    infoPanel.style.display = 'block';
    infoPanelContent.innerHTML = '<div class="loading">Analyzing location...</div>';

    try {
        // Reverse geocoding if no place name
        if (!placeName) {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const geoData = await geoResponse.json();
            placeName = geoData.display_name || 'Unknown Location';
        }

        // Generate comprehensive location analysis
        const analysis = await analyzeLocation(lat, lon, placeName);
        
        infoPanelContent.innerHTML = analysis;

    } catch (error) {
        console.error('Error loading location info:', error);
        infoPanelContent.innerHTML = '<p class="placeholder-text">Error loading location information</p>';
    }
}

// =====================================================
// Analyze Location (Simulated AI Analysis)
// =====================================================
async function analyzeLocation(lat, lon, placeName) {
    // This simulates comprehensive location analysis
    // In production, this would integrate with real APIs and AI services
    
    const locationData = {
        name: placeName,
        coordinates: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
        population: estimatePopulation(placeName),
        hazards: identifyHazards(lat, lon),
        infrastructure: 'Moderate',
        resilience: calculateResilience(lat, lon)
    };

    return `
        <div class="location-header">
            <h3 class="location-title">${locationData.name}</h3>
            <p class="location-subtitle">${locationData.coordinates}</p>
        </div>

        <div class="info-section">
            <h3>Demographics</h3>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Population</div>
                    <div class="info-value">${locationData.population}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Infrastructure</div>
                    <div class="info-value">${locationData.infrastructure}</div>
                </div>
            </div>
        </div>

        <div class="info-section">
            <h3>Hazard Assessment</h3>
            <div class="hazard-list">
                ${locationData.hazards.map(hazard => `
                    <div class="hazard-item">
                        <span class="hazard-name">${hazard.name}</span>
                        <span class="hazard-badge ${hazard.level}">${hazard.level.toUpperCase()}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="info-section">
            <h3>Resilience Score</h3>
            <div class="info-item">
                <div class="info-label">Overall Resilience</div>
                <div class="info-value">${locationData.resilience}/100</div>
            </div>
        </div>

        <div class="info-section">
            <h3>AI Recommendations</h3>
            <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary);">
                Click "Ask AI VISION" to get detailed architectural solutions, 
                risk mitigation strategies, and infrastructure recommendations for this location.
            </p>
        </div>
    `;
}

// =====================================================
// Hazard Identification
// =====================================================
function identifyHazards(lat, lon) {
    const hazards = [];
    
    // Philippines-specific hazard zones (simplified)
    // In production, this would use real hazard data
    
    // Earthquake risk (higher near fault lines)
    if (Math.abs(lat - 14.5995) < 2 || Math.abs(lat - 10.3157) < 2) {
        hazards.push({ name: 'Earthquake', level: 'high' });
    } else {
        hazards.push({ name: 'Earthquake', level: 'moderate' });
    }
    
    // Typhoon risk (coastal areas)
    if (lon > 121 && lon < 126) {
        hazards.push({ name: 'Typhoon', level: 'high' });
    } else {
        hazards.push({ name: 'Typhoon', level: 'moderate' });
    }
    
    // Flooding risk
    if (lat < 15 && lat > 10) {
        hazards.push({ name: 'Flooding', level: 'moderate' });
    } else {
        hazards.push({ name: 'Flooding', level: 'low' });
    }
    
    // Tsunami risk (coastal)
    const isCoastal = Math.random() > 0.5; // Simplified
    if (isCoastal) {
        hazards.push({ name: 'Tsunami', level: 'moderate' });
    }
    
    // Landslide risk (mountainous areas)
    if (lat > 16 || (lat > 6 && lat < 10)) {
        hazards.push({ name: 'Landslide', level: 'moderate' });
    }

    return hazards;
}

// =====================================================
// Load Hazard Zones
// =====================================================
function loadHazardZones() {
    // Add sample hazard zones (circles)
    // In production, this would load real hazard polygon data
    
    const hazardZones = [
        { lat: 14.5995, lon: 120.9842, radius: 50000, level: 'high', name: 'Metro Manila Earthquake Zone' },
        { lat: 13.4145, lon: 123.4135, radius: 40000, level: 'high', name: 'Bicol Volcanic Zone' },
        { lat: 10.3157, lon: 123.8854, radius: 35000, level: 'moderate', name: 'Cebu Fault Line' },
        { lat: 7.0731, lon: 125.6128, radius: 30000, level: 'moderate', name: 'Davao Seismic Zone' }
    ];

    hazardZones.forEach(zone => {
        const color = zone.level === 'high' ? '#d9534f' : 
                     zone.level === 'moderate' ? '#f0ad4e' : '#5cb85c';
        
        L.circle([zone.lat, zone.lon], {
            radius: zone.radius,
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2
        }).addTo(hazardLayer).bindPopup(`<strong>${zone.name}</strong><br>Risk Level: ${zone.level.toUpperCase()}`);
    });
}

// =====================================================
// Load Active Hazards
// =====================================================
async function loadActiveHazards() {
    const disasterList = document.getElementById('disasterList');
    disasterList.innerHTML = '<div class="loading">Loading active hazards...</div>';

    // Simulate loading active disasters
    // In production, this would fetch from PHIVOLCS, PAGASA APIs
    setTimeout(() => {
        const hazards = [
            {
                type: 'Volcano',
                name: 'Mayon Volcano',
                status: 'Alert Level 2',
                location: 'Albay',
                distance: '245 km',
                magnitude: 'N/A',
                updated: 'Feb 6, 2026 10:30 AM'
            },
            {
                type: 'Earthquake',
                name: 'Recent Seismic Activity',
                status: 'Magnitude 4.2',
                location: 'Mindoro',
                distance: '180 km',
                magnitude: '4.2',
                updated: 'Feb 6, 2026 08:15 AM'
            },
            {
                type: 'Typhoon',
                name: 'Tropical Depression',
                status: 'Signal No. 1',
                location: 'Eastern Visayas',
                distance: '320 km',
                magnitude: 'N/A',
                updated: 'Feb 6, 2026 06:00 AM'
            }
        ];

        disasterList.innerHTML = hazards.map(hazard => `
            <div class="disaster-item">
                <div class="disaster-header">
                    <div class="disaster-title">${hazard.name}</div>
                    <div class="disaster-badge" style="background-color: rgba(217, 83, 79, 0.2); color: #d9534f; border: 1px solid #d9534f;">
                        ${hazard.type}
                    </div>
                </div>
                <div class="disaster-info">
                    <p><strong>Status:</strong> ${hazard.status}</p>
                    <p><strong>Location:</strong> ${hazard.location}</p>
                    <p><strong>Distance:</strong> ${hazard.distance}</p>
                    ${hazard.magnitude !== 'N/A' ? `<p><strong>Magnitude:</strong> ${hazard.magnitude}</p>` : ''}
                    <p><strong>Updated:</strong> ${hazard.updated}</p>
                </div>
            </div>
        `).join('');
    }, 1000);
}

// =====================================================
// 3D View Toggle
// =====================================================
function toggle3DView() {
    const btn = document.getElementById('toggle3D');
    
    if (!is3DMode) {
        // Enable 3D mode
        if (!osmb) {
            osmb = new OSMBuildings(map).load();
        }
        btn.classList.add('active');
        is3DMode = true;
    } else {
        // Disable 3D mode
        if (osmb) {
            map.removeLayer(osmb);
            osmb = null;
        }
        btn.classList.remove('active');
        is3DMode = false;
    }
}

// =====================================================
// Satellite Toggle
// =====================================================
let satelliteLayer = null;
function toggleSatellite() {
    const btn = document.getElementById('toggleSatellite');
    
    if (!satelliteLayer) {
        // Add satellite layer
        satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(map);
        btn.classList.add('active');
    } else {
        // Remove satellite layer
        map.removeLayer(satelliteLayer);
        satelliteLayer = null;
        btn.classList.remove('active');
    }
}

// =====================================================
// Hazards Toggle
// =====================================================
function toggleHazards() {
    const btn = document.getElementById('toggleHazards');
    const legend = document.getElementById('hazardLegend');
    
    if (map.hasLayer(hazardLayer)) {
        map.removeLayer(hazardLayer);
        btn.classList.remove('active');
        legend.style.display = 'none';
    } else {
        map.addLayer(hazardLayer);
        btn.classList.add('active');
        legend.style.display = 'block';
    }
}

// =====================================================
// Chat Functionality
// =====================================================
async function sendChatMessage(isModal = false) {
    const inputId = isModal ? 'modalChatInput' : 'chatInput';
    const messagesId = isModal ? 'modalChatMessages' : 'chatMessages';
    
    const input = document.getElementById(inputId);
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addChatMessage('user', message, isModal);
    input.value = '';

    // Generate AI response
    const aiResponse = await generateAIResponse(message);
    addChatMessage('ai', aiResponse, isModal);
}

// =====================================================
// Add Chat Message
// =====================================================
function addChatMessage(type, content, isModal = false) {
    const messagesContainer = document.getElementById(isModal ? 'modalChatMessages' : 'chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'ai' ? 'ai-message' : 'user-message';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${type === 'ai' ? 'AI' : 'U'}</div>
        <div class="message-content">
            <p>${content}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store in chat history
    chatMessages.push({ type, content });
}

// =====================================================
// Generate AI Response
// =====================================================
async function generateAIResponse(userMessage) {
    // Simulated AI responses based on common queries
    // In production, this would integrate with Claude API or similar
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Population queries
    if (lowerMessage.includes('population') || lowerMessage.includes('people') || lowerMessage.includes('ppl')) {
        if (currentLocation) {
            return `Based on available data, the estimated population in ${currentLocation.placeName || 'this area'} is approximately ${estimatePopulation(currentLocation.placeName)}. This is an estimate based on regional census data and recent demographic trends.`;
        }
        return "To provide population data, please click on a specific location on the map first.";
    }
    
    // Hazard queries
    if (lowerMessage.includes('hazard') || lowerMessage.includes('risk') || lowerMessage.includes('danger') || lowerMessage.includes('safe')) {
        if (currentLocation) {
            const hazards = identifyHazards(currentLocation.lat, currentLocation.lon);
            const hazardList = hazards.map(h => `${h.name} (${h.level} risk)`).join(', ');
            return `The primary hazards identified for this location include: ${hazardList}. I recommend implementing structural reinforcements, early warning systems, and community preparedness programs. Would you like detailed architectural solutions for specific hazards?`;
        }
        return "Please select a location on the map to analyze hazard risks.";
    }
    
    // Solution queries
    if (lowerMessage.includes('solution') || lowerMessage.includes('fix') || lowerMessage.includes('improve') || lowerMessage.includes('help')) {
        if (currentLocation) {
            return `For ${currentLocation.placeName || 'this location'}, I recommend the following solutions:\n\n1. **Flood Mitigation**: Install improved drainage systems with 2.5m deep channels, capacity for 150mm/hour rainfall\n\n2. **Earthquake Resilience**: Retrofit critical buildings with base isolation systems, estimated cost ₱2.5M per structure\n\n3. **Evacuation Infrastructure**: Establish 3 evacuation centers within 500m radius, capacity 500 people each\n\n4. **Early Warning System**: Deploy IoT sensors for real-time monitoring, estimated setup ₱850K\n\nWould you like 3D architectural mockups for any of these solutions?`;
        }
        return "Please select a specific location to receive tailored solutions.";
    }
    
    // Weather queries
    if (lowerMessage.includes('weather') || lowerMessage.includes('forecast') || lowerMessage.includes('rain') || lowerMessage.includes('typhoon')) {
        return `Current weather conditions:\n- Temperature: 28°C\n- Humidity: 75%\n- Wind: 15 km/h NE\n- Conditions: Partly cloudy\n\n7-Day Forecast: Mixed conditions with possible rain showers on Feb 8-9. No tropical cyclones currently threatening the area.\n\nWould you like detailed impact analysis on local infrastructure?`;
    }
    
    // Volcano queries
    if (lowerMessage.includes('volcano') || lowerMessage.includes('eruption') || lowerMessage.includes('mayon') || lowerMessage.includes('taal')) {
        return `Active Volcano Status:\n\n**Mayon Volcano**: Alert Level 2 (Increasing unrest)\n- Distance from you: ~245 km\n- Last activity: Minor ash emission Feb 4, 2026\n- Danger zone: 6km radius\n\n**Taal Volcano**: Alert Level 1 (Abnormal)\n- Distance from you: ~180 km\n- Last activity: Phreatic eruption Jan 2026\n- Danger zone: Crater area\n\nRecommendations: Monitor PHIVOLCS bulletins, prepare evacuation plans for communities within 10km.`;
    }
    
    // Earthquake queries
    if (lowerMessage.includes('earthquake') || lowerMessage.includes('seismic') || lowerMessage.includes('quake')) {
        return `Recent Seismic Activity:\n\n**Latest Event**: Magnitude 4.2\n- Location: 15km NE of Mindoro\n- Depth: 10km\n- Time: Feb 6, 2026 08:15 AM\n- Intensity: III (Weak)\n\n**Fault Lines Nearby**:\n- West Valley Fault: 35km\n- East Valley Fault: 42km\n- Marikina Fault: 28km\n\nRisk Assessment: Moderate seismic risk. Buildings should comply with NSCP 2015 earthquake-resistant standards.`;
    }
    
    // Default response
    return `I'm AI VISION, your intelligent spatial analysis assistant. I can help you with:\n\n• Population and demographic data\n• Hazard and risk assessments\n• Infrastructure solutions and recommendations\n• Weather forecasts and disaster monitoring\n• Volcanic and seismic activity tracking\n• 3D architectural planning\n\nClick anywhere on the map or ask me a specific question about any location in the Philippines!`;
}

// =====================================================
// Image Upload Handler
// =====================================================
function handleImageUpload(event, isModal = false) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        
        // Add image message
        const messagesContainer = document.getElementById(isModal ? 'modalChatMessages' : 'chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">U</div>
            <div class="message-content">
                <img src="${imageData}" class="message-image" alt="Uploaded image">
                <p>Analyzing image...</p>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Simulate image analysis
        setTimeout(() => {
            const analysis = "Based on the image analysis, this appears to be an urban area with mixed residential and commercial development. Structural analysis indicates standard concrete construction. I've identified potential drainage issues and recommend installing retention basins. Coordinates estimated at approximately 14.5995°N, 120.9842°E (Metro Manila area). Would you like detailed infrastructure recommendations?";
            addChatMessage('ai', analysis, isModal);
        }, 2000);
    };
    reader.readAsDataURL(file);
}

// =====================================================
// Full Screen Chat
// =====================================================
function openFullScreenChat() {
    const modal = document.getElementById('aiModal');
    const modalMessages = document.getElementById('modalChatMessages');
    
    // Copy messages to modal
    modalMessages.innerHTML = document.getElementById('chatMessages').innerHTML;
    
    modal.classList.add('active');
}

function closeFullScreenChat() {
    const modal = document.getElementById('aiModal');
    modal.classList.remove('active');
    
    // Sync messages back
    document.getElementById('chatMessages').innerHTML = document.getElementById('modalChatMessages').innerHTML;
}

// =====================================================
// Utility Functions
// =====================================================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

function estimatePopulation(placeName) {
    if (!placeName) return 'Unknown';
    
    // Simplified population estimates
    const lower = placeName.toLowerCase();
    if (lower.includes('metro manila') || lower.includes('manila')) return '~13.5M';
    if (lower.includes('quezon city')) return '~2.9M';
    if (lower.includes('cebu')) return '~950K';
    if (lower.includes('davao')) return '~1.6M';
    if (lower.includes('camarines')) return '~580K';
    
    // Random estimate for other locations
    const estimates = ['50K-100K', '100K-250K', '250K-500K', '20K-50K'];
    return estimates[Math.floor(Math.random() * estimates.length)];
}

function calculateResilience(lat, lon) {
    // Simplified resilience calculation
    const hazards = identifyHazards(lat, lon);
    const highRiskCount = hazards.filter(h => h.level === 'high').length;
    const moderateRiskCount = hazards.filter(h => h.level === 'moderate').length;
    
    let score = 100;
    score -= (highRiskCount * 20);
    score -= (moderateRiskCount * 10);
    
    return Math.max(30, Math.min(100, score));
}

function showWelcomeMessage() {
    // Show initial welcome in chat
    setTimeout(() => {
        const aiChatPanel = document.getElementById('aiChatPanel');
        aiChatPanel.style.display = 'flex';
    }, 500);
}

// =====================================================
// Console Welcome
// =====================================================
console.log('%c GeoVision ', 'background: #4a90e2; color: white; font-size: 20px; padding: 10px;');
console.log('%c Professional Spatial Analysis Platform ', 'font-size: 12px; color: #5c9aa8;');
console.log('%c Powered by AI VISION ', 'font-size: 12px; color: #b8bdc4;');
