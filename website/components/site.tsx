'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { events, type Event, type Prize } from '../lib/events';

const formUrl = 'https://forms.gle/1vzAsMQD7SyqTis87';
const instagramUrl = 'https://www.instagram.com/x_tesseract?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==';

const committee = [
  ['President', 'R. RATHISH', '89250 46648', 'President.jpeg'],
  ['Vice President', 'NAISANA H', '93455 43114', 'vice president.jpeg'],
  ['Secretary', 'M. SADHAM HUSSAIN', '88256 36536', 'Secretary.jpeg'],
  ['Joint Secretary', 'MOHAMMED AFRID A', '81909 78051', 'joint secretary.jpeg'],
  ['Treasurer', 'M. MOHAMMED AARIF', '86374 29625', 'Treasurer.jpeg'],
  ['Joint Treasurer', 'ABDUL HALIK M.A', '95000 25802', 'Joint Treasurer.jpeg']
] as const;

function BackgroundCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('tesseract-bg-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const vertices = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],[8,9],[9,10],[10,11],[11,8],[12,13],[13,14],[14,15],[15,12],[8,12],[9,13],[10,14],[11,15],[0,8],[1,9],[2,10],[3,11],[4,12],[5,13],[6,14],[7,15]];
    let angleX = 0;
    let angleY = 0;
    let frame = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      angleX += .004; angleY += .006;
      context.strokeStyle = 'rgba(0, 243, 255, 0.25)'; context.lineWidth = 1.5;
      const project = (point: number[], scale: number, ox: number, oy: number) => {
        const x = point[0] * Math.cos(angleY) + point[2] * Math.sin(angleY);
        const z1 = -point[0] * Math.sin(angleY) + point[2] * Math.cos(angleY);
        const y = point[1] * Math.cos(angleX) - z1 * Math.sin(angleX);
        const z = point[1] * Math.sin(angleX) + z1 * Math.cos(angleX);
        const fov = scale / (3 + z);
        return [x * fov + ox, y * fov + oy];
      };
      [[300, canvas.width * .15, canvas.height * .45], [380, canvas.width * .85, canvas.height * .55]].forEach(([scale, ox, oy]) => {
        const points = vertices.map((vertex) => project(vertex, scale, ox, oy));
        edges.forEach(([from, to]) => { context.beginPath(); context.moveTo(points[from][0], points[from][1]); context.lineTo(points[to][0], points[to][1]); context.stroke(); });
      });
      frame = requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize', resize); draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas id="tesseract-bg-canvas" aria-hidden="true" />;
}

function Brand({ home = false }: { home?: boolean }) {
  return <Link href="/" className="brand-logo">
    {home ? <svg className="brand-icon-svg" viewBox="0 0 24 24"><polygon points="12 2,22 8.5,22 15.5,12 22,2 15.5,2 8.5"/><polygon points="12 6,18 10,18 14,12 18,6 14,6 10"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="22" y1="8.5" x2="18" y2="10"/><line x1="22" y1="15.5" x2="18" y2="14"/><line x1="12" y1="22" x2="12" y2="18"/><line x1="2" y1="15.5" x2="6" y2="14"/><line x1="2" y1="8.5" x2="6" y2="10"/></svg> : <div className="brand-icon">T</div>}
    <div><span className="brand-title">TESSERACT '26</span>{!home && <span className="brand-sub">ECE Dept | AMS Engineering College</span>}</div>
  </Link>;
}

function Nav({ home = false }: { home?: boolean }) {
  return <nav className="navbar"><div className="nav-container"><Brand home={home} /><ul className="nav-links">{home ? <><li><a href="#featured-events" className="nav-link">EVENTS</a></li><li><a href="#about" className="nav-link">ABOUT</a></li><li><a href="#committee" className="nav-link">COMMITTEE</a></li><li><a href="#contact" className="nav-link">CONTACT</a></li></> : <><li><Link href="/" className="nav-link">Home</Link></li><li><Link href="/register" className="nav-link active">Events &amp; Rules</Link></li></>}<li><a href={formUrl} target="_blank" rel="noreferrer" className="btn-cyan-solid" style={{ padding: '.6rem 1.4rem' }}>REGISTER NOW ↗</a></li></ul></div></nav>;
}

