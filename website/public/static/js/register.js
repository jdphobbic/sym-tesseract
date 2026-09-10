// TESSERACT '26 EVENTS EXPLORER & GUIDELINES CONTROLLER

let state = {
    events: [],
    filteredCategory: 'ALL',
    searchQuery: '',
    selectedEvent: null
};

let currentGalleryEvent = null;
let currentGalleryIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    
    // Check URL parameters for pre-selected event
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedEventId = urlParams.get('event');
    if (preSelectedEventId) {
        state.preSelectedEventId = preSelectedEventId;
    }
});

function loadEvents() {
    fetch('/api/events')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.events) {
                state.events = data.events;
                renderEvents();

                if (state.preSelectedEventId) {
                    const target = state.events.find(e => e.id === state.preSelectedEventId);
                    if (target) {
                        openEventPostersGallery(target.id);
                    }
                }
            }
        })
        .catch(err => {
            console.error('Error loading events:', err);
            document.getElementById('events-selection-grid').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--accent-rose); padding: 3rem;">
                    Failed to load events. Please refresh the page.
                </div>
            `;
        });
}

function filterCategory(category) {
    state.filteredCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });
    renderEvents();
}

function handleEventSearch(query) {
    state.searchQuery = query.toLowerCase().trim();
    renderEvents();
}

function renderEvents() {
    const grid = document.getElementById('events-selection-grid');
    grid.innerHTML = '';

    const filtered = state.events.filter(evt => {
        const matchesCategory = state.filteredCategory === 'ALL' || evt.category === state.filteredCategory;
        const matchesSearch = !state.searchQuery || 
                              evt.title.toLowerCase().includes(state.searchQuery) ||
                              evt.venue.toLowerCase().includes(state.searchQuery) ||
                              (evt.description && evt.description.toLowerCase().includes(state.searchQuery));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 4rem;">
                No events found matching your search criteria.
            </div>
        `;
        return;
    }

    let previousCategory = '';
    filtered.forEach(evt => {
        if (evt.category !== previousCategory) {
            const categoryHeading = document.createElement('div');
            categoryHeading.className = 'event-category-heading';
            categoryHeading.innerHTML = `<span class="mono-tag">${evt.category}</span>`;
            grid.appendChild(categoryHeading);
            previousCategory = evt.category;
        }

        const prizesHtml = renderPrizeMarkup(evt.prizes);
        const posterList = (evt.poster_urls && evt.poster_urls.length > 0) ? evt.poster_urls : (evt.poster_url ? [evt.poster_url] : []);
        
        let posterHtml = '';
        if (posterList.length > 0) {
            const primaryPoster = posterList[0];
            const countBadge = posterList.length > 1
                ? `<span style="position: absolute; top: 8px; left: 8px; background: rgba(0, 243, 255, 0.95); color: #050813; font-weight: 800; font-size: 0.68rem; padding: 2px 7px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">📸 ${posterList.length} POSTERS</span>`
                : '';

            posterHtml = `
                <div style="margin-bottom: 0.75rem; border-radius: var(--radius-sm); overflow: hidden; max-height: 180px; border: 1px solid var(--border-cyan); position: relative; background: #000; cursor: pointer;" onclick="openEventPostersGallery('${evt.id}')">
                    <img src="${encodeURI(primaryPoster)}" alt="${evt.title} Poster" style="width: 100%; height: 180px; object-fit: cover; display: block;">
                    ${countBadge}
                    <button type="button" class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openEventPostersGallery('${evt.id}')" style="position: absolute; bottom: 8px; right: 8px; font-size: 0.7rem; padding: 3px 8px; background: rgba(5,8,19,0.88);">
                        🖼️ View Poster (${posterList.length})
                    </button>
                </div>
            `;
        }

        const descText = evt.description ? `<p style="font-size: 0.88rem; color: #cbd5e1; margin: 0.6rem 0; line-height: 1.45;">${evt.description}</p>` : '';

        const card = document.createElement('div');
        card.className = 'event-card';

        card.innerHTML = `
            <div>
                ${posterHtml}
                <div class="event-category-tag">${evt.category}</div>
                <div class="event-title">${evt.title}</div>
                <div class="event-venue">📍 ${evt.venue} &bull; 👥 Max ${evt.max_team_size || 4} Members</div>
                ${descText}
                <div class="event-prizes" style="margin-top: 0.75rem;">
                    <div class="prize-title">Prizes / Category</div>
                    <div class="prize-list">${prizesHtml}</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 1.25rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="openEventPostersGallery('${evt.id}')" style="width: 100%; font-size: 0.8rem; padding: 0.55rem;">
                    📜 View Full Guidelines & Posters
                </button>
                <a href="https://forms.gle/1vzAsMQD7SyqTis87" target="_blank" rel="noopener noreferrer" class="btn-cyan-solid" style="width: 100%; font-size: 0.85rem; padding: 0.65rem; text-align: center; display: block; font-weight: 700;">
                    REGISTER IN GOOGLE FORM ↗
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderPrizeMarkup(prizes) {
    const groups = [];
    prizes.forEach(prize => {
        const separatorIndex = prize.rank.indexOf(' - ');
        const groupName = separatorIndex > -1 ? prize.rank.slice(0, separatorIndex) : '';
        const rank = separatorIndex > -1 ? prize.rank.slice(separatorIndex + 3) : prize.rank;
        let group = groups.find(item => item.name === groupName);
        if (!group) {
            group = { name: groupName, prizes: [] };
            groups.push(group);
        }
        group.prizes.push({ rank, amount: prize.amount });
    });

    return groups.map(group => `
        ${group.name ? `<div class="prize-group-heading">${group.name}</div>` : ''}
        <div class="prize-list">
            ${group.prizes.map(prize => {
                const icon = prize.rank.toLowerCase().includes('1st') ? '🥇' : (prize.rank.toLowerCase().includes('2nd') || prize.rank.toLowerCase().includes('runner') ? '🥈' : '🏆');
                return `<span class="prize-badge"><span class="prize-rank">${icon} ${prize.rank}</span><span class="prize-amount">${prize.amount}</span></span>`;
            }).join('')}
        </div>
    `).join('');
}

function openEventPostersGallery(eventId) {
    const evt = state.events.find(e => e.id === eventId);
    if (!evt) return;
    
    currentGalleryEvent = evt;
    currentGalleryIndex = 0;
    renderGalleryModal();
}

function renderGalleryModal() {
    let modal = document.getElementById('poster-gallery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'poster-gallery-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.92)';
        modal.style.backdropFilter = 'blur(12px)';
        modal.style.zIndex = '3000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.padding = '1rem';
        modal.onclick = closeGalleryModal;
        document.body.appendChild(modal);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const m = document.getElementById('poster-gallery-modal');
            if (m && m.style.display !== 'none' && currentGalleryEvent) {
                if (e.key === 'ArrowRight') nextGalleryPoster();
                if (e.key === 'ArrowLeft') prevGalleryPoster();
                if (e.key === 'Escape') closeGalleryModal();
            }
        });
    }

    const evt = currentGalleryEvent;
    if (!evt) return;

    const posters = (evt.poster_urls && evt.poster_urls.length > 0) ? evt.poster_urls : (evt.poster_url ? [evt.poster_url] : []);
    const total = posters.length;
    const currentSrc = total > 0 ? posters[currentGalleryIndex] : null;
    const prizesHtml = renderPrizeMarkup(evt.prizes);

    let postersGalleryHtml = '';
    if (total > 0) {
        postersGalleryHtml = `
            <div style="position: relative; display: flex; justify-content: center; align-items: center; min-height: 280px; background: rgba(0,0,0,0.6); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; margin-bottom: 1rem;">
                ${total > 1 ? `
                    <button type="button" onclick="prevGalleryPoster()" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); background: rgba(5,8,19,0.85); color: var(--primary-cyan); border: 1px solid var(--primary-cyan); border-radius: 50%; width: 44px; height: 44px; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        &#10094;
                    </button>
                    <button type="button" onclick="nextGalleryPoster()" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: rgba(5,8,19,0.85); color: var(--primary-cyan); border: 1px solid var(--primary-cyan); border-radius: 50%; width: 44px; height: 44px; font-size: 1.3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        &#10095;
                    </button>
                ` : ''}

                <img src="${encodeURI(currentSrc)}" alt="${evt.title} Poster ${currentGalleryIndex + 1}" style="max-width: 100%; max-height: 52vh; object-fit: contain; display: block; border-radius: 4px;">
            </div>

            ${total > 1 ? `
                <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 1.25rem;">
                    ${posters.map((p, idx) => `
                        <div onclick="setGalleryIndex(${idx})" style="cursor: pointer; width: 55px; height: 55px; border-radius: 4px; overflow: hidden; border: 2px solid ${idx === currentGalleryIndex ? 'var(--primary-cyan)' : 'rgba(255,255,255,0.25)'}; opacity: ${idx === currentGalleryIndex ? '1' : '0.55'};">
                            <img src="${encodeURI(p)}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    modal.innerHTML = `
        <div class="glass-card" onclick="event.stopPropagation()" style="max-width: 800px; width: 100%; max-height: 94vh; overflow-y: auto; text-align: left; border-color: var(--primary-cyan); padding: 1.8rem; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                <div>
                    <span class="event-category-tag">${evt.category}</span>
                    <h2 style="color: #fff; font-family: var(--font-heading); font-size: 1.8rem; margin-top: 4px;">${evt.title}</h2>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">📍 Venue: <strong>${evt.venue}</strong> &nbsp;|&nbsp; 👥 Max Team: <strong>${evt.max_team_size || 4} Members</strong></span>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="closeGalleryModal()" style="font-size: 1rem; padding: 4px 10px;">✕ Close</button>
            </div>

            ${postersGalleryHtml}

            <div class="review-section" style="margin-bottom: 1rem;">
                <div class="review-section-title">WHAT YOU NEED TO DO / DESCRIPTION</div>
                <p style="color: #e2e8f0; font-size: 0.95rem; line-height: 1.6; margin-top: 6px;">
                    ${evt.description || 'Participate and demonstrate your skills in this symposium event.'}
                </p>
            </div>

            ${evt.rules ? `
                <div class="review-section" style="margin-bottom: 1rem;">
                    <div class="review-section-title">RULES & GUIDELINES</div>
                    <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-top: 6px;">
                        ${evt.rules}
                    </p>
                </div>
            ` : ''}

            <div class="review-section" style="margin-bottom: 1.5rem;">
                <div class="review-section-title">PRIZES & RECOGNITION</div>
                <div style="margin-top: 8px;">${prizesHtml}</div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                <button type="button" class="btn btn-secondary" onclick="closeGalleryModal()">
                    &larr; Back to Events
                </button>
                <a href="https://forms.gle/1vzAsMQD7SyqTis87" target="_blank" rel="noopener noreferrer" class="btn-cyan-solid" style="font-size: 1rem; padding: 0.8rem 2rem; font-weight: 700;">
                    REGISTER IN GOOGLE FORM ↗
                </a>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function closeGalleryModal() {
    const modal = document.getElementById('poster-gallery-modal');
    if (modal) modal.style.display = 'none';
}

function prevGalleryPoster() {
    if (!currentGalleryEvent) return;
    const posters = (currentGalleryEvent.poster_urls && currentGalleryEvent.poster_urls.length > 0) ? currentGalleryEvent.poster_urls : [currentGalleryEvent.poster_url];
    currentGalleryIndex = (currentGalleryIndex - 1 + posters.length) % posters.length;
    renderGalleryModal();
}

function nextGalleryPoster() {
    if (!currentGalleryEvent) return;
    const posters = (currentGalleryEvent.poster_urls && currentGalleryEvent.poster_urls.length > 0) ? currentGalleryEvent.poster_urls : [currentGalleryEvent.poster_url];
    currentGalleryIndex = (currentGalleryIndex + 1) % posters.length;
    renderGalleryModal();
}

function setGalleryIndex(idx) {
    currentGalleryIndex = idx;
    renderGalleryModal();
}
