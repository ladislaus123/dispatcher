// Configuration
let API_BASE = 'http://localhost:3000/api';
let BACKEND_URL = 'http://localhost:3000';

// State
let currentCampaignId = null;

// DOM Elements
const campaignForm = document.getElementById('campaignForm');
const messagesContainer = document.getElementById('messagesContainer');
const contactsContainer = document.getElementById('contactsContainer');
const addMessageBtn = document.getElementById('addMessageBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const createStatus = document.getElementById('createStatus');
const csvFileInput = document.getElementById('csvFileInput');
const fileLabel = document.querySelector('.file-label');
const sessionInput = document.getElementById('sessionInput');
const backendUrlInput = document.getElementById('backendUrlInput');

// State for contacts
let uploadedContacts = [];
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const campaignsList = document.getElementById('campaignsList');
const refreshCampaignsBtn = document.getElementById('refreshCampaignsBtn');
const workersList = document.getElementById('workersList');
const refreshQueueBtn = document.getElementById('refreshQueueBtn');
const stopAllWorkersBtn = document.getElementById('stopAllWorkersBtn');
const campaignModal = document.getElementById('campaignModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.querySelector('.modal-close');
const executeCampaignBtn = document.getElementById('executeCampaignBtn');
const stopCampaignBtn = document.getElementById('stopCampaignBtn');
const closeCampaignModalBtn = document.getElementById('closeCampaignModalBtn');
const exportCampaignBtn = document.getElementById('exportCampaignBtn');
const deleteCampaignBtn = document.getElementById('deleteCampaignBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load backend URL from localStorage or use default
    const savedUrl = localStorage.getItem('turbozap_backend_url');
    if (savedUrl) {
        backendUrlInput.value = savedUrl;
        BACKEND_URL = savedUrl;
        API_BASE = savedUrl + '/api';
    }

    initializeEventListeners();
    addMessage(); // Add one empty message field by default
});

// Event Listeners
function initializeEventListeners() {
    // Backend URL input handler
    backendUrlInput.addEventListener('change', (e) => {
        const url = e.target.value.trim();
        if (url) {
            // Remove trailing slash if present
            BACKEND_URL = url.replace(/\/$/, '');
            API_BASE = BACKEND_URL + '/api';
            localStorage.setItem('turbozap_backend_url', BACKEND_URL);
            showStatus(`Backend URL updated to: ${BACKEND_URL}`, 'success');
        }
    });

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Form events
    addMessageBtn.addEventListener('click', addMessage);
    resetFormBtn.addEventListener('click', resetForm);
    campaignForm.addEventListener('submit', submitCampaign);

    // CSV file upload
    csvFileInput.addEventListener('change', handleCSVUpload);
    fileLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileLabel.classList.add('dragover');
    });
    fileLabel.addEventListener('dragleave', () => {
        fileLabel.classList.remove('dragover');
    });
    fileLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        fileLabel.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            csvFileInput.files = files;
            handleCSVUpload();
        }
    });

    // Campaigns list
    refreshCampaignsBtn.addEventListener('click', loadCampaigns);

    // Queue status
    refreshQueueBtn.addEventListener('click', loadQueueStatus);
    stopAllWorkersBtn.addEventListener('click', stopAllWorkers);

    // Modal
    modalClose.addEventListener('click', closeModal);
    closeCampaignModalBtn.addEventListener('click', closeModal);
    campaignModal.addEventListener('click', (e) => {
        if (e.target === campaignModal) closeModal();
    });

    // Modal actions
    executeCampaignBtn.addEventListener('click', executeCampaign);
    stopCampaignBtn.addEventListener('click', stopCampaign);
    exportCampaignBtn.addEventListener('click', exportCampaignPDF);
    deleteCampaignBtn.addEventListener('click', deleteCampaign);
}

