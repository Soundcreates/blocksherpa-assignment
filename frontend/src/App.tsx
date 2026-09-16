import OnChainRegistryCard from './components/property-details/OnChainRegistryCard';

const property = {
  title: 'The Glass Pavilion',
  location: '221B Baker Street, London',
  price: 125_000_000,
  priceLabel: '₹1.25 Cr',
  type: 'Contemporary townhouse',
  beds: 3,
  baths: 2,
  area: 148,
  description:
    'A light-filled townhouse with quiet garden views, considered materials, and a flexible layout for modern city living.',
  highlights: ['Private courtyard', 'South-facing studio', 'Walkable neighbourhood'],
};

function App() {
  return (
    <main className="app-shell">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="REChain home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RE<span>Chain</span></span>
        </a>
        <span className="network-badge">POLYGON AMOY · TESTNET</span>
      </nav>

      <section className="page-grid">
        <div className="intro-column">
          <p className="eyebrow">PROPERTY DETAIL · WEB3 REGISTRY DEMO</p>
          <h1>{property.title}</h1>
          <p className="lede">A real-world listing with an independently verifiable registry record.</p>

          <div className="property-visual" aria-label="Abstract architectural illustration" role="img">
            <div className="visual-grid" />
            <div className="visual-sun" />
            <div className="visual-copy">
              <span>RE / 01</span>
              <strong>GLASS<br />PAVILION</strong>
            </div>
          </div>

          <div className="property-facts" aria-label="Property facts">
            <div>
              <span>Location</span>
              <strong>{property.location}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{property.type}</strong>
            </div>
            <div>
              <span>Asking price</span>
              <strong>{property.priceLabel}</strong>
            </div>
          </div>
        </div>

        <div className="detail-column">
          <div className="detail-card">
            <div className="detail-card-header">
              <div>
                <p className="eyebrow">THE LISTING</p>
                <h2>Designed for everyday light.</h2>
              </div>
              <span className="status-chip">AVAILABLE</span>
            </div>
            <p className="description">{property.description}</p>
            <div className="stat-row">
              <div><strong>{property.beds}</strong><span>BEDS</span></div>
              <div><strong>{property.baths}</strong><span>BATHS</span></div>
              <div><strong>{property.area}</strong><span>SQM</span></div>
            </div>
            <div className="highlight-list">
              {property.highlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
          </div>

          <OnChainRegistryCard propertyAddress={property.location} price={property.price} />

          <p className="footer-note">
            No backend or account system is involved. The connected wallet signs the registry transaction directly on Polygon Amoy.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