function Footer() { return <footer style={{ background: 'rgba(4, 6, 14, .95)', borderTop: '1px solid var(--border-color)', padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}><div className="container" style={{ maxWidth: 900 }}><div className="font-mono" style={{ fontSize: '1.3rem', color: '#fff', letterSpacing: 3, marginBottom: '.5rem' }}>TESSERACT ’26</div><p style={{ marginBottom: '1rem', fontSize: '.9rem' }}>Department of Electronics and Communication Engineering<br />Aalim Muhammed Salegh College of Engineering</p><p className="font-mono" style={{ fontSize: '.8rem', color: 'var(--text-dim)' }}>EVENT DATE: 12 SEPTEMBER 2026 | NATIONAL LEVEL SYMPOSIUM</p><div className="font-mono" style={{ marginTop: '1.5rem', fontSize: '.75rem', color: 'var(--text-dim)' }}>© 2026 TESSERACT ’26. All rights reserved.</div></div></footer>; }

function prizesMarkup(prizes: Prize[]) { return prizes.map((prize) => <span className="prize-badge" key={`${prize.rank}-${prize.amount}`}><span className="prize-rank">{prize.rank.toLowerCase().includes('1st') ? '🥇' : prize.rank.toLowerCase().includes('2nd') || prize.rank.toLowerCase().includes('runner') ? '🥈' : '🏆'} {prize.rank}</span><span className="prize-amount">{prize.amount}</span></span>); }

function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const [posterIndex, setPosterIndex] = useState(0);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') setPosterIndex((index) => (index - 1 + event.posters.length) % event.posters.length); if (e.key === 'ArrowRight') setPosterIndex((index) => (index + 1) % event.posters.length); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [event.posters.length, onClose]);
  return <div className="site-modal" onClick={onClose}><div className="glass-card modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-heading"><div><span className="event-category-tag">{event.category}</span><h2>{event.title}</h2><span className="modal-meta">📍 Venue: <strong>{event.venue}</strong> &nbsp;|&nbsp; 👥 Max Team: <strong>{event.maxTeamSize} Members</strong></span></div><button className="btn btn-secondary btn-sm" onClick={onClose}>✕ Close</button></div><div className="modal-poster"><button className="gallery-arrow left" onClick={() => setPosterIndex((index) => (index - 1 + event.posters.length) % event.posters.length)}>‹</button><img src={event.posters[posterIndex]} alt={`${event.title} Poster ${posterIndex + 1}`} /><button className="gallery-arrow right" onClick={() => setPosterIndex((index) => (index + 1) % event.posters.length)}>›</button></div>{event.posters.length > 1 && <div className="poster-thumbs">{event.posters.map((poster, index) => <button key={poster} className={index === posterIndex ? 'selected' : ''} onClick={() => setPosterIndex(index)}><img src={poster} alt="" /></button>)}</div>}<div className="review-section"><div className="review-section-title">WHAT YOU NEED TO DO / DESCRIPTION</div><p>{event.description}</p></div><div className="review-section"><div className="review-section-title">RULES &amp; GUIDELINES</div><p>{event.rules}</p></div><div className="review-section"><div className="review-section-title">PRIZES &amp; RECOGNITION</div><div className="prize-list">{prizesMarkup(event.prizes)}</div></div><div className="modal-actions"><button className="btn btn-secondary" onClick={onClose}>← Back to Events</button><a className="btn-cyan-solid" href={formUrl} target="_blank" rel="noreferrer">REGISTER IN GOOGLE FORM ↗</a></div></div></div>;
}