// Tab Management
function switchTab(tabName) {
    // Hide all tabs
    tabContents.forEach(content => content.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');

    // Load data for specific tabs
    if (tabName === 'campaigns-list') {
        loadCampaigns();
    } else if (tabName === 'queue-status') {
        loadQueueStatus();
    }
}

// CSV Upload Handler
function handleCSVUpload(e) {
    const file = csvFileInput.files[0];

    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        alert('Please upload a valid CSV file');
        csvFileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csv = event.target.result;
            const lines = csv.trim().split('\n');
            uploadedContacts = [];

            // Parse CSV - handle both with and without header
            lines.forEach((line, index) => {
                const phone = line.trim().replace(/^["']|["']$/g, ''); // Remove quotes
                if (phone && /\d/.test(phone)) { // Must contain at least one digit
                    uploadedContacts.push(phone);
                }
            });

            if (uploadedContacts.length === 0) {
                alert('No valid phone numbers found in CSV');
                csvFileInput.value = '';
                return;
            }

            displayUploadedContacts();
            showStatus(`Loaded ${uploadedContacts.length} contacts from CSV`, 'success');
        } catch (error) {
            alert(`Error parsing CSV: ${error.message}`);
            csvFileInput.value = '';
        }
    };

    reader.readAsText(file);
}

function displayUploadedContacts() {
    contactsContainer.innerHTML = '';

    if (uploadedContacts.length === 0) return;

    // Add header
    const header = document.createElement('div');
    header.className = 'contacts-list-header';
    header.innerHTML = `
        <h4>Loaded Contacts (${uploadedContacts.length})</h4>
        <button type="button" class="clear-contacts-btn" onclick="clearContacts()">Clear</button>
    `;
    contactsContainer.appendChild(header);

    // Display contacts as read-only
    uploadedContacts.forEach((contact) => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        contactCard.innerHTML = `
            <span class="contact-number">📱 ${contact}</span>
            <button type="button" class="remove-btn" onclick="removeContact('${contact}')">Remove</button>
        `;
        contactsContainer.appendChild(contactCard);
    });
}

function removeContact(contact) {
    uploadedContacts = uploadedContacts.filter(c => c !== contact);
    displayUploadedContacts();
}

function clearContacts() {
    uploadedContacts = [];
    csvFileInput.value = '';
    contactsContainer.innerHTML = '';
}

// Message Management
function addMessage() {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageCard = document.createElement('div');
    messageCard.className = 'message-card';
    messageCard.id = messageId;
    messageCard.innerHTML = `
        <div class="message-header">
            <h4>Message</h4>
            <button type="button" class="remove-btn" onclick="this.closest('.message-card').remove()">Remove</button>
        </div>

        <div class="message-type-selector">
            <label>Message Type:</label>
            <select class="message-type" onchange="updateAllVariations(this)">
                <option value="text">Text</option>
                <option value="photo">Photo</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
            </select>
        </div>

        <div class="variations-section">
            <div class="variations-header">
                <h5>Variations (randomly selected per contact)</h5>
                <button type="button" class="btn btn-small" onclick="addVariation(this)">+ Add Variation</button>
            </div>
            <div class="variations-container">
                <!-- Variations will be added here -->
            </div>
        </div>
    `;
    messagesContainer.appendChild(messageCard);

    // Add the first variation by default
    addVariation(messageCard.querySelector('.btn.btn-small'));
}

