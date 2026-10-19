"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "./language";
import SiteShell, { Hours, Icon } from "./chrome";
import { ServiceHeading, ServiceNotice } from "./service-parts";
import { restaurant } from "../data/restaurant";
import { displayDate, localDate, preferredTimes } from "../lib/service-drafts";
import { groupMenus, groupOccasions, menuLabels, occasionLabels, validateBooking, type BookingRequest } from "../lib/booking-request";

const initialDetails: BookingRequest = { date: "", time: "", guests: 2, name: "", email: "", phone: "", notes: "", flexibleDate: false, flexibleTime: false, occasion: "", menu: "unsure", budget: "" };

export default function Booking() {
  const { t, locale, countText, l } = useLanguage();
  const [today, setToday] = useState("");
  const [details, setDetails] = useState<BookingRequest>(initialDetails);
  const [group, setGroup] = useState(false);
  const [stage, setStage] = useState<"form" | "review" | "sent">("form");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [deliveryUnknown, setDeliveryUnknown] = useState(false);
  const [reference, setReference] = useState("");
  const [website, setWebsite] = useState("");
  const requestId = useRef("");
  const inFlight = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);
  const times = preferredTimes(details.date, locale);
  useEffect(() => { setToday(localDate()); }, []);
  useEffect(() => { if (stage !== "form") { title.current?.focus(); title.current?.scrollIntoView({ block: "start" }); } }, [stage]);
  useEffect(() => { if (error) errorBox.current?.focus(); }, [error]);
  const update = <K extends keyof BookingRequest>(key: K, value: BookingRequest[K]) => setDetails(current => ({ ...current, [key]: value }));

  function reviewBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (group && details.guests <= 10) { setError("Please enter at least 11 guests for a group enquiry."); return; }
    const checked = validateBooking(details);
    if (checked.error) { setError(checked.error); return; }
    setDetails(checked.data!); requestId.current = crypto.randomUUID();
    setError(""); setDeliveryUnknown(false); setStage("review");
  }

  async function sendBooking() {
    if (inFlight.current || deliveryUnknown) return;
    inFlight.current = true; setSending(true); setError("");
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, website, requestId: requestId.current }), signal: AbortSignal.timeout(22_000) });
      const result = await response.json();
      if (response.ok && result.sent === true && typeof result.reference === "string") {
        setReference(result.reference); setStage("sent");
      } else {
        setError(typeof result.message === "string" ? result.message : "We couldn’t send your request. Please try again or call us.");
        setDeliveryUnknown(result.code === "DELIVERY_UNKNOWN");
      }
    } catch {
      setError("We couldn’t confirm delivery. Please call us before sending again."); setDeliveryUnknown(true);
    } finally { inFlight.current = false; setSending(false); }
  }

  const reviewDetails = stage !== "form" && <dl className="review-details">
    <div><dt>{t("Date")}</dt><dd>{displayDate(details.date, locale)}{details.flexibleDate && <><br /><span className="small">{t("Alternative dates are possible")}</span></>}</dd></div>
    <div><dt>{t("Preferred time")}</dt><dd>{details.flexibleTime ? t("Flexible — arrange with the team") : times.find(time => time.value === details.time)?.label}</dd></div>
    <div><dt>{t("Guests")}</dt><dd>{countText(details.guests, "guest")}{group && <><br /><span className="small">{t("Group enquiry")}</span></>}</dd></div>
    {group && <><div><dt>{t("Occasion")}</dt><dd>{details.occasion ? t(occasionLabels[details.occasion]) : t("Not specified")}</dd></div>
      <div><dt>{t("Menu preference")}</dt><dd>{t(menuLabels[details.menu] || "Help us decide")}</dd></div>
      {details.budget && <div><dt>{t("Budget per person")}</dt><dd>{details.budget} RON</dd></div>}</>}
    <div><dt>{t("Name")}</dt><dd>{details.name}</dd></div><div><dt>{t("Email")}</dt><dd>{details.email}</dd></div>
    <div><dt>{t("Phone")}</dt><dd>{details.phone}</dd></div>
    {details.notes && <div><dt>{t("Special requests")}</dt><dd>{details.notes}</dd></div>}
  </dl>;

  return <SiteShell active="book"><main id="main" className="menu-page native-service-page">
    <ServiceHeading booking />
    <div className="container"><ServiceNotice booking />
      <div className="booking-layout">
        <section className="booking-main" aria-labelledby="booking-form-title" aria-busy={sending}>
          <div className="service-section-heading"><h2 id="booking-form-title" ref={title} tabIndex={-1}>{t(stage === "sent" ? "Request sent" : stage === "review" ? "Review your request" : group ? "Plan your group visit" : "Your visit")}</h2><span className="small">{t(stage === "sent" ? "Awaiting restaurant confirmation" : "All times are local to Bucharest")}</span></div>
          {stage === "sent" ? <div className="booking-success" role="status">
            <p className="review-intro">{t(group ? "Your group enquiry has been sent to the restaurant." : "Your table request has been sent to the restaurant.")}</p>
            <p>{t("Your table is not reserved yet. The team will contact you by email or phone to confirm availability and arrangements.")}</p>
            <p className="booking-reference">{t("Reference")}<br /><strong>{reference}</strong></p>
            {reviewDetails}
            <a className="button button-green" href={l("/menu")}>{t("View our menu")} <Icon name="arrow" size={17} /></a>
            <p className="form-guidance">{t("For changes or a same-day visit, please call and quote your reference.")} <a href={restaurant.phoneHref}>{restaurant.phone}</a></p>
          </div> : stage === "review" ? <div className="booking-review">
            <p className="review-intro">{t("Check your details before sending. The restaurant must confirm your request before your table is reserved.")}</p>
            {reviewDetails}
            {error && <p className="service-form-error" role="alert" ref={errorBox} tabIndex={-1}>{t(error)} <a href={restaurant.phoneHref}>{restaurant.phone}</a></p>}
            <div className="booking-send-actions"><button className="button button-green" disabled={sending || deliveryUnknown} onClick={sendBooking}>{t(sending ? "Sending your request…" : group ? "Send group enquiry" : "Send table request")} <Icon name="arrow" size={18} /></button><button className="text-link" disabled={sending || deliveryUnknown} onClick={() => { setStage("form"); setError(""); }}>{t("Edit booking details")}</button></div>
            <p className="form-guidance">{t("Your contact details and preferences are emailed to the restaurant to handle this request. No payment is taken.")}</p>
          </div> : <form className="service-form booking-form" onSubmit={reviewBooking}>
            <div className="visit-fields">
              <label>{t("Guests")}<select value={group ? "group" : details.guests} onChange={event => {
                const large = event.target.value === "group"; setGroup(large);
                setDetails(current => ({ ...current, guests: large ? 12 : Number(event.target.value), flexibleDate: false, flexibleTime: false, occasion: "", menu: "unsure", budget: "" })); setError("");
              }}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{countText(index + 1, "guest")}</option>)}<option value="group">{t("11+ guests — group enquiry")}</option></select></label>
              <label>{t(group ? "Preferred date" : "Date")}<input type="date" min={today || undefined} value={details.date} required onChange={event => { const date = event.target.value; setDetails(current => ({ ...current, date, time: "" })); setError(date && !preferredTimes(date).length ? "We’re closed on Tuesdays. Please choose another day." : ""); }} /></label>
              <label>{t(group ? "Approximate arrival" : "Preferred time")}<select value={details.time} required={!details.flexibleTime} disabled={!times.length || details.flexibleTime} onChange={event => update("time", event.target.value)}><option value="">{t(details.flexibleTime ? "Flexible — arrange with the team" : details.date ? "Choose a time" : "Choose a date first")}</option>{times.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}</select></label>
            </div>
            {group && <fieldset className="group-booking-fields"><legend>{t("A little more about your group")}</legend>
              <p>{t("From 11 guests to a larger gathering, tell us what you have in mind. Seating, capacity and any group menu will be agreed with our team.")}</p>
              <label>{t("Estimated number of guests")}<input type="number" inputMode="numeric" min={11} max={999} step={1} required value={details.guests || ""} onChange={event => update("guests", Number(event.target.value))} /></label>
              <div className="group-size-shortcuts" aria-label={t("Quick group sizes")}>{[15, 30, 60].map(size => <button type="button" key={size} aria-pressed={details.guests === size} onClick={() => update("guests", size)}>{countText(size, "guest")}</button>)}</div>
              <div className="booking-flexibility"><label><input type="checkbox" checked={details.flexibleDate} onChange={event => update("flexibleDate", event.target.checked)} />{t("We can consider another date")}</label><label><input type="checkbox" checked={details.flexibleTime} onChange={event => setDetails(current => ({ ...current, flexibleTime: event.target.checked, time: "" }))} />{t("Our arrival time is flexible")}</label></div>
              <div className="contact-fields"><label>{t("Occasion")} <span className="field-optional">{t("(optional)")}</span><select value={details.occasion} onChange={event => update("occasion", event.target.value)}><option value="">{t("Select an occasion")}</option>{groupOccasions.map(value => <option key={value} value={value}>{t(occasionLabels[value])}</option>)}</select></label>
                <label>{t("Menu preference")}<select value={details.menu} onChange={event => update("menu", event.target.value)}>{groupMenus.map(value => <option key={value} value={value}>{t(menuLabels[value])}</option>)}</select></label></div>
              <label>{t("Budget per person (RON)")} <span className="field-optional">{t("(optional)")}</span><input type="number" inputMode="decimal" min={1} max={99999} step="0.01" value={details.budget} onChange={event => update("budget", event.target.value)} /><span className="form-guidance">{t("A guide for our conversation, not an agreed price.")}</span></label>
            </fieldset>}
            {error && <p className="service-form-error" role="alert" ref={errorBox} tabIndex={-1}>{t(error)}</p>}
            <p className="form-guidance">{t("Times follow our opening hours. Sending a request does not guarantee a table.")}</p>
            <div className="service-section-heading details-heading"><h2>{t("Your details")}</h2><span className="small">{t("So our team can get back to you")}</span></div>
            <label>{t("Full name")}<input name="name" autoComplete="name" required minLength={2} maxLength={100} value={details.name} onChange={event => update("name", event.target.value)} /></label>
            <div className="contact-fields"><label>{t("Email")}<input name="email" type="email" autoComplete="email" required maxLength={200} value={details.email} onChange={event => update("email", event.target.value)} /></label><label>{t("Phone number")}<input name="phone" type="tel" autoComplete="tel" required pattern={"[+0-9 .\\(\\)\\-]{7,30}"} title={t("Enter a phone number, including your country code.")} maxLength={30} value={details.phone} onChange={event => update("phone", event.target.value)} /></label></div>
            <label>{t(group ? "Tell us about your plans" : "Special requests")} <span className="field-optional">{t("(optional)")}</span><textarea rows={4} maxLength={1500} value={details.notes} onChange={event => update("notes", event.target.value)} placeholder={t(group ? "Your occasion, seating preferences, timings or anything else we should discuss" : "Anything you would like our team to know")} /></label>
            <div className="booking-honeypot" aria-hidden="true"><label>Website<input name="website" autoComplete="off" tabIndex={-1} value={website} onChange={event => setWebsite(event.target.value)} /></label></div>
            <div className="booking-form-bottom"><button className="button button-green" type="submit">{t(group ? "Review group enquiry" : "Review table request")} <Icon name="arrow" size={18} /></button><p className="small">{t("You can check everything before sending.")}</p></div>
          </form>}
        </section>
        <aside className="booking-visit" aria-labelledby="booking-visit-title"><img src="/assets/gallery-04-herbs-food-2.jpg" alt={t("Prawns and handmade dumplings at Global Herbs")} width="2048" height="1536" /><div className="booking-visit-copy"><p className="eyebrow">{t("A SEAT AT OUR TABLE")}</p><h2 id="booking-visit-title">Global Herbs</h2><p>{restaurant.building}<br />Str. Nicolae Tonitza 13<br />București 030167, Romania</p><a className="text-link" href={restaurant.maps} target="_blank" rel="noopener noreferrer">{t("Get directions")} <Icon name="external" size={16} /></a><div className="booking-hours"><h3>{t("Opening hours")}</h3><Hours /></div><p className="booking-contact">{t("A question about your visit?")}<br /><a href={restaurant.phoneHref}>{restaurant.phone}</a></p></div></aside>
      </div>
    </div>
  </main></SiteShell>;
}
