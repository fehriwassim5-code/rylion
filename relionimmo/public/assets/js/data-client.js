(function () {
  const API_BASE = '/api';
  const statusConfig = {
    featured: { className: 'featured', label: 'En vedette' },
    'for-sale': { className: 'sale', label: 'À vendre' },
    'for-rent': { className: 'rent', label: 'À louer' },
    new: { className: 'new', label: 'Nouvelle annonce' },
    hot: { className: 'hot', label: 'Coup de cœur' },
    'price-drop': { className: 'sale', label: 'Baisse de prix' }
  };

  const fallbackImage = 'assets/img/real-estate/property-exterior-3.webp';

  function primaryStatus(property) {
    return Array.isArray(property.status) && property.status.length ? property.status[0] : null;
  }

  function statusLabel(status) {
    if (!status) return '';
    return statusConfig[status]?.label || status;
  }

  function statusClass(status) {
    if (!status) return 'info';
    return statusConfig[status]?.className || 'info';
  }

  function detailUrl(id) {
    return `property-details.html?id=${encodeURIComponent(id)}`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
  }

  function formatPrice(property) {
    const base = Number(property.price || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
    if (property.listingType === 'rent' && property.paymentTerm) {
      return `${base}/${property.paymentTerm}`;
    }
    return base;
  }

  function renderBadges(property) {
    const statuses = Array.isArray(property.status) ? property.status : [];
    if (!statuses.length) return '';
    return statuses
      .map((status) => {
        const cfg = statusConfig[status] || { className: 'info', label: status };
        return `<span class="status-badge ${cfg.className}">${cfg.label}</span>`;
      })
      .join('');
  }

  function renderPriceBlock(property, wrapperClass = 'property-price') {
    const oldPrice =
      property.previousPrice && property.previousPrice > property.price
        ? `<span class="old-price">${Number(property.previousPrice).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          })}</span>`
        : '';
    return `<div class="${wrapperClass}">${formatPrice(property)} ${oldPrice}</div>`;
  }

  function renderSpecs(property) {
    return `
      <div class="property-specs">
        <span><i class="bi bi-house-door"></i> ${property.bedrooms} ch</span>
        <span><i class="bi bi-droplet"></i> ${property.bathrooms} sdb</span>
        <span><i class="bi bi-arrows-angle-expand"></i> ${formatNumber(property.area)} m²</span>
      </div>
    `;
  }

  function renderMasonryCard(property) {
    const url = detailUrl(property.id);
    const image = property.thumbnail || fallbackImage;
    const galleryCount = (property.images || []).length || 1;

    return `
      <div class="col-lg-4 col-md-6">
        <div class="property-item">
          <a href="${url}" class="property-link">
            <div class="property-image-wrapper">
              <img src="${image}" alt="${property.title}" class="img-fluid">
              <div class="property-status">${renderBadges(property)}</div>
              <div class="property-actions">
                <span class="action-btn gallery-btn" data-toggle="tooltip" title="Galerie">
                  <i class="bi bi-images"></i>
                  <span class="gallery-count">${galleryCount}</span>
                </span>
              </div>
            </div>
          </a>
          <div class="property-details">
            <a href="${url}" class="property-link">
              <div class="property-header">
                ${renderPriceBlock(property, 'property-price')}
                <div class="property-type">${property.type}</div>
              </div>
              <h4 class="property-title">${property.title}</h4>
              <p class="property-address">
                <i class="bi bi-geo-alt"></i>
                ${property.address || property.city || ''}
              </p>
              <div class="property-specs">
                <div class="spec-item"><i class="bi bi-house-door"></i><span>${property.bedrooms} chambres</span></div>
                <div class="spec-item"><i class="bi bi-droplet"></i><span>${property.bathrooms} salles de bain</span></div>
                <div class="spec-item"><i class="bi bi-arrows-angle-expand"></i><span>${formatNumber(property.area)} m²</span></div>
              </div>
            </a>
            <div class="property-agent-info">
              <a href="${url}" class="property-link">
                <div class="agent-avatar">
                  <img src="${property.agent?.avatar || 'assets/img/real-estate/agent-1.webp'}" alt="Agent">
                </div>
                <div class="agent-details">
                  <strong>${property.agent?.name || 'Équipe interne'}</strong>
                  <span>${property.agent?.company || ''}</span>
                </div>
              </a>
              <div class="agent-contact">
                <a href="tel:${property.agent?.phone || ''}" class="contact-btn">
                  <i class="bi bi-telephone"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRowCard(property) {
    const url = detailUrl(property.id);
    const image = property.thumbnail || fallbackImage;
    return `
      <div class="col-12">
        <div class="property-row-item">
          <a href="${url}" class="property-row-link">
            <div class="row align-items-center">
              <div class="col-lg-4">
                <div class="property-image-wrapper">
                  <img src="${image}" alt="${property.title}" class="img-fluid">
                  <div class="property-status">${renderBadges(property)}</div>
                </div>
              </div>
              <div class="col-lg-8">
                <div class="property-row-content">
                  <div class="row align-items-center">
                    <div class="col-lg-8">
                      <div class="property-info">
                        <div class="property-header">
                          <h4 class="property-title">${property.title}</h4>
                          <div class="property-type-price">
                            <span class="property-type">${property.type}</span>
                            <span class="property-price">${formatPrice(property)}</span>
                          </div>
                        </div>
                        <p class="property-address">
                          <i class="bi bi-geo-alt"></i>
                          ${property.address || property.city || ''}
                        </p>
                        ${renderSpecs(property)}
                        <div class="property-agent">
                          <img src="${property.agent?.avatar || 'assets/img/real-estate/agent-1.webp'}" alt="Agent" class="agent-avatar">
                          <span>${property.agent?.name || 'In-house team'}, ${property.agent?.company || ''}</span>
                        </div>
                      </div>
                    </div>
                    <div class="col-lg-4">
                      <div class="property-actions">
                        <div class="action-buttons">
                          <button class="action-btn favorite-btn"><i class="bi bi-heart"></i> Enregistrer</button>
                          <button class="action-btn tour-btn"><i class="bi bi-calendar-event"></i> Visite</button>
                          <button class="action-btn details-btn"><i class="bi bi-arrow-right"></i> Détails</button>
                        </div>
                        <div class="property-footer">
                          <span><i class="bi bi-building"></i> ${property.listingType === 'rent' ? 'À louer' : 'À vendre'}</span>
                          <span><i class="bi bi-camera-video"></i> ${(property.images || []).length} Photos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    `;
  }

  function renderSidebarCard(property) {
    const url = detailUrl(property.id);
    const image = property.thumbnail || fallbackImage;
    const status = primaryStatus(property) || 'featured';
    const badgeClass = statusClass(status);
    const badgeLabel = statusLabel(status) || 'Annonce';
    return `
      <div class="sidebar-property-card">
        <div class="sidebar-property-image">
          <img src="${image}" alt="${property.title}" class="img-fluid">
          <div class="sidebar-property-badge ${badgeClass}">${badgeLabel}</div>
        </div>
        <div class="sidebar-property-content">
          <h4><a href="${url}">${property.title}</a></h4>
          <div class="sidebar-location">
            <i class="bi bi-pin-map"></i>
            <span>${property.city || property.address || ''}</span>
          </div>
          <div class="sidebar-specs">
            <span><i class="bi bi-house"></i> ${property.bedrooms} ch</span>
            <span><i class="bi bi-droplet"></i> ${property.bathrooms} sdb</span>
            <span><i class="bi bi-rulers"></i> ${formatNumber(property.area)} m²</span>
          </div>
          <div class="sidebar-price-row">
            <div class="sidebar-price">${formatPrice(property)}</div>
            <a href="${url}" class="sidebar-btn">Voir</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderHorizontalCard(property) {
    const url = detailUrl(property.id);
    const image = property.thumbnail || fallbackImage;
    const status = primaryStatus(property) || 'featured';
    const badgeLabel = statusLabel(status) || 'Annonce';
    return `
      <div class="col-xl-6">
        <div class="property-card-horizontal">
          <div class="property-image-horizontal">
            <img src="${image}" alt="${property.title}" class="img-fluid">
            <div class="property-badge-horizontal ${statusClass(status)}">${badgeLabel}</div>
          </div>
          <div class="property-content-horizontal">
            <h3><a href="${url}">${property.title}</a></h3>
            <div class="property-location-horizontal">
              <i class="bi bi-geo-alt"></i>
              <span>${property.city || property.address || ''}</span>
            </div>
            <div class="property-features">
              <span class="feature"><i class="bi bi-house"></i> ${property.bedrooms} chambres</span>
              <span class="feature"><i class="bi bi-droplet"></i> ${property.bathrooms} salles de bain</span>
              <span class="feature"><i class="bi bi-rulers"></i> ${formatNumber(property.area)} m²</span>
            </div>
            <p>${property.headline || property.priceNote || ''}</p>
            <div class="property-footer-horizontal">
              <div class="property-price-horizontal">${formatPrice(property)}</div>
              <a href="${url}" class="btn-view-horizontal">Voir les détails</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function populateFeatured(properties) {
    const featuredContainer = document.querySelector('#featured-properties .container[data-aos][data-aos-delay]');
    if (!featuredContainer || !properties.length) return;

    const featuredListings = properties.filter((p) => Array.isArray(p.status) && p.status.includes('featured'));
    const list = featuredListings.length ? featuredListings : properties;
    const hero = list[0];
    const sidebar = list.slice(1, 3);
    const horizontals = list.slice(3, 5);

    const heroBlock = `
      <div class="featured-property-main">
        <div class="property-hero">
          <img src="${hero.images?.[0] || hero.thumbnail || fallbackImage}" alt="${hero.title}" class="img-fluid">
          <div class="property-overlay">
            <div class="property-badge-main premium">${hero.listingType === 'rent' ? 'À louer' : 'Premium'}</div>
            <div class="property-stats">
              <div class="stat-item"><i class="bi bi-house-door"></i><span>${hero.bedrooms} chambres</span></div>
              <div class="stat-item"><i class="bi bi-droplet-fill"></i><span>${hero.bathrooms} salles de bain</span></div>
              <div class="stat-item"><i class="bi bi-arrows-move"></i><span>${formatNumber(hero.area)} m²</span></div>
            </div>
          </div>
        </div>
        <div class="property-hero-content">
          <div class="property-header">
            <div class="property-info">
              <h2><a href="${detailUrl(hero.id)}">${hero.title}</a></h2>
              <div class="property-address"><i class="bi bi-geo-alt-fill"></i><span>${hero.city || hero.address || ''}</span></div>
            </div>
            <div class="property-price-main">${formatPrice(hero)}</div>
          </div>
          <p class="property-description">${hero.headline || hero.priceNote || 'Annonce exclusive sélectionnée par notre équipe.'}</p>
          <div class="property-actions-main">
            <a href="${detailUrl(hero.id)}" class="btn-primary-custom">Planifier une visite</a>
            <a href="${detailUrl(hero.id)}" class="btn-outline-custom">Voir la galerie</a>
            <div class="property-listing-info">
              <span class="listing-status ${hero.listingType === 'rent' ? 'for-rent' : 'for-sale'}">${hero.listingType === 'rent' ? 'À louer' : 'À vendre'}</span>
              <span class="listing-date">Mis à jour maintenant</span>
            </div>
          </div>
        </div>
      </div>
    `;

    featuredContainer.innerHTML = `
      <div class="row gy-5">
        <div class="col-lg-8">${heroBlock}</div>
        <div class="col-lg-4">
          <div class="properties-sidebar">
            ${sidebar.map(renderSidebarCard).join('')}
          </div>
        </div>
      </div>
      <div class="row gy-4 mt-4">
        ${horizontals.map(renderHorizontalCard).join('')}
      </div>
    `;
  }

  function sortListings(list, sortValue) {
    const sorted = [...list];
    switch (sortValue) {
      case 'price-desc':
        return sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      case 'size-desc':
        return sorted.sort((a, b) => Number(b.area || 0) - Number(a.area || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      case 'price-asc':
      default:
        return sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
  }

  function populatePropertiesPage(properties) {
    const grid = document.querySelector('.properties-masonry .row');
    const rows = document.querySelector('.properties-rows .row');
    if (!grid && !rows) return;

    const resultsTitle = document.querySelector('.results-info h5');
    const resultsSubtitle = document.querySelector('.results-info p');
    const sortSelect = document.querySelector('.sort-dropdown select');

    const render = (list) => {
      if (grid) grid.innerHTML = list.map(renderMasonryCard).join('');
      if (rows) rows.innerHTML = list.map(renderRowCard).join('');
      if (resultsTitle) resultsTitle.textContent = `${list.length} biens trouvés`;
      if (resultsSubtitle) resultsSubtitle.textContent = `Annonces disponibles dans ${new Set(list.map((i) => i.city)).size || 1} marché(s)`;
    };

    const initialSort = (sortSelect && sortSelect.value) || 'price-asc';
    render(sortListings(properties, initialSort));

    if (sortSelect) {
      sortSelect.addEventListener('change', (event) => {
        render(sortListings(properties, event.target.value));
      });
    }

    document.querySelectorAll('.view-toggle .view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        document.querySelectorAll('.view-toggle .view-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.properties-container .view-masonry').forEach((el) => el.classList.toggle('active', view === 'masonry'));
        document.querySelectorAll('.properties-container .view-rows').forEach((el) => el.classList.toggle('active', view === 'rows'));
      });
    });
  }

  function populatePropertyDetails(properties) {
    const detailSection = document.querySelector('#property-details .container');
    if (!detailSection) return;

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');
    const property = properties.find((item) => item.id === requestedId) || properties[0];

    if (!property) {
      detailSection.innerHTML = '<p class="text-danger">Aucune donnée de bien disponible.</p>';
      return;
    }

    const gallerySlides = (property.images || [property.thumbnail || fallbackImage])
      .map(
        (img) => `
        <div class="swiper-slide">
          <img src="${img}" class="img-fluid hero-image" alt="${property.title}">
        </div>
      `
      )
      .join('');

    const thumbnails = (property.images || [property.thumbnail || fallbackImage])
      .map(
        (img) => `
        <div class="swiper-slide">
          <img src="${img}" class="img-fluid" alt="${property.title}">
        </div>
      `
      )
      .join('');

    const amenityList = (property.amenities || [])
      .map((item) => `<li><i class="bi bi-check-circle"></i> ${item}</li>`)
      .join('');

    detailSection.innerHTML = `
      <div class="row">
        <div class="col-lg-7">
          <div class="property-hero mb-5">
            <div class="property-gallery-slider swiper init-swiper">
              <script type="application/json" class="swiper-config">
                {
                  "loop": true,
                  "speed": 600,
                  "autoplay": { "delay": 5000 },
                  "navigation": { "nextEl": ".swiper-button-next", "prevEl": ".swiper-button-prev" },
                  "thumbs": { "swiper": ".property-thumbnails-slider" }
                }
              </script>
              <div class="swiper-wrapper">
                ${gallerySlides}
              </div>
              <div class="swiper-button-next"></div>
              <div class="swiper-button-prev"></div>
            </div>
            <div class="property-thumbnails-slider swiper init-swiper mt-3">
              <script type="application/json" class="swiper-config">
                {
                  "loop": false,
                  "speed": 300,
                  "spaceBetween": 8,
                  "slidesPerView": 4,
                  "watchSlidesProgress": true,
                  "breakpoints": {
                    "320": { "slidesPerView": 3 },
                    "768": { "slidesPerView": 4 },
                    "1200": { "slidesPerView": 5 }
                  }
                }
              </script>
              <div class="swiper-wrapper">
                ${thumbnails}
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="property-summary">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                ${renderBadges(property)}
                <h2 class="mb-1">${property.title}</h2>
                <p class="mb-0 text-muted"><i class="bi bi-geo-alt"></i> ${property.address || property.city || ''}</p>
              </div>
              ${renderPriceBlock(property, 'property-price-main')}
            </div>
            <div class="d-flex gap-3 flex-wrap mb-3">
              <span><i class="bi bi-house-door"></i> ${property.bedrooms} chambres</span>
              <span><i class="bi bi-droplet"></i> ${property.bathrooms} salles de bain</span>
              <span><i class="bi bi-rulers"></i> ${formatNumber(property.area)} m²</span>
              ${property.yearBuilt ? `<span><i class="bi bi-building"></i> Construit en ${property.yearBuilt}</span>` : ''}
            </div>
            <p class="lead">${property.headline || ''}</p>
            <div class="d-flex gap-2 align-items-center mt-3">
              <a href="tel:${property.agent?.phone || ''}" class="btn btn-primary">Appeler l'agent</a>
              <a href="mailto:${property.agent?.email || ''}" class="btn btn-outline-secondary">Envoyer un email</a>
            </div>
          </div>
          <div class="agent-card mt-4 p-3 border rounded">
            <div class="d-flex align-items-center gap-3">
              <img src="${property.agent?.avatar || 'assets/img/real-estate/agent-1.webp'}" alt="${property.agent?.name || 'Agent'}" class="rounded-circle" width="64" height="64">
              <div>
                <h5 class="mb-0">${property.agent?.name || 'Agent en charge'}</h5>
                <small class="text-muted">${property.agent?.company || ''}</small>
                <div class="small">Téléphone : ${property.agent?.phone || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row gy-4 mt-2">
        <div class="col-lg-8">
          <div class="property-description card p-4">
            <h4>Description</h4>
            <p>${property.headline || ''}</p>
            <p>${property.priceNote || ''}</p>
          </div>
          <div class="property-features card p-4 mt-3">
            <h4>Équipements</h4>
            <ul class="list-unstyled amenities-list">
              ${amenityList}
            </ul>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="property-facts card p-4">
            <h4>Informations clés</h4>
            <ul class="list-unstyled mb-0">
              <li><strong>Type :</strong> ${property.type}</li>
              <li><strong>Statut :</strong> ${property.listingType === 'rent' ? 'À louer' : 'À vendre'}</li>
              <li><strong>Surface :</strong> ${formatNumber(property.area)} m²</li>
              ${property.lotSize ? `<li><strong>Parcelle :</strong> ${property.lotSize}</li>` : ''}
              ${property.yearBuilt ? `<li><strong>Année de construction :</strong> ${property.yearBuilt}</li>` : ''}
            </ul>
          </div>
          <div class="property-callout card p-4 mt-3">
            <h4>Prêt pour une visite ?</h4>
            <p class="mb-3">Dites-nous quand vous souhaitez voir ${property.title.split(' ')[0]}.</p>
            <a href="tel:${property.agent?.phone || ''}" class="btn btn-primary w-100 mb-2"><i class="bi bi-telephone"></i> Appeler</a>
            <a href="${detailUrl(property.id)}" class="btn btn-outline-secondary w-100">Voir la galerie</a>
          </div>
        </div>
      </div>
    `;
  }

  function populateAdmin(properties) {
    const form = document.querySelector('#admin-property-form');
    const listContainer = document.querySelector('#admin-properties-list');
    const totalCount = document.querySelector('#admin-total-count');
    if (!form || !listContainer) return;

    const renderList = (items) => {
      if (totalCount) totalCount.textContent = items.length;
      listContainer.innerHTML = items
        .map(
          (p) => `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>${p.title}</strong>
              <div class="small text-muted">${p.city || p.address || ''}</div>
            </div>
            <span class="badge bg-primary rounded-pill">${formatPrice(p)}</span>
          </div>
        `
        )
        .join('');
    };

    renderList(properties);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        title: formData.get('title'),
        headline: formData.get('headline'),
        listingType: formData.get('listingType'),
        status: (formData.get('status') || '').split(',').map((s) => s.trim()).filter(Boolean),
        price: Number(formData.get('price') || 0),
        paymentTerm: formData.get('paymentTerm') || null,
        type: formData.get('type'),
        address: formData.get('address'),
        city: formData.get('city'),
        bedrooms: Number(formData.get('bedrooms') || 0),
        bathrooms: Number(formData.get('bathrooms') || 0),
        area: Number(formData.get('area') || 0),
        thumbnail: formData.get('thumbnail'),
        images: (formData.get('images') || '').split(',').map((s) => s.trim()).filter(Boolean),
        amenities: (formData.get('amenities') || '').split(',').map((s) => s.trim()).filter(Boolean),
        priceNote: formData.get('priceNote'),
        agent: {
          name: formData.get('agentName'),
          phone: formData.get('agentPhone'),
          email: formData.get('agentEmail'),
          avatar: formData.get('agentAvatar'),
          company: formData.get('agentCompany')
        }
      };

      const response = await fetch(`${API_BASE}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (!response.ok) {
        alert(json.error || 'Unable to save property');
        return;
      }

      properties.push(json.data);
      renderList(properties);
      form.reset();
    });
  }

  async function fetchProperties() {
    const response = await fetch(`${API_BASE}/properties`);
    if (!response.ok) throw new Error('Unable to reach property API');
    const json = await response.json();
    return json.data || [];
  }

  async function init() {
    try {
      const properties = await fetchProperties();
      populateFeatured(properties);
      populatePropertiesPage(properties);
      populatePropertyDetails(properties);
      populateAdmin(properties);
    } catch (err) {
      console.error(err);
      const message = document.createElement('div');
      message.className = 'alert alert-danger m-3';
      message.textContent = 'Unable to load property data from the backend. Please start the server with "npm start".';
      const main = document.querySelector('main') || document.body;
      main.prepend(message);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