function addVariation(button) {
    const messageCard = button.closest('.message-card');
    const variationsContainer = messageCard.querySelector('.variations-container');
    const messageType = messageCard.querySelector('.message-type').value;
    const variationId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const variationDiv = document.createElement('div');
    variationDiv.className = 'variation-card';
    variationDiv.id = variationId;
    variationDiv.dataset.type = messageType;

    // Build HTML based on message type
    let html = `
        <div class="variation-header">
            <span class="variation-label">Variation ${variationsContainer.children.length + 1}</span>
            <button type="button" class="remove-btn" onclick="this.closest('.variation-card').remove()">Remove</button>
        </div>
        <div class="variation-inputs">
    `;

    if (messageType === 'text') {
        html += `<input type="text" class="variation-content" placeholder="Enter text message" required>`;
    } else {
        html += `
            <div class="file-upload-message">
                <input type="file" class="variation-file-input" style="display: none;">
                <label class="file-label-message">
                    <span class="file-icon-small">📁</span>
                    <span class="file-text-small">Click to upload file</span>
                </label>
                <span class="file-name-display"></span>
            </div>
        `;
        if (messageType === 'photo' || messageType === 'video') {
            html += `<textarea class="variation-caption" placeholder="Caption (optional)"></textarea>`;
        }
    }

    html += `</div>`;
    variationDiv.innerHTML = html;
    variationsContainer.appendChild(variationDiv);

    // Add file input listener if needed
    if (messageType !== 'text') {
        const fileInput = variationDiv.querySelector('.variation-file-input');
        const fileLabel = variationDiv.querySelector('.file-label-message');
        fileLabel.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleVariationFileUpload(e, variationDiv));
    }
}

function updateAllVariations(selectElement) {
    const messageCard = selectElement.closest('.message-card');
    const newType = selectElement.value;
    const variationsContainer = messageCard.querySelector('.variations-container');

    // Clear existing variations and add a fresh one
    variationsContainer.innerHTML = '';
    addVariation(messageCard.querySelector('.btn.btn-small'));
}

function updateMessageCard(selectElement) {
    const card = selectElement.parentElement;
    const contentInput = card.querySelector('.message-content');
    const captionField = card.querySelector('.message-caption');
    const fileUploadDiv = card.querySelector('.file-upload-message');
    const fileInput = card.querySelector('.message-file-input');
    const type = selectElement.value;

    // Reset all fields first
    contentInput.style.display = 'block';
    contentInput.required = true;
    captionField.style.display = 'none';
    fileUploadDiv.style.display = 'none';

    // Update based on type
    switch (type) {
        case 'text':
            contentInput.placeholder = 'Enter text message';
            contentInput.type = 'text';
            break;
        case 'photo':
            contentInput.style.display = 'none';
            contentInput.required = false;
            fileInput.accept = 'image/*';
            fileUploadDiv.style.display = 'block';
            captionField.style.display = 'block';
            break;
        case 'audio':
            contentInput.style.display = 'none';
            contentInput.required = false;
            fileInput.accept = 'audio/*';
            fileUploadDiv.style.display = 'block';
            break;
        case 'video':
            contentInput.style.display = 'none';
            contentInput.required = false;
            fileInput.accept = 'video/*';
            fileUploadDiv.style.display = 'block';
            captionField.style.display = 'block';
            break;
    }
}