function EventCard({ event, onOpen, landing = false }: { event: Event; onOpen: () => void; landing?: boolean }) { return <article className="event-card"><div>{event.posters.length > 0 && <button className="poster-preview" onClick={onOpen}><img src={event.posters[0]} alt={`${event.title} Poster`} />{event.posters.length > 1 && <span>📸 {event.posters.length} POSTERS</span>}<b>🖼️ View Poster ({event.posters.length})</b></button>}<div className="event-category-tag">{event.category}</div><div className="event-title">{event.title}</div><div className="event-venue">📍 {event.venue} &bull; 👥 Max {event.maxTeamSize} Members</div><p className="event-description">{event.description}</p><div className="event-prizes"><div className="prize-title">Prizes / Category</div><div className="prize-list">{prizesMarkup(event.prizes)}</div></div></div><div className="card-actions"><button className="btn btn-secondary btn-sm" onClick={onOpen} style={{ width: '100%' }}>📜 {landing ? 'View Details & Posters' : 'View Full Guidelines & Posters'}</button><a className="btn-cyan-solid" href={formUrl} target="_blank" rel="noreferrer">REGISTER IN GOOGLE FORM ↗</a></div></article>; }

function EventsGrid({ landing = false }: { landing?: boolean }) { const [selected, setSelected] = useState<Event | null>(null); const [category, setCategory] = useState('ALL'); const [search, setSearch] = useState(''); const filtered = useMemo(() => events.filter((event) => (category === 'ALL' || event.category === category) && (!search || `${event.title} ${event.venue} ${event.description}`.toLowerCase().includes(search.toLowerCase()))), [category, search]); return <><div className="events-grid">{filtered.map((event, index) => <div key={event.id} className="event-grid-item">{(index === 0 || filtered[index - 1].category !== event.category) && <div className="event-category-heading"><span className="mono-tag">{event.category}</span></div>}<EventCard event={event} onOpen={() => setSelected(event)} landing={landing} /></div>)}{filtered.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>No events found matching your search criteria.</div>}</div>{selected && <EventModal event={selected} onClose={() => setSelected(null)} />}</>; }

