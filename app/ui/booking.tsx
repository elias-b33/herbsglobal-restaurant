"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import SiteShell, { Hours, Icon } from "./chrome";
import { PhoneToConfirm, ServiceHeading, ServiceNotice } from "./service-parts";
import { restaurant } from "../data/restaurant";
import { displayDate, localDate, preferredTimes, visitError } from "../lib/service-drafts";

export default function Booking() {
  const [today, setToday] = useState("");
  const [details, setDetails] = useState({ date: "", time: "", guests: "2", name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState("");
  const [review, setReview] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const times = preferredTimes(details.date);
  useEffect(() => { setToday(localDate()); }, []);
  useEffect(() => { if (review) { title.current?.focus(); title.current?.scrollIntoView({ block: "start" }); } }, [review]);

  function reviewBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = visitError(details.date, details.time);
    if (message) { setError(message); dateInput.current?.focus(); return; }
    setError(""); setReview(true);
  }
  function editBooking() { setReview(false); }

  return <SiteShell active="book"><main id="main" className="menu-page native-service-page">
    <ServiceHeading booking />
    <div className="container"><ServiceNotice booking />
      <div className="booking-layout">
        <section className="booking-main" aria-labelledby="booking-form-title">
          <div className="service-section-heading"><h2 id="booking-form-title" ref={title} tabIndex={-1}>{review ? "Review your visit" : "Your visit"}</h2><span className="small">{review ? "Preview · not sent" : "All times are local to Bucharest"}</span></div>
          {review ? <div className="booking-review"><p className="review-intro">Here are your preferred details. Your table has not been reserved.</p><dl className="review-details"><div><dt>Date</dt><dd>{displayDate(details.date)}</dd></div><div><dt>Preferred time</dt><dd>{times.find(time => time.value === details.time)?.label}</dd></div><div><dt>Guests</dt><dd>{details.guests} {details.guests === "1" ? "guest" : "guests"}</dd></div><div><dt>Name</dt><dd>{details.name}</dd></div><div><dt>Phone</dt><dd>{details.phone}</dd></div>{details.email && <div><dt>Email</dt><dd>{details.email}</dd></div>}{details.notes && <div><dt>Special requests</dt><dd>{details.notes}</dd></div>}</dl><button className="text-link" onClick={editBooking}>Edit booking details <Icon name="arrow" size={16} /></button><PhoneToConfirm booking /></div> : <form className="service-form booking-form" onSubmit={reviewBooking}>
            <div className="visit-fields"><label>Date<input ref={dateInput} type="date" min={today || undefined} value={details.date} required aria-describedby={error ? "visit-error" : undefined} aria-invalid={!!error} onChange={event => { const date = event.target.value; setDetails({ ...details, date, time: "" }); setError(date && !preferredTimes(date).length ? "We’re closed on Tuesdays. Please choose another day." : ""); }} /></label><label>Guests<select value={details.guests} onChange={event => setDetails({ ...details, guests: event.target.value })}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? "guest" : "guests"}</option>)}</select></label><label>Preferred time<select value={details.time} required disabled={!times.length} aria-describedby="time-guidance" onChange={event => { setDetails({ ...details, time: event.target.value }); setError(""); }}><option value="">{details.date ? "Choose a time" : "Choose a date first"}</option>{times.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}</select></label></div>
            {error && <p className="service-form-error" role="alert" id="visit-error">{error}</p>}
            <p className="form-guidance" id="time-guidance">Times follow our opening hours and are preferences, not confirmed availability. For groups of more than 8, <a href={restaurant.phoneHref}>please call us</a>.</p>
            <div className="service-section-heading details-heading"><h2>Your details</h2><span className="small">For your booking preview</span></div>
            <label>Full name<input autoComplete="name" required maxLength={100} value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} /></label>
            <div className="contact-fields"><label>Phone number<input type="tel" autoComplete="tel" required pattern={"[+0-9 .\\(\\)\\-]{7,30}"} title="Enter a phone number, including your country code." maxLength={30} value={details.phone} onChange={event => setDetails({ ...details, phone: event.target.value })} /></label><label>Email <span className="field-optional">(optional)</span><input type="email" autoComplete="email" maxLength={200} value={details.email} onChange={event => setDetails({ ...details, email: event.target.value })} /></label></div>
            <label>Special requests <span className="field-optional">(optional)</span><textarea rows={3} maxLength={500} placeholder="A special occasion, accessibility needs, or anything we should know" value={details.notes} onChange={event => setDetails({ ...details, notes: event.target.value })} /></label>
            <div className="booking-form-bottom"><button className="button button-green" type="submit">Review booking <Icon name="arrow" size={18} /></button><p className="small">Preview only. Nothing is sent.<br />Your details are cleared when you leave this page.</p></div>
          </form>}
        </section>
        <aside className="booking-visit" aria-labelledby="booking-visit-title"><img src="/assets/gallery-04-herbs-food-2.jpg" alt="Prawns and handmade dumplings at Global Herbs" width="2048" height="1536" /><div className="booking-visit-copy"><p className="eyebrow">A SEAT AT OUR TABLE</p><h2 id="booking-visit-title">Global Herbs</h2><p>{restaurant.building}<br />Str. Nicolae Tonitza 13<br />București 030167, Romania</p><a className="text-link" href={restaurant.maps} target="_blank" rel="noopener noreferrer">Get directions <Icon name="external" size={16} /></a><div className="booking-hours"><h3>Opening hours</h3><Hours /></div><p className="booking-contact">A question about your visit?<br /><a href={restaurant.phoneHref}>{restaurant.phone}</a></p></div></aside>
      </div>
    </div>
  </main></SiteShell>;
}