async function handleVariationFileUpload(e, variationDiv) {
    const file = e.target.files[0];
    if (!file) return;

    const fileNameDisplay = variationDiv.querySelector('.file-name-display');
    const fileInput = variationDiv.querySelector('.variation-file-input');

    // Show uploading status
    fileNameDisplay.textContent = '⏳ Uploading...';
    fileNameDisplay.style.color = '#999';

    // Read file as base64
    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64String = event.target.result;

        try {
            console.log(`Uploading file: ${file.name}`);

            // Upload file to backend and get URL
            const response = await fetch(`${API_BASE}/campaigns/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base64: base64String,
                    filename: file.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.errors?.join(', ') || 'Failed to upload file');
            }

            // Store the URL in the variation
            variationDiv.dataset.fileContent = data.fileUrl;
            variationDiv.dataset.fileName = file.name;
            variationDiv.dataset.fileType = file.type;

            console.log(`File uploaded successfully. URL: ${data.fileUrl}`);

            // Display file name with success indicator
            fileNameDisplay.textContent = `✓ ${file.name}`;
            fileNameDisplay.style.color = '#25d366';
        } catch (error) {
            console.error(`File upload error:`, error);
            alert(`Error uploading file: ${error.message}`);
            fileInput.value = '';
            fileNameDisplay.textContent = '';
        }
    };

    reader.onerror = () => {
        alert(`Error reading file: ${file.name}`);
        fileInput.value = '';
        fileNameDisplay.textContent = '';
    };

    reader.readAsDataURL(file);
}

// Contact Management
function addContact() {
    const contactCard = document.createElement('div');
    contactCard.className = 'contact-card';
    contactCard.innerHTML = `
        <input type="tel" class="contact-phone" placeholder="Phone number (e.g., 5511999999999)" required>
        <input type="text" class="contact-session" placeholder="Session/Number name (e.g., number_1)" required>
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
    `;
    contactsContainer.appendChild(contactCard);
}

// Form Management
function resetForm() {
    campaignForm.reset();
    messagesContainer.innerHTML = '';
    clearContacts();
    addMessage();
    createStatus.innerHTML = '';
    createStatus.classList.remove('success', 'error');
}

// Submit Campaign
async function submitCampaign(e) {
    e.preventDefault();

    const session = sessionInput.value.trim();

    if (!session) {
        showStatus('Please enter a session/number name', 'error');
        return;
    }

    if (uploadedContacts.length === 0) {
        showStatus('Please upload a CSV file with contacts', 'error');
        return;
    }

    try {
        createStatus.innerHTML = '<div class="spinner"></div>';

        // Get messages with variations
        const messages = getMessagesFromForm();

        if (messages.length === 0) {
            showStatus('Please add at least one message', 'error');
            return;
        }

        // Build contactSessions with all contacts and the same session
        const contactSessions = uploadedContacts.map(contact => ({
            contact,
            session
        }));

        const campaign = {
            messages,
            contactSessions
        };

        console.log('Campaign data:', JSON.stringify(campaign, null, 2));

        const response = await fetch(`${API_BASE}/campaigns/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaign)
        });

        const data = await response.json();

        if (!response.ok) {
            const errors = data.errors ? data.errors.join(', ') : data.message;
            throw new Error(errors);
        }

        showStatus(`Campaign created! ID: ${data.campaignId}`, 'success');
        resetForm();
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

function getMessagesFromForm() {
    const messages = [];
    document.querySelectorAll('.message-card').forEach(card => {
        const type = card.querySelector('.message-type').value;
        const variationsContainer = card.querySelector('.variations-container');
        const variations = [];

        // Get all variations for this message
        variationsContainer.querySelectorAll('.variation-card').forEach(variationCard => {
            let variation = { type };

            if (type === 'text') {
                const content = variationCard.querySelector('.variation-content').value.trim();
                if (!content) {
                    alert('All text variations must have content');
                    throw new Error('Empty text variation');
                }
                variation.content = content;
            } else {
                // Media file
                const fileUrl = variationCard.dataset.fileContent;
                if (!fileUrl) {
                    alert(`Please upload a file for all ${type} variations`);
                    throw new Error(`Missing ${type} file in variation`);
                }
                variation.content = fileUrl;
                variation.filename = variationCard.dataset.fileName || `file.${getFileExtension(variationCard.dataset.fileType)}`;

                // Add caption for photo and video
                if (type === 'photo' || type === 'video') {
                    const caption = variationCard.querySelector('.variation-caption').value.trim();
                    if (caption) variation.caption = caption;
                }
            }

            variations.push(variation);
        });

        if (variations.length === 0) {
            alert('Each message must have at least one variation');
            throw new Error('Message with no variations');
        }

        messages.push({ variations });
    });
    return messages;
}

function getFileExtension(mimeType) {
    const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/wav': 'wav',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
    };
    return mimeToExt[mimeType] || 'bin';
}


// Status Messages
function showStatus(message, type) {
    createStatus.innerHTML = message;
    createStatus.className = `status-message ${type}`;
    createStatus.style.display = 'block';
}