export function HomePage() { return <><BackgroundCanvas /><Nav home /><section className="container hero"><span className="mono-tag">NATIONAL-LEVEL SYMPOSIUM</span><img src="/static/images/tesseract26_logo_3d.jpg" alt="TESSERACT '26 3D Logo" className="hero-logo-img" /><div className="font-mono hero-tagline">INNOVATION &nbsp;•&nbsp; TECHNOLOGY &nbsp;•&nbsp; COMPETITION</div><div className="hero-meta"><strong>12 / 09</strong><span>AALIM MUHAMMED SALEGH COLLEGE OF ENGINEERING</span></div><div className="hero-actions"><a href={formUrl} target="_blank" rel="noreferrer" className="btn-cyan-solid">REGISTER VIA GOOGLE FORM ↗</a><a href={instagramUrl} target="_blank" rel="noreferrer" className="btn-outline-dark">INSTAGRAM ↗</a><a href="#featured-events" className="btn-outline-dark">EXPLORE EVENTS &amp; RULES ↓</a></div></section><section id="featured-events" className="container section"><SectionHeading tag="13 SYMPOSIUM EVENTS & STALLS" title="FEATURED EVENTS & RULES" text="Explore competition details, venue, winning cash prizes, and official posters. All participant registrations are submitted directly through the official Google Form." /><div style={{ textAlign: 'center', marginBottom: '2rem' }}><a href={formUrl} target="_blank" rel="noreferrer" className="btn-cyan-solid">👉 CLICK HERE TO REGISTER (GOOGLE FORM) ↗</a></div><EventsGrid landing /></section><section id="about" className="container section"><div className="glass-card centered-card"><span className="mono-tag">ORGANIZED BY</span><h3>DEPARTMENT OF ELECTRONICS &amp; COMMUNICATION ENGINEERING</h3><p>Aalim Muhammed Salegh College of Engineering invites students from across the nation to test their technical brilliance and creative talents at <strong>TESSERACT ’26</strong> on <strong>12 September 2026</strong>.</p></div></section><section id="committee" className="container section"><SectionHeading tag="ECE DEPARTMENT STUDENT ASSOCIATION" title="SYMPOSIUM COORDINATORS" text="The dedicated student leaders organizing TESSERACT '26 — National Level Symposium." /><div className="coordinators-grid">{committee.map(([role, name, phone, image]) => <div className="coordinator-card" key={role}><div className="coordinator-avatar"><img src={`/static/images/committee/${image}`} alt={`${name} - ${role}`} /></div><div className="coordinator-designation">{role}</div><div className="coordinator-name">{name}</div><a className="coordinator-phone" href={`tel:${phone.replaceAll(' ', '')}`}>📞 {phone}</a></div>)}</div></section><section id="contact" className="container section"><div className="glass-card contact-card"><SectionHeading tag="REACH OUT TO US" title="CONTACT US" text="Get in touch with any of our office bearers for queries about TESSERACT '26." /><div className="contact-grid">{committee.map(([role, name, phone], index) => <div className="contact-item" key={role}><div className="contact-icon">{['👑','⭐','📋','📝','💼','🤝'][index]}</div><div className="contact-info"><div className="contact-role">{role}</div><div className="contact-name-small">{name}</div><a href={`tel:${phone.replaceAll(' ', '')}`}>+91 {phone}</a></div></div>)}<div className="contact-item venue-contact"><div className="contact-icon">🏛️</div><div className="contact-info"><div className="contact-role">Venue</div><div className="contact-name-small">ECE Department</div><a href="https://maps.google.com/?q=Aalim+Muhammed+Salegh+College+of+Engineering" target="_blank" rel="noreferrer">Aalim Muhammed Salegh College of Engineering</a></div></div></div></div></section><Footer /></>; }

function SectionHeading({ tag, title, text }: { tag: string; title: string; text: string }) { return <div className="section-heading"><span className="mono-tag">{tag}</span><h2>{title}</h2><p>{text}</p></div>; }

export function EventsPage() { return <><Nav /><main className="container events-page"><SectionHeading tag="SYMPOSIUM EVENTS & GUIDELINES" title="EXPLORE EVENTS & RULES" text="Browse technical challenges, non-technical competitions, and stalls. Review rules and cash prize structures, then submit your entry via our official Google Form." /><div className="glass-card registration-banner"><strong>📝 OFFICIAL REGISTRATION IS OPEN VIA GOOGLE FORM</strong><p>Select your events, review the guidelines below, and click the button to complete your registration.</p><a href={formUrl} target="_blank" rel="noreferrer" className="btn-cyan-solid">👉 OPEN OFFICIAL GOOGLE REGISTRATION FORM ↗</a></div><EventsExplorer /></main><Footer /></>; }

function EventsExplorer() { const [category, setCategory] = useState('ALL'); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<Event | null>(null); const filtered = events.filter((event) => (category === 'ALL' || event.category === category) && (!search || `${event.title} ${event.venue} ${event.description}`.toLowerCase().includes(search.toLowerCase()))); return <><div className="category-tabs controlled-tabs">{['ALL','TECHNICAL EVENTS','NON-TECHNICAL EVENTS','STALLS & EXHIBITS'].map((item) => <button key={item} className={`tab-btn ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="search-container"><span className="search-icon">🔍</span><input className="search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search event by name, venue, or keywords..." /></div><div className="events-grid">{filtered.map((event, index) => <div key={event.id} className="event-grid-item">{(index === 0 || filtered[index - 1].category !== event.category) && <div className="event-category-heading"><span className="mono-tag">{event.category}</span></div>}<EventCard event={event} onOpen={() => setSelected(event)} /></div>)}</div>{selected && <EventModal event={selected} onClose={() => setSelected(null)} />}</>; }
