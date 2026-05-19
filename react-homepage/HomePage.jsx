import React from 'react';
import './homepage.css';

export default function HomePage() {
  return (
    <main className="home-root">
      <section
        className="hero-section"
        style={{
          backgroundImage:
            "url('/assets/img/kelibia/kelibia-beach.jpg')"
        }}
      >
        <div className="hero-overlay" />

        <div className="hero-content fade-in">
          <h1 className="hero-title">Trouvez votre bien ideal a Kelibia</h1>
          <p className="hero-subtitle">
            Investissez intelligemment dans des villas et residences premium proches de la mer
          </p>
          <a href="/properties?page=1" className="hero-cta" aria-label="Explorer les biens">
            Explorer les biens
          </a>
        </div>
      </section>
    </main>
  );
}