// Campaign Management
async function loadCampaigns() {
    try {
        campaignsList.innerHTML = '<div class="spinner"></div>';
        const response = await fetch(`${API_BASE}/campaigns`);
        const data = await response.json();

        if (!data.success) {
            campaignsList.innerHTML = '<div class="empty-state"><h3>Error loading campaigns</h3></div>';
            return;
        }

        if (data.data.length === 0) {
            campaignsList.innerHTML = '<div class="empty-state"><h3>No campaigns yet</h3><p>Create your first campaign to get started!</p></div>';
            return;
        }

        campaignsList.innerHTML = '';
        data.data.forEach(campaign => {
            const card = createCampaignCard(campaign);
            campaignsList.appendChild(card);
            card.addEventListener('click', () => viewCampaign(campaign.campaignId));
        });
    } catch (error) {
        campaignsList.innerHTML = `<div class="empty-state"><h3>Error: ${error.message}</h3></div>`;
    }
}

function createCampaignCard(campaign) {
    const card = document.createElement('div');
    card.className = 'campaign-card';

    const formattedDate = new Date(campaign.createdAt).toLocaleString();

    card.innerHTML = `
        <h4>${campaign.campaignId.substring(0, 20)}...</h4>
        <div class="detail">
            <span>Status:</span>
            <span class="status-badge ${campaign.status}">${campaign.status}</span>
        </div>
        <div class="detail">
            <span>Messages:</span>
            <span>${campaign.totalMessages}</span>
        </div>
        <div class="detail">
            <span>Contacts:</span>
            <span>${campaign.totalContacts}</span>
        </div>
        <div class="detail">
            <span>Sessions:</span>
            <span>${campaign.totalSessions}</span>
        </div>
        <div class="detail">
            <span>Requests:</span>
            <span>${campaign.totalRequests}</span>
        </div>
        <div class="detail">
            <span>Created:</span>
            <span>${formattedDate}</span>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
            <button class="btn btn-small btn-primary" onclick="viewCampaign('${campaign.campaignId}')">View Details</button>
            <button class="btn btn-small btn-warning" onclick="quickExport('${campaign.campaignId}')">📥 Export</button>
            <button class="btn btn-small btn-danger" onclick="quickDelete('${campaign.campaignId}')">🗑️ Delete</button>
        </div>
    `;

    return card;
}

async function quickExport(campaignId) {
    try {
        console.log(`Quick exporting campaign ${campaignId}`);
        const url = `${API_BASE}/campaigns/${campaignId}/export`;

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `campaign_${campaignId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('PDF report downloaded successfully');
    } catch (error) {
        console.error('Export error:', error);
        alert(`Error exporting campaign: ${error.message}`);
    }
}

async function quickDelete(campaignId) {
    const confirmed = confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.\n\nAll requests will be cleared from the queues.'
    );

    if (!confirmed) return;

    try {
        console.log(`Quick deleting campaign ${campaignId}`);

        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            alert(`Error: ${data.message}`);
            return;
        }

        alert(`Campaign deleted successfully.\n${data.requestsCleared} requests were cleared from queues.`);
        loadCampaigns();
    } catch (error) {
        console.error('Delete error:', error);
        alert(`Error deleting campaign: ${error.message}`);
    }
}

async function viewCampaign(campaignId) {
    try {
        currentCampaignId = campaignId;
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`);
        const data = await response.json();

        if (!data.success) {
            alert('Error loading campaign details');
            return;
        }

        const campaign = data.data;
        const formattedDate = new Date(campaign.createdAt).toLocaleString();

        modalBody.innerHTML = `
            <div class="detail">
                <span><strong>Campaign ID:</strong></span>
                <span>${campaign.campaignId}</span>
            </div>
            <div class="detail">
                <span><strong>Status:</strong></span>
                <span class="status-badge ${campaign.status}">${campaign.status}</span>
            </div>
            <div class="detail">
                <span><strong>Created:</strong></span>
                <span>${formattedDate}</span>
            </div>
            <div class="detail">
                <span><strong>Messages:</strong></span>
                <span>${campaign.totalMessages}</span>
            </div>
            <div class="detail">
                <span><strong>Contacts:</strong></span>
                <span>${campaign.totalContacts}</span>
            </div>
            <div class="detail">
                <span><strong>Sessions:</strong></span>
                <span>${campaign.totalSessions}</span>
            </div>
            <div class="detail">
                <span><strong>Total Requests:</strong></span>
                <span>${campaign.totalRequests}</span>
            </div>
        `;

        campaignModal.classList.add('show');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function executeCampaign() {
    if (!currentCampaignId) return;

    try {
        const response = await fetch(`${API_BASE}/campaigns/${currentCampaignId}/execute`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!data.success) {
            alert(`Error: ${data.message}`);
            return;
        }

        alert(`Campaign execution started!\nWorkers: ${data.workers.length}`);
        closeModal();
        loadCampaigns();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function stopCampaign() {
    if (!currentCampaignId) return;

    if (!confirm('Are you sure you want to stop this campaign?')) return;

    try {
        const response = await fetch(`${API_BASE}/campaigns/${currentCampaignId}/stop`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!data.success) {
            alert(`Error: ${data.message}`);
            return;
        }

        alert('Campaign stopped successfully');
        closeModal();
        loadCampaigns();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function exportCampaignPDF() {
    if (!currentCampaignId) return;

    try {
        console.log(`Exporting campaign ${currentCampaignId}`);
        const url = `${API_BASE}/campaigns/${currentCampaignId}/export`;

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `campaign_${currentCampaignId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('PDF report downloaded successfully');
    } catch (error) {
        console.error('Export error:', error);
        alert(`Error exporting campaign: ${error.message}`);
    }
}

async function deleteCampaign() {
    if (!currentCampaignId) return;

    const confirmed = confirm(
        'Are you sure you want to delete this campaign? This action cannot be undone.\n\nAll requests will be cleared from the queues.'
    );

    if (!confirmed) return;

    try {
        console.log(`Deleting campaign ${currentCampaignId}`);

        const response = await fetch(`${API_BASE}/campaigns/${currentCampaignId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (!data.success) {
            alert(`Error: ${data.message}`);
            return;
        }

        alert(`Campaign deleted successfully.\n${data.requestsCleared} requests were cleared from queues.`);
        closeModal();
        loadCampaigns();
    } catch (error) {
        console.error('Delete error:', error);
        alert(`Error deleting campaign: ${error.message}`);
    }
}

function closeModal() {
    campaignModal.classList.remove('show');
    currentCampaignId = null;
}

// Queue Status
async function loadQueueStatus() {
    try {
        const response = await fetch(`${API_BASE}/campaigns/queue/status`);
        const data = await response.json();

        if (!data.success) {
            workersList.innerHTML = '<div class="empty-state"><h3>Error loading queue status</h3></div>';
            return;
        }

        // Update overall stats
        document.getElementById('statTotalSessions').textContent = data.stats.totalSessions || 0;
        document.getElementById('statActiveSessions').textContent = data.stats.activeSessions || 0;
        document.getElementById('statTotalRequests').textContent = data.stats.totalRequests || 0;
        document.getElementById('statPendingRequests').textContent = data.stats.totalPending || 0;

        // Update workers
        if (!data.workers || data.workers.length === 0) {
            workersList.innerHTML = '<div class="empty-state"><p>No active workers</p></div>';
            return;
        }

        workersList.innerHTML = '';
        data.workers.forEach(worker => {
            if (worker) {
                const workerCard = document.createElement('div');
                workerCard.className = 'worker-card';

                // Calculate progress percentage
                const totalCompleted = worker.completedRequests + worker.failedRequests;
                const progressPercent = worker.totalRequests > 0
                    ? Math.round((totalCompleted / worker.totalRequests) * 100)
                    : 0;

                // Determine status indicator color
                const statusColor = worker.isActive ? '#25d366' : '#999';
                const statusText = worker.isActive ? '🟢 Active' : '⚫ Idle';

                // Build campaigns HTML
                let campaignsHtml = '';
                if (worker.campaigns && worker.campaigns.length > 0) {
                    campaignsHtml = '<div class="campaigns-list">';
                    worker.campaigns.forEach(campaign => {
                        const campaignPercent = campaign.total > 0
                            ? Math.round(((campaign.completed + campaign.failed) / campaign.total) * 100)
                            : 0;

                        campaignsHtml += `
                            <div class="campaign-progress">
                                <div class="campaign-header">
                                    <span class="campaign-id">Campaign ${campaign.campaignId.substring(0, 8)}</span>
                                    <span class="campaign-stats">${campaign.completed}/${campaign.total} sent</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${campaignPercent}%"></div>
                                </div>
                                <div class="campaign-details">
                                    <span class="detail-item completed">✓ ${campaign.completed}</span>
                                    <span class="detail-item failed">✗ ${campaign.failed}</span>
                                    <span class="detail-item pending">⏳ ${campaign.pending}</span>
                                    <span class="detail-item executing">→ ${campaign.executing}</span>
                                </div>
                        `;

                        // Show current message if executing
                        const executingMsg = campaign.messages.find(m => m.status === 'executing');
                        if (executingMsg) {
                            campaignsHtml += `<div class="current-message">Now sending to: ${executingMsg.chatId}</div>`;
                        }

                        // Show failed messages with reasons
                        const failedMsgs = campaign.messages.filter(m => m.status === 'failed');
                        if (failedMsgs.length > 0) {
                            campaignsHtml += '<div class="failed-messages-preview">';
                            failedMsgs.slice(0, 3).forEach(msg => {
                                campaignsHtml += `
                                    <div class="failed-item">
                                        <span class="recipient">${msg.chatId}</span>
                                        <span class="error">${msg.error}</span>
                                    </div>
                                `;
                            });
                            if (failedMsgs.length > 3) {
                                campaignsHtml += `<div class="more-failed">+${failedMsgs.length - 3} more failed</div>`;
                            }
                            campaignsHtml += '</div>';
                        }

                        campaignsHtml += `
                            </div>
                        `;
                    });
                    campaignsHtml += '</div>';
                }

                workerCard.innerHTML = `
                    <div class="worker-header">
                        <div class="worker-title">
                            <span class="status-indicator" style="color: ${statusColor}">${statusText}</span>
                            <h5>Session: ${worker.session}</h5>
                        </div>
                        <div class="worker-summary">
                            <span class="summary-item completed">✓ ${worker.completedRequests}</span>
                            <span class="summary-item failed">✗ ${worker.failedRequests}</span>
                            <span class="summary-item pending">⏳ ${worker.pendingRequests}</span>
                        </div>
                    </div>

                    <div class="worker-progress">
                        <div class="progress-info">
                            <span>Overall Progress: ${totalCompleted}/${worker.totalRequests} (${progressPercent}%)</span>
                        </div>
                        <div class="progress-bar-main">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>

                    ${campaignsHtml}
                `;
                workersList.appendChild(workerCard);
            }
        });
    } catch (error) {
        workersList.innerHTML = `<div class="empty-state"><h3>Error: ${error.message}</h3></div>`;
    }
}

async function stopAllWorkers() {
    if (!confirm('Are you sure you want to stop all workers?')) return;

    try {
        const response = await fetch(`${API_BASE}/campaigns/queue/stop-all`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!data.success) {
            alert(`Error: ${data.message}`);
            return;
        }

        alert('All workers stopped successfully');
        loadQueueStatus();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Auto-refresh queue status every 5 seconds
setInterval(() => {
    const queueTab = document.getElementById('queue-status');
    if (queueTab && queueTab.classList.contains('active')) {
        loadQueueStatus();
    }
}, 5000);
